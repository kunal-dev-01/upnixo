package utils

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"server/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"gopkg.in/natefinch/lumberjack.v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT KEYS
// ─────────────────────────────────────────────────────────────────────────────

type ContextKey string

const (
	RequestIDKey ContextKey = "request_id"
	UserIDKey    ContextKey = "user_id"
)

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER
// ─────────────────────────────────────────────────────────────────────────────

type Logger struct {
	log zerolog.Logger
}

var (
	globalLogger *Logger
	initOnce     sync.Once
)

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

func Init(cfg *config.Config) {
	initOnce.Do(func() {
		zerolog.TimeFieldFormat = time.RFC3339

		level, err := zerolog.ParseLevel(cfg.Logger.Level)
		if err != nil {
			level = zerolog.InfoLevel
		}

		writers := buildWriters(cfg)
		output := zerolog.MultiLevelWriter(writers...)

		zCtx := zerolog.New(output).
			Level(level).
			With().
			Timestamp().
			Str("env", cfg.App.Env)

		if cfg.Logger.EnableCaller {
			zCtx = zCtx.Caller()
		}

		zl := zCtx.Logger()

		if cfg.Logger.EnableSampling && cfg.Logger.SamplingThereafter > 0 {
			zl = zl.Sample(&zerolog.BasicSampler{
				N: uint32(cfg.Logger.SamplingThereafter),
			})
		}

		globalLogger = &Logger{log: zl}
		zerolog.DefaultContextLogger = &globalLogger.log
	})
}

func buildWriters(cfg *config.Config) []io.Writer {
	var writers []io.Writer

	if cfg.Logger.EnableConsole {
		if cfg.App.IsDevelopment() {
			writers = append(writers, zerolog.ConsoleWriter{
				Out:        os.Stdout,
				TimeFormat: time.RFC3339,
			})
		} else {
			writers = append(writers, os.Stdout)
		}
	}

	if cfg.Logger.EnableFile && cfg.Logger.FilePath != "" {
		if err := os.MkdirAll(filepath.Dir(cfg.Logger.FilePath), 0o755); err != nil {
			fmt.Fprintf(os.Stderr, "logger: failed to create log directory: %v\n", err)
		} else {
			writers = append(writers, &lumberjack.Logger{
				Filename:   cfg.Logger.FilePath,
				MaxSize:    cfg.Logger.MaxSize,
				MaxBackups: cfg.Logger.MaxBackups,
				MaxAge:     cfg.Logger.MaxAge,
				Compress:   cfg.Logger.Compress,
			})
		}
	}

	return writers
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSOR
// ─────────────────────────────────────────────────────────────────────────────

// Get returns the global logger. Falls back to a stdout logger if Init was
// never called — safe to use in tests and early boot code.
func Get() *Logger {
	if globalLogger == nil {
		zl := zerolog.New(os.Stdout).With().Timestamp().Logger()
		return &Logger{log: zl}
	}
	return globalLogger
}

// Raw returns the underlying zerolog.Logger for libraries that require it.
func (l *Logger) Raw() *zerolog.Logger {
	return &l.log
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT ENRICHMENT
// ─────────────────────────────────────────────────────────────────────────────

// WithFiberCtx returns a zerolog.Logger enriched with HTTP request metadata.
func (l *Logger) WithFiberCtx(c *fiber.Ctx) *zerolog.Logger {
	zl := l.log

	if reqID, ok := c.Locals("requestid").(string); ok && reqID != "" {
		zl = zl.With().Str("request_id", reqID).Logger()
	}
	if userID, ok := c.Locals("user_id").(string); ok && userID != "" {
		zl = zl.With().Str("user_id", userID).Logger()
	}

	zl = zl.With().
		Str("method", c.Method()).
		Str("path", c.Path()).
		Str("ip", c.IP()).
		Logger()

	return &zl
}

// WithCtx returns a zerolog.Logger enriched with values from a standard context.
// Useful for background workers, queue consumers, and scheduled jobs.
func (l *Logger) WithCtx(ctx context.Context) *zerolog.Logger {
	zl := l.log

	if reqID, ok := ctx.Value(RequestIDKey).(string); ok && reqID != "" {
		zl = zl.With().Str("request_id", reqID).Logger()
	}
	if userID, ok := ctx.Value(UserIDKey).(string); ok && userID != "" {
		zl = zl.With().Str("user_id", userID).Logger()
	}

	return &zl
}

// ─────────────────────────────────────────────────────────────────────────────
// METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (l *Logger) Info(msg string, fields map[string]any) {
	l.log.Info().Fields(fields).Msg(msg)
}

func (l *Logger) Debug(msg string, fields map[string]any) {
	l.log.Debug().Fields(fields).Msg(msg)
}

func (l *Logger) Warn(msg string, fields map[string]any) {
	l.log.Warn().Fields(fields).Msg(msg)
}

func (l *Logger) Error(msg string, err error, fields map[string]any) {
	l.log.Error().Err(err).Fields(fields).Msg(msg)
}

// Fatal logs at FATAL level then calls os.Exit(1).
func (l *Logger) Fatal(msg string, err error, fields map[string]any) {
	l.log.Fatal().Err(err).Fields(fields).Msg(msg)
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

func Info(msg string, fields map[string]any)             { Get().Info(msg, fields) }
func Debug(msg string, fields map[string]any)            { Get().Debug(msg, fields) }
func Warn(msg string, fields map[string]any)             { Get().Warn(msg, fields) }
func Error(msg string, err error, fields map[string]any) { Get().Error(msg, err, fields) }
func Fatal(msg string, err error, fields map[string]any) { Get().Fatal(msg, err, fields) }
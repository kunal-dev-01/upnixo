package middleware

import (
	"time"

	"server/internal/config"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

type Logger struct {
	log *zerolog.Logger
	cfg *config.Config
}

func NewLogger(u *utils.Logger, cfg *config.Config) *Logger {
	return &Logger{
		log: u.Raw(),
		cfg: cfg,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP REQUEST MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

func (l *Logger) HTTP() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Assign request ID if not already set by fiber requestid middleware
		requestID, ok := c.Locals("requestid").(string)
		if !ok || requestID == "" {
			requestID = uuid.New().String()
			c.Locals("requestid", requestID)
		}

		err := c.Next()

		status := c.Response().StatusCode()
		if err != nil {
			if e, ok := err.(*fiber.Error); ok && status == fiber.StatusOK {
				status = e.Code
			}
		}

		event := l.levelFor(status)().
			Str("type", "http").
			Str("request_id", requestID).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", status).
			Dur("duration_ms", time.Since(start)).
			Str("ip", c.IP()).
			Str("user_agent", c.Get("User-Agent"))

		if userID, ok := c.Locals("user_id").(string); ok && userID != "" {
			event = event.Str("user_id", userID)
		}

		if err != nil {
			event = event.Err(err)
		}

		event.Msg("http request")

		return err
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// PANIC RECOVERY MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

func (l *Logger) Recovery() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			r := recover()
			if r == nil {
				return
			}

			requestID, _ := c.Locals("requestid").(string)

			event := l.log.Error().
				Str("type", "panic").
				Str("request_id", requestID).
				Str("method", c.Method()).
				Str("path", c.Path()).
				Interface("panic", r)

			if l.cfg.Logger.EnableStackTrace {
				event = event.Stack()
			}

			event.Msg("panic recovered")

			// Never expose internals — give user a ref_id for support
			if err := c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "something went wrong",
				"ref_id":  requestID,
			}); err != nil {
				l.log.Error().Err(err).Msg("failed to write panic response")
			}
		}()

		return c.Next()
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// levelFor returns the correct zerolog event constructor based on HTTP status.
func (l *Logger) levelFor(status int) func() *zerolog.Event {
	switch {
	case status >= 500:
		return l.log.Error
	case status >= 400:
		return l.log.Warn
	default:
		return l.log.Info
	}
}

package db

import (
	"context"
	"fmt"
	"time"

	"server/internal/config"
	"server/internal/utils"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool is the globally accessible pgx connection pool.
var Pool *pgxpool.Pool

// Connect initializes the PostgreSQL connection pool with retries.
func Connect(cfg *config.Config) error {
	poolConfig, err := pgxpool.ParseConfig(cfg.Database.GetDSN())
	if err != nil {
		utils.Error("Failed to parse database DSN", err, nil)
		return fmt.Errorf("parse dsn: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.Database.MaxOpenConns)
	poolConfig.MinConns = int32(cfg.Database.MaxIdleConns)
	poolConfig.MaxConnLifetime = cfg.Database.ConnMaxLifetime
	poolConfig.MaxConnIdleTime = cfg.Database.ConnMaxIdleTime
	poolConfig.HealthCheckPeriod = 1 * time.Minute

	pool, err := connectWithRetry(cfg, poolConfig)
	if err != nil {
		utils.Error("Failed to connect to database after maximum retries", err, nil)
		return fmt.Errorf("database connection failed: %w", err)
	}

	Pool = pool

	utils.Info("PostgreSQL connected successfully", map[string]any{
		"host":      cfg.Database.Host,
		"port":      cfg.Database.Port,
		"db":        cfg.Database.DBName,
		"max_conns": cfg.Database.MaxOpenConns,
		"min_conns": cfg.Database.MaxIdleConns,
		"driver":    "pgx/v5",
	})

	return nil
}

// Close gracefully shuts down the connection pool.
func Close() {
	if Pool == nil {
		return
	}
	Pool.Close()
	utils.Info("Database connection pool closed", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func connectWithRetry(cfg *config.Config, poolConfig *pgxpool.Config) (*pgxpool.Pool, error) {
	var (
		pool *pgxpool.Pool
		err  error
	)

	for attempt := 1; attempt <= cfg.Database.RetryAttempts; attempt++ {
		pool, err = tryConnect(cfg, poolConfig)
		if err == nil {
			return pool, nil
		}

		utils.Warn(fmt.Sprintf("Database connection attempt %d/%d failed", attempt, cfg.Database.RetryAttempts), map[string]any{
			"error": err.Error(),
		})

		if attempt < cfg.Database.RetryAttempts {
			time.Sleep(cfg.Database.RetryDelay)
		}
	}

	return nil, err
}

func tryConnect(cfg *config.Config, poolConfig *pgxpool.Config) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Database.ConnectTimeout)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, err
	}

	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

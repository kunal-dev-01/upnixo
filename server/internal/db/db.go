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
// Accepts a context so startup can be cancelled (consistent with
// broker.Connect and redis.Connect).
func Connect(ctx context.Context, cfg *config.Config) error {
	poolConfig, err := pgxpool.ParseConfig(cfg.Database.GetDSN())
	if err != nil {
		utils.Error("failed to parse database DSN", err, nil)
		return fmt.Errorf("parse dsn: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.Database.MaxOpenConns)
	poolConfig.MinConns = int32(cfg.Database.MaxIdleConns)
	poolConfig.MaxConnLifetime = cfg.Database.ConnMaxLifetime
	poolConfig.MaxConnIdleTime = cfg.Database.ConnMaxIdleTime
	poolConfig.HealthCheckPeriod = 1 * time.Minute

	pool, err := connectWithRetry(ctx, cfg, poolConfig)
	if err != nil {
		utils.Error("failed to connect to database after maximum retries", err, nil)
		return fmt.Errorf("database connection failed: %w", err)
	}

	Pool = pool

	utils.Info("postgresql connected", map[string]any{
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
	utils.Info("database connection pool closed", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func connectWithRetry(ctx context.Context, cfg *config.Config, poolConfig *pgxpool.Config) (*pgxpool.Pool, error) {
	var (
		pool *pgxpool.Pool
		err  error
	)

	for attempt := 1; attempt <= cfg.Database.RetryAttempts; attempt++ {
		pool, err = tryConnect(ctx, cfg, poolConfig)
		if err == nil {
			return pool, nil
		}

		utils.Warn(fmt.Sprintf("database connection attempt %d/%d failed", attempt, cfg.Database.RetryAttempts), map[string]any{
			"error": err.Error(),
		})

		if attempt < cfg.Database.RetryAttempts {
			select {
			case <-ctx.Done():
				return nil, fmt.Errorf("database: connect cancelled: %w", ctx.Err())
			case <-time.After(cfg.Database.RetryDelay):
			}
		}
	}

	return nil, err
}

func tryConnect(ctx context.Context, cfg *config.Config, poolConfig *pgxpool.Config) (*pgxpool.Pool, error) {
	connectCtx, cancel := context.WithTimeout(ctx, cfg.Database.ConnectTimeout)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(connectCtx, poolConfig)
	if err != nil {
		return nil, err
	}

	if err = pool.Ping(connectCtx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

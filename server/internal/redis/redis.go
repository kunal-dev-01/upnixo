package redis

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"server/internal/config"
	"server/internal/utils"

	"github.com/redis/go-redis/v9"
)

// ─────────────────────────────────────────────────────────────────────────────
// REDIS
// ─────────────────────────────────────────────────────────────────────────────

// Redis wraps go-redis with lifecycle management.
// Safe for concurrent use.
type Redis struct {
	mu     sync.RWMutex
	client *redis.Client
	cfg    *config.Config
	closed bool
}

// New creates a Redis instance without connecting.
func New(cfg *config.Config) *Redis {
	return &Redis{cfg: cfg}
}

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

// Connect initializes the connection pool with retry.
func (r *Redis) Connect(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.closed {
		return fmt.Errorf("redis: instance is closed")
	}

	opts := &redis.Options{
		Addr:     r.cfg.Redis.GetRedisAddr(),
		Password: r.cfg.Redis.Password,
		DB:       r.cfg.Redis.DB,

		// Pool
		PoolSize:        r.cfg.Redis.PoolSize,
		MinIdleConns:    max(r.cfg.Redis.PoolSize/4, 2),
		PoolTimeout:     r.cfg.Redis.PoolTimeout,
		ConnMaxLifetime: r.cfg.Redis.MaxConnAge,
		ConnMaxIdleTime: r.cfg.Redis.IdleTimeout,

		// Timeouts
		DialTimeout:  r.cfg.Redis.DialTimeout,
		ReadTimeout:  r.cfg.Redis.ReadTimeout,
		WriteTimeout: r.cfg.Redis.WriteTimeout,

		// Client-side retry (network blips)
		MaxRetries:      r.cfg.Redis.MaxRetries,
		MinRetryBackoff: 8 * time.Millisecond,
		MaxRetryBackoff: 512 * time.Millisecond,

		OnConnect: func(ctx context.Context, _ *redis.Conn) error {
			utils.Debug("redis new connection established", nil)
			return nil
		},
	}

	r.client = redis.NewClient(opts)

	var lastErr error
	for i := 1; i <= r.cfg.Redis.RetryAttempts; i++ {
		pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		lastErr = r.client.Ping(pingCtx).Err()
		cancel()

		if lastErr == nil {
			utils.Info("redis connected", map[string]any{
				"host":      r.cfg.Redis.Host,
				"port":      r.cfg.Redis.Port,
				"db":        r.cfg.Redis.DB,
				"pool_size": r.cfg.Redis.PoolSize,
				"min_idle":  opts.MinIdleConns,
			})
			return nil
		}

		utils.Warn("redis ping failed", map[string]any{
			"attempt": i,
			"max":     r.cfg.Redis.RetryAttempts,
			"error":   lastErr.Error(),
		})

		if i < r.cfg.Redis.RetryAttempts {
			select {
			case <-ctx.Done():
				r.client = nil
				return fmt.Errorf("redis: connect cancelled: %w", ctx.Err())
			case <-time.After(r.cfg.Redis.RetryDelay):
			}
		}
	}

	r.client = nil
	return fmt.Errorf("redis: connection failed after %d attempts: %w",
		r.cfg.Redis.RetryAttempts, lastErr)
}

// Close gracefully shuts down the client.
func (r *Redis) Close() error {
	r.mu.Lock()
	r.closed = true
	client := r.client
	r.client = nil
	r.mu.Unlock()

	if client == nil {
		return nil
	}

	if err := client.Close(); err != nil {
		utils.Error("redis close error", err, nil)
		return err
	}

	utils.Info("redis closed gracefully", nil)
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSORS
// ─────────────────────────────────────────────────────────────────────────────

// Client returns the underlying redis.Client.
func (r *Redis) Client() (*redis.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if r.closed {
		return nil, fmt.Errorf("redis: instance is closed")
	}
	if r.client == nil {
		return nil, fmt.Errorf("redis: not connected")
	}
	return r.client, nil
}

// IsConnected reports if the client can ping successfully.
func (r *Redis) IsConnected(ctx context.Context) bool {
	r.mu.RLock()
	client := r.client
	r.mu.RUnlock()

	if client == nil {
		return false
	}
	return client.Ping(ctx).Err() == nil
}

// Stats returns pool statistics for monitoring.
func (r *Redis) Stats() *redis.PoolStats {
	r.mu.RLock()
	client := r.client
	r.mu.RUnlock()

	if client == nil {
		return nil
	}
	return client.PoolStats()
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Get returns the value for key.
// Returns ("", nil) when the key does not exist — check with IsNotFound.
func (r *Redis) Get(ctx context.Context, key string) (string, error) {
	client, err := r.Client()
	if err != nil {
		return "", err
	}

	val, err := client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", nil // key not found — not an error
	}
	return val, err
}

// Set stores key with value and TTL.
func (r *Redis) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	client, err := r.Client()
	if err != nil {
		return err
	}
	return client.Set(ctx, key, value, ttl).Err()
}

// SetNX atomically sets key only if it does not exist.
// Returns true if the key was set, false if it already existed.
// Use this for all token creation — prevents duplicate token overwrites.
func (r *Redis) SetNX(ctx context.Context, key string, value any, ttl time.Duration) (bool, error) {
	client, err := r.Client()
	if err != nil {
		return false, err
	}
	return client.SetNX(ctx, key, value, ttl).Result()
}

// Del deletes one or more keys.
func (r *Redis) Del(ctx context.Context, keys ...string) error {
	client, err := r.Client()
	if err != nil {
		return err
	}
	return client.Del(ctx, keys...).Err()
}

// Exists reports how many of the given keys exist.
func (r *Redis) Exists(ctx context.Context, keys ...string) (int64, error) {
	client, err := r.Client()
	if err != nil {
		return 0, err
	}
	return client.Exists(ctx, keys...).Result()
}

// Incr atomically increments key by 1 and returns the new value.
// Key is created with value 1 if it does not exist.
// Useful for rate limiting (login attempts, OTP attempts).
func (r *Redis) Incr(ctx context.Context, key string) (int64, error) {
	client, err := r.Client()
	if err != nil {
		return 0, err
	}
	return client.Incr(ctx, key).Result()
}

// Expire sets a TTL on an existing key.
// Returns true if the TTL was set, false if key does not exist.
func (r *Redis) Expire(ctx context.Context, key string, ttl time.Duration) (bool, error) {
	client, err := r.Client()
	if err != nil {
		return false, err
	}
	return client.Expire(ctx, key, ttl).Result()
}

// TTL returns the remaining TTL of a key.
// Returns -2 if key does not exist, -1 if key has no TTL.
func (r *Redis) TTL(ctx context.Context, key string) (time.Duration, error) {
	client, err := r.Client()
	if err != nil {
		return 0, err
	}
	return client.TTL(ctx, key).Result()
}

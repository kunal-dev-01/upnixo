package redis

import (
	"context"
	"fmt"
	"sync"
	"time"

	"server/internal/config"
	"server/internal/utils"

	"github.com/redis/go-redis/v9"
)

// Redis wraps go-redis client with lifecycle management.
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

		// Retry
		MaxRetries:      r.cfg.Redis.MaxRetries,
		MinRetryBackoff: 8 * time.Millisecond,
		MaxRetryBackoff: 512 * time.Millisecond,

		// Hook for logging new connections
		OnConnect: func(ctx context.Context, cn *redis.Conn) error {
			utils.Debug("Redis new connection established", nil)
			return nil
		},
	}

	r.client = redis.NewClient(opts)

	// Retry ping with fresh context each time
	var lastErr error
	for i := 1; i <= r.cfg.Redis.RetryAttempts; i++ {
		pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		lastErr = r.client.Ping(pingCtx).Err()
		cancel()

		if lastErr == nil {
			utils.Info("Redis connected", map[string]any{
				"host":      r.cfg.Redis.Host,
				"port":      r.cfg.Redis.Port,
				"db":        r.cfg.Redis.DB,
				"pool_size": r.cfg.Redis.PoolSize,
				"min_idle":  opts.MinIdleConns,
			})
			return nil
		}

		utils.Warn("Redis connection failed", map[string]any{
			"attempt": i,
			"max":     r.cfg.Redis.RetryAttempts,
			"error":   lastErr.Error(),
		})

		if i < r.cfg.Redis.RetryAttempts {
			select {
			case <-ctx.Done():
				return fmt.Errorf("redis: connect cancelled: %w", ctx.Err())
			case <-time.After(r.cfg.Redis.RetryDelay):
			}
		}
	}

	r.client = nil
	return fmt.Errorf("redis: connection failed after %d attempts: %w",
		r.cfg.Redis.RetryAttempts, lastErr)
}

// Client returns the underlying redis.Client.
// Returns error if not connected or closed.
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

// Close gracefully shuts down with timeout.
func (r *Redis) Close(ctx context.Context) error {
	r.mu.Lock()
	r.closed = true
	client := r.client
	r.client = nil
	r.mu.Unlock()

	if client == nil {
		return nil
	}

	done := make(chan error, 1)
	go func() {
		done <- client.Close()
	}()

	select {
	case err := <-done:
		if err != nil {
			utils.Error("Redis close error", err, nil)
			return err
		}
		utils.Info("Redis closed gracefully", nil)
		return nil
	case <-ctx.Done():
		utils.Warn("Redis close timed out", nil)
		return fmt.Errorf("redis: close timed out: %w", ctx.Err())
	}
}

// ─── Convenience Methods (Optional but handy for FaaS) ──────────────────────

func (r *Redis) Get(ctx context.Context, key string) (string, error) {
	client, err := r.Client()
	if err != nil {
		return "", err
	}
	return client.Get(ctx, key).Result()
}

func (r *Redis) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	client, err := r.Client()
	if err != nil {
		return err
	}
	return client.Set(ctx, key, value, ttl).Err()
}

func (r *Redis) Del(ctx context.Context, keys ...string) error {
	client, err := r.Client()
	if err != nil {
		return err
	}
	return client.Del(ctx, keys...).Err()
}

func (r *Redis) Exists(ctx context.Context, keys ...string) (int64, error) {
	client, err := r.Client()
	if err != nil {
		return 0, err
	}
	return client.Exists(ctx, keys...).Result()
}

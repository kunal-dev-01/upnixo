package broker

import (
	"context"
	"fmt"
	"sync"
	"time"

	"server/internal/config"
	"server/internal/utils"

	amqp "github.com/rabbitmq/amqp091-go"
)

// ─────────────────────────────────────────────────────────────────────────────
// BROKER
// ─────────────────────────────────────────────────────────────────────────────

// RabbitBroker manages a single RabbitMQ connection with auto-reconnect.
// Safe for concurrent use.
type RabbitBroker struct {
	mu     sync.RWMutex
	conn   *amqp.Connection
	cfg    *config.Config
	closed bool
	ctx    context.Context
	cancel context.CancelFunc
}

// New creates a broker instance. Call Connect() before use.
func New(cfg *config.Config) *RabbitBroker {
	ctx, cancel := context.WithCancel(context.Background())
	return &RabbitBroker{cfg: cfg, ctx: ctx, cancel: cancel}
}

// Connect establishes connection with retry and starts the reconnect watcher.
// Accepts a context so startup can be cancelled (consistent with Redis.Connect).
func (b *RabbitBroker) Connect(ctx context.Context) error {
	if err := b.connectWithRetry(ctx); err != nil {
		return err
	}
	go b.watchConnection()
	return nil
}

// IsConnected reports whether the underlying connection is open.
func (b *RabbitBroker) IsConnected() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.conn != nil && !b.conn.IsClosed()
}

// Channel opens a new channel from the current connection.
// Caller must close the channel when done.
func (b *RabbitBroker) Channel() (*amqp.Channel, error) {
	b.mu.RLock()
	conn := b.conn
	b.mu.RUnlock()

	if conn == nil || conn.IsClosed() {
		return nil, fmt.Errorf("rabbitmq: not connected")
	}
	return conn.Channel()
}

// Close gracefully shuts down the broker and stops reconnection.
func (b *RabbitBroker) Close() error {
	b.mu.Lock()
	b.closed = true
	conn := b.conn
	b.conn = nil
	b.mu.Unlock()

	b.cancel()

	if conn != nil && !conn.IsClosed() {
		return conn.Close()
	}
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func (b *RabbitBroker) connectWithRetry(ctx context.Context) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.closed {
		return fmt.Errorf("rabbitmq: broker is closed")
	}

	url := b.cfg.RabbitMQ.GetURL()
	var lastErr error

	for i := 1; i <= b.cfg.RabbitMQ.MaxRetries; i++ {
		b.conn, lastErr = amqp.Dial(url)
		if lastErr == nil {
			break
		}

		utils.Warn("rabbitmq connection attempt failed", map[string]any{
			"attempt": i,
			"max":     b.cfg.RabbitMQ.MaxRetries,
			"error":   lastErr.Error(),
		})

		if i < b.cfg.RabbitMQ.MaxRetries {
			select {
			case <-ctx.Done():
				return fmt.Errorf("rabbitmq: connect cancelled: %w", ctx.Err())
			case <-time.After(b.cfg.RabbitMQ.RetryDelay):
			}
		}
	}

	if lastErr != nil {
		return fmt.Errorf("rabbitmq: connection failed after %d attempts: %w",
			b.cfg.RabbitMQ.MaxRetries, lastErr)
	}

	utils.Info("rabbitmq connected", map[string]any{
		"host":  b.cfg.RabbitMQ.Host,
		"vhost": b.cfg.RabbitMQ.VHost,
	})

	return nil
}

func (b *RabbitBroker) watchConnection() {
	for {
		b.mu.RLock()
		conn := b.conn
		closed := b.closed
		b.mu.RUnlock()

		if closed || conn == nil {
			return
		}

		closeCh := conn.NotifyClose(make(chan *amqp.Error, 1))

		select {
		case <-b.ctx.Done():
			return
		case amqpErr, ok := <-closeCh:
			if !ok {
				return
			}
			if amqpErr != nil {
				utils.Error("rabbitmq connection dropped", amqpErr, nil)
			}
		}

		// Reconnect loop — uses background context since startup ctx may be done
		for {
			b.mu.RLock()
			isClosed := b.closed
			b.mu.RUnlock()

			if isClosed {
				return
			}

			if err := b.connectWithRetry(context.Background()); err == nil {
				utils.Info("rabbitmq reconnected", nil)
				break
			}

			utils.Warn("rabbitmq reconnect failed, retrying in 5s", nil)

			select {
			case <-time.After(5 * time.Second):
			case <-b.ctx.Done():
				return
			}
		}
	}
}

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

// RabbitBroker manages a single RabbitMQ connection with auto-reconnect.
// It is safe for concurrent use.
type RabbitBroker struct {
	mu       sync.RWMutex
	conn     *amqp.Connection
	cfg      *config.Config
	closed   bool          // true when Close() is called intentionally
	ctx      context.Context
	cancel   context.CancelFunc
}

// New creates a broker instance. Call Connect() before use.
func New(cfg *config.Config) *RabbitBroker {
	ctx, cancel := context.WithCancel(context.Background())
	return &RabbitBroker{
		cfg:    cfg,
		ctx:    ctx,
		cancel: cancel,
	}
}

// Connect establishes connection with retry and starts the watcher.
func (b *RabbitBroker) Connect() error {
	if err := b.connectWithRetry(); err != nil {
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

// Channel creates a new channel from the current connection.
// Callers must close the channel when done.
// Returns error if not connected.
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

	b.cancel() // stop watcher goroutine

	if conn != nil && !conn.IsClosed() {
		return conn.Close()
	}
	return nil
}

// ─── Internal ───────────────────────────────────────────────────────────────

func (b *RabbitBroker) connectWithRetry() error {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.closed {
		return fmt.Errorf("rabbitmq: broker is closed")
	}

	url := b.cfg.RabbitMQ.GetURL()
	var err error

	for i := 1; i <= b.cfg.RabbitMQ.MaxRetries; i++ {
		b.conn, err = amqp.Dial(url)
		if err == nil {
			break
		}

		utils.Warn("RabbitMQ connection failed", map[string]any{
			"attempt": i,
			"max":     b.cfg.RabbitMQ.MaxRetries,
			"error":   err.Error(),
		})

		if i < b.cfg.RabbitMQ.MaxRetries {
			time.Sleep(b.cfg.RabbitMQ.RetryDelay)
		}
	}

	if err != nil {
		return fmt.Errorf("rabbitmq: connection failed after %d attempts: %w",
			b.cfg.RabbitMQ.MaxRetries, err)
	}

	utils.Info("RabbitMQ connected", map[string]any{
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

		// Block until connection closes or context is cancelled
		closeCh := conn.NotifyClose(make(chan *amqp.Error, 1))
		select {
		case <-b.ctx.Done():
			return
		case err, ok := <-closeCh:
			if !ok {
				return
			}
			if err != nil {
				utils.Error("RabbitMQ connection dropped", err, nil)
			}
		}

		// Reconnect loop
		for {
			b.mu.RLock()
			isClosed := b.closed
			b.mu.RUnlock()

			if isClosed {
				return
			}

			if err := b.connectWithRetry(); err == nil {
				utils.Info("RabbitMQ reconnected", nil)
				break
			}

			utils.Warn("RabbitMQ reconnection failed, retrying...", nil)
			select {
			case <-time.After(5 * time.Second):
			case <-b.ctx.Done():
				return
			}
		}
	}
}
package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"server/internal/broker"
	"server/internal/config"
	"server/internal/utils"

	amqp "github.com/rabbitmq/amqp091-go"
)

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const publishTimeout = 5 * time.Second

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER
// ─────────────────────────────────────────────────────────────────────────────

type Manager struct {
	cfg    *config.Config
	broker *broker.RabbitBroker
}

func NewManager(cfg *config.Config, b *broker.RabbitBroker) *Manager {
	return &Manager{cfg: cfg, broker: b}
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────

// SetupQueues declares all application queues. Idempotent — safe on every startup.
func (m *Manager) SetupQueues() error {
	queues := m.allQueues()

	ch, err := m.broker.Channel()
	if err != nil {
		utils.Error("queue setup: channel open failed", err, nil)
		return fmt.Errorf("queue setup channel: %w", err)
	}
	defer ch.Close()

	for _, name := range queues {
		if _, err := ch.QueueDeclare(name, true, false, false, false, nil); err != nil {
			utils.Error("queue declare failed", err, map[string]any{"queue": name})
			return fmt.Errorf("declare queue %q: %w", name, err)
		}
	}

	utils.Info("queues declared", map[string]any{"queues": queues})
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISH
// ─────────────────────────────────────────────────────────────────────────────

// Publish serializes body as JSON and publishes it to queueName with
// persistent delivery and a 5-second context timeout.
func (m *Manager) Publish(queueName string, body any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		utils.Error("queue publish: marshal failed", err, map[string]any{"queue": queueName})
		return utils.Internal(err)
	}

	ch, err := m.broker.Channel()
	if err != nil {
		utils.Error("queue publish: channel open failed", err, map[string]any{"queue": queueName})
		return utils.Internal(err)
	}
	defer ch.Close()

	ctx, cancel := context.WithTimeout(context.Background(), publishTimeout)
	defer cancel()

	err = ch.PublishWithContext(ctx,
		"",
		queueName,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         payload,
		},
	)
	if err != nil {
		utils.Error("queue publish failed", err, map[string]any{"queue": queueName})
		return utils.Internal(err)
	}

	utils.Debug("message published", map[string]any{"queue": queueName})
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// allQueues returns every queue name this application owns.
// Add new queues here as the platform grows.
func (m *Manager) allQueues() []string {
	return []string{
		m.cfg.RabbitMQ.EmailQueue, // auth emails — verify, reset, 2fa
	}
}

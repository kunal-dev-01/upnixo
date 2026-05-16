package worker

import (
	"context"
	"encoding/json"
	"server/internal/broker"
	"server/internal/config"
	"server/internal/service/chat"
	"server/internal/utils"

	amqp "github.com/rabbitmq/amqp091-go"
)

type MediaWorker struct {
	cfg *config.Config
	brk *broker.RabbitBroker
	svc *service.MediaService
	log *utils.Logger
}

func NewMediaWorker(cfg *config.Config, brk *broker.RabbitBroker, svc *service.MediaService, log *utils.Logger) *MediaWorker {
	return &MediaWorker{cfg: cfg, brk: brk, svc: svc, log: log}
}

// Start initiates the consumer loop.
func (w *MediaWorker) Start(ctx context.Context) error {
	ch, err := w.brk.Channel()
	if err != nil {
		return err
	}

	// Ensure queue exists
	_, err = ch.QueueDeclare(
		w.cfg.RabbitMQ.MediaQueue,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		return err
	}

	msgs, err := ch.Consume(
		w.cfg.RabbitMQ.MediaQueue,
		"",    // consumer
		false, // auto-ack (we use manual ack for safety)
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		return err
	}

	w.log.Info("media optimization worker started", map[string]any{"queue": w.cfg.RabbitMQ.MediaQueue})

	go func() {
		for {
			select {
			case <-ctx.Done():
				ch.Close()
				return
			case d, ok := <-msgs:
				if !ok {
					return
				}
				w.processTask(ctx, d)
			}
		}
	}()

	return nil
}

func (w *MediaWorker) processTask(ctx context.Context, d amqp.Delivery) {
	var task service.MediaTask
	if err := json.Unmarshal(d.Body, &task); err != nil {
		w.log.Error("failed to unmarshal media task", err, nil)
		d.Reject(false) // Don't requeue malformed JSON
		return
	}

	w.log.Debug("processing media optimization", map[string]any{"msg_id": task.MsgID})

	if err := w.svc.OptimizeImage(ctx, task); err != nil {
		w.log.Error("media optimization failed", err, map[string]any{"msg_id": task.MsgID})
		// Requeue if it's a transient error, otherwise reject
		d.Nack(false, true) 
		return
	}

	d.Ack(false)
}

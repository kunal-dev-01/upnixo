package email

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

const (
	EmailQueue = "email_queue"

	TemplateVerifyEmail        = "VerifyEmail"
	TemplateResetPassword      = "ResetPassword"
	TemplateAdminLoginCode     = "AdminLoginVerify"
	TemplateAdminResetPassword = "ResetAdminPassword"
	TemplateSecretReset        = "ResetAdminSecret"
)

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type EmailMessage struct {
	To           string            `json:"to"`
	TemplateName string            `json:"template_name"`
	TemplateData map[string]string `json:"template_data"`
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type EmailService struct {
	cfg    *config.Config
	broker *broker.RabbitBroker
}

func NewEmailService(cfg *config.Config, b *broker.RabbitBroker) *EmailService {
	return &EmailService{cfg: cfg, broker: b}
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE
// ─────────────────────────────────────────────────────────────────────────────

func (s *EmailService) DeclareQueue() error {
	ch, err := s.broker.Channel()
	if err != nil {
		utils.Error("email queue: channel open failed", err, nil)
		return fmt.Errorf("email queue channel: %w", err)
	}
	defer ch.Close()

	_, err = ch.QueueDeclare(EmailQueue, true, false, false, false, nil)
	if err != nil {
		utils.Error("email queue declare failed", err, nil)
		return fmt.Errorf("email queue declare: %w", err)
	}

	utils.Info("email queue declared", map[string]any{"queue": EmailQueue})
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCERS
// ─────────────────────────────────────────────────────────────────────────────

func (s *EmailService) SendVerificationEmail(name, email, token string) error {
	return s.publish(EmailMessage{
		To:           email,
		TemplateName: TemplateVerifyEmail,
		TemplateData: map[string]string{
			"user_name":        name,
			"verification_url": fmt.Sprintf("%s?token=%s", s.cfg.Frontend.VerificationUrl, token),
		},
	})
}

func (s *EmailService) SendPasswordResetEmail(name, email, token string) error {
	return s.publish(EmailMessage{
		To:           email,
		TemplateName: TemplateResetPassword,
		TemplateData: map[string]string{
			"user_name": name,
			"reset_url": fmt.Sprintf("%s?token=%s", s.cfg.Frontend.ResetUrl, token),
		},
	})
}

func (s *EmailService) SendLoginCodeEmail(name, email, code string) error {
	return s.publish(EmailMessage{
		To:           email,
		TemplateName: TemplateAdminLoginCode,
		TemplateData: map[string]string{
			"admin_name": name,
			"login_code": code,
		},
	})
}

// Admin and secret password resets use the same template but different URLs
func (s *EmailService) SendAdminPasswordResetEmail(name, email, token string) error {
	return s.publish(EmailMessage{
		To:           email,
		TemplateName: TemplateAdminResetPassword,
		TemplateData: map[string]string{
			"admin_name": name,
			"reset_url":  fmt.Sprintf("%s?token=%s", s.cfg.Frontend.AdminResetPasswordUrl, token),
		},
	})
}

func (s *EmailService) SendSecretResetEmail(name, email, token string) error {
	return s.publish(EmailMessage{
		To:           email,
		TemplateName: TemplateSecretReset,
		TemplateData: map[string]string{
			"admin_name": name,
			"reset_url":  fmt.Sprintf("%s?token=%s", s.cfg.Frontend.SecretResetUrl, token),
		},
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func (s *EmailService) publish(msg EmailMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		utils.Error("email marshal failed", err, nil)
		return utils.Internal(err)
	}

	ch, err := s.broker.Channel()
	if err != nil {
		utils.Error("email publish: channel open failed", err, map[string]any{
			"to":       msg.To,
			"template": msg.TemplateName,
		})
		return utils.Internal(err)
	}
	defer ch.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = ch.PublishWithContext(ctx,
		"",
		EmailQueue,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		},
	)
	if err != nil {
		utils.Error("email publish failed", err, map[string]any{
			"to":       msg.To,
			"template": msg.TemplateName,
		})
		return utils.Internal(err)
	}

	utils.Debug("email queued", map[string]any{
		"to":       msg.To,
		"template": msg.TemplateName,
	})
	return nil
}

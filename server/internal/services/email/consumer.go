package service

import (
	"encoding/json"
	"fmt"
	"math"
	"time"

	"server/internal/broker"
	"server/internal/config"
	"server/internal/utils"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	amqp "github.com/rabbitmq/amqp091-go"
)

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const (
	maxRetries     = 3
	retryBaseDelay = 10 * time.Second // backoff: 10s → 20s → 40s
	retryHeaderKey = "x-retry-count"
)

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMER
// ─────────────────────────────────────────────────────────────────────────────

// StartEmailConsumer opens a dedicated channel, registers a consumer, and
// spins up a background goroutine to process email jobs via AWS SES.
//
// Call once at startup after broker.Connect and EmailService.DeclareQueue.
func StartEmailConsumer(cfg *config.Config, b *broker.RabbitBroker) error {
	ch, err := b.Channel()
	if err != nil {
		utils.Error("consumer channel open failed", err, nil)
		return fmt.Errorf("consumer channel: %w", err)
	}

	// One message at a time — back-pressure control
	if err = ch.Qos(1, 0, false); err != nil {
		ch.Close()
		utils.Error("consumer QoS failed", err, nil)
		return fmt.Errorf("consumer qos: %w", err)
	}

	msgs, err := ch.Consume(
		EmailQueue,
		"",    // auto-generated consumer tag
		false, // manual ack
		false, false, false, nil,
	)
	if err != nil {
		ch.Close()
		utils.Error("consumer register failed", err, nil)
		return fmt.Errorf("consumer register: %w", err)
	}

	sesClient, err := buildSESClient(cfg)
	if err != nil {
		ch.Close()
		return err
	}

	utils.Info("email consumer started", map[string]any{"queue": EmailQueue})

	go process(ch, msgs, sesClient, cfg.AWS.AWSFromEmail)

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

func process(ch *amqp.Channel, msgs <-chan amqp.Delivery, sesClient *ses.SES, fromEmail string) {
	defer ch.Close()

	for msg := range msgs {
		handleDelivery(ch, msg, sesClient, fromEmail)
	}

	utils.Warn("email consumer channel closed", nil)
}

func handleDelivery(ch *amqp.Channel, msg amqp.Delivery, sesClient *ses.SES, fromEmail string) {
	retryCount := extractRetryCount(msg.Headers)

	var email EmailMessage
	if err := json.Unmarshal(msg.Body, &email); err != nil {
		utils.Error("email unmarshal failed — discarding", err, map[string]any{
			"body": string(msg.Body),
		})
		_ = msg.Nack(false, false) // poison pill — do not requeue
		return
	}

	if err := sendViaSES(sesClient, fromEmail, email); err != nil {
		handleSendFailure(ch, msg, email, err, retryCount)
		return
	}

	utils.Info("email sent", map[string]any{
		"to":       email.To,
		"template": email.TemplateName,
	})
	_ = msg.Ack(false)
}

// ─────────────────────────────────────────────────────────────────────────────
// SES
// ─────────────────────────────────────────────────────────────────────────────

func sendViaSES(client *ses.SES, fromEmail string, email EmailMessage) error {
	templateData, err := json.Marshal(email.TemplateData)
	if err != nil {
		return fmt.Errorf("template data marshal: %w", err)
	}

	_, err = client.SendTemplatedEmail(&ses.SendTemplatedEmailInput{
		Source: aws.String(fromEmail),
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(email.To)},
		},
		Template:     aws.String(email.TemplateName),
		TemplateData: aws.String(string(templateData)),
	})
	return err
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILURE HANDLING
// ─────────────────────────────────────────────────────────────────────────────

func handleSendFailure(ch *amqp.Channel, msg amqp.Delivery, email EmailMessage, err error, retryCount int) {
	utils.Error("SES send failed", err, map[string]any{
		"to":          email.To,
		"template":    email.TemplateName,
		"retry_count": retryCount,
	})

	// Permanent SES errors — discard immediately, no retry
	if isPermanentSESError(err) {
		utils.Warn("permanent SES error — discarding", map[string]any{
			"to":    email.To,
			"error": err.Error(),
		})
		_ = msg.Nack(false, false)
		return
	}

	// Retries exhausted
	if retryCount >= maxRetries {
		utils.Error("max retries reached — discarding", nil, map[string]any{
			"to": email.To,
		})
		_ = msg.Nack(false, false)
		return
	}

	// Schedule retry with exponential backoff
	next := retryCount + 1
	delay := time.Duration(math.Pow(2, float64(next-1))) * retryBaseDelay // 10s, 20s, 40s

	utils.Info("scheduling email retry", map[string]any{
		"to":      email.To,
		"attempt": next,
		"delay":   delay.String(),
	})

	headers := copyHeaders(msg.Headers)
	headers[retryHeaderKey] = int32(next)

	// Retry in background — does not block the QoS slot
	go scheduleRetry(ch, headers, msg.Body, msg.ContentType, delay)

	_ = msg.Ack(false) // remove original; retry is re-published
}

func scheduleRetry(ch *amqp.Channel, headers amqp.Table, body []byte, contentType string, delay time.Duration) {
	time.Sleep(delay)

	err := ch.Publish(
		"",
		EmailQueue,
		false,
		false,
		amqp.Publishing{
			Headers:      headers,
			ContentType:  contentType,
			DeliveryMode: amqp.Persistent,
			Body:         body,
		},
	)
	if err != nil {
		utils.Error("retry re-publish failed", err, nil)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

func buildSESClient(cfg *config.Config) (*ses.SES, error) {
	awsSess, err := session.NewSession(&aws.Config{
		Region: aws.String(cfg.AWS.AWSRegion),
		Credentials: credentials.NewStaticCredentials(
			cfg.AWS.AWSAccessKey,
			cfg.AWS.AWSSecretKey,
			"",
		),
	})
	if err != nil {
		utils.Error("AWS session create failed", err, nil)
		return nil, fmt.Errorf("aws session: %w", err)
	}

	return ses.New(awsSess), nil
}

func isPermanentSESError(err error) bool {
	type awsError interface {
		Code() string
	}
	if aerr, ok := err.(awsError); ok {
		switch aerr.Code() {
		case ses.ErrCodeMessageRejected,
			ses.ErrCodeMailFromDomainNotVerifiedException,
			ses.ErrCodeConfigurationSetDoesNotExistException:
			return true
		}
	}
	return false
}

func extractRetryCount(headers amqp.Table) int {
	if headers == nil {
		return 0
	}
	switch v := headers[retryHeaderKey].(type) {
	case int32:
		return int(v)
	case int:
		return v
	}
	return 0
}

func copyHeaders(src amqp.Table) amqp.Table {
	dst := make(amqp.Table, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

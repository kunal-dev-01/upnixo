package schemas

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type EmailStatus string

const (
	EmailStatusPending   EmailStatus = "pending"   // Queued in RabbitMQ
	EmailStatusSent      EmailStatus = "sent"      // Handled by Provider (AWS SES/SMTP)
	EmailStatusDelivered EmailStatus = "delivered" // Confirmed delivery (via webhook)
	EmailStatusFailed    EmailStatus = "failed"
	EmailStatusBounced   EmailStatus = "bounced"
)

type EmailLog struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID string        `bson:"user_id"       json:"user_id"` // Recipient ID (from SQL)

	// Delivery Info
	ToEmail string `bson:"to_email" json:"to_email"`
	Subject string `bson:"subject"  json:"subject"`

	// Template Tracking
	TemplateName string `bson:"template_name" json:"template_name"` // e.g. "welcome_email", "invoice_ready"
	TemplateData bson.M `bson:"template_data" json:"template_data"` // Variables used in the email

	// Status & Provider info
	Status     EmailStatus `bson:"status"      json:"status"`
	Provider   string      `bson:"provider"    json:"provider"`    // e.g. "aws_ses", "resend"
	ProviderID string      `bson:"provider_id" json:"provider_id"` // Remote ID from the provider

	// Error Tracking
	ErrorMessage string `bson:"error_message,omitempty" json:"error_message,omitempty"`

	// Audit Timestamps
	CreatedAt time.Time  `bson:"created_at" json:"created_at"`
	SentAt    *time.Time `bson:"sent_at,omitempty" json:"sent_at,omitempty"`
}

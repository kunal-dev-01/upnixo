package schemas

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type NotificationType string

const (
	// Project & Milestones
	NotifTypeProjectInvite   NotificationType = "project_invite"
	NotifTypeMilestoneFunded NotificationType = "milestone_funded"
	NotifTypeMilestonePaid   NotificationType = "milestone_paid"
	NotifTypeProjectUpdate   NotificationType = "project_update"

	// Chat
	NotifTypeNewMessage NotificationType = "new_message"

	// Financial
	NotifTypePaymentSuccess NotificationType = "payment_success"
	NotifTypePaymentFailed  NotificationType = "payment_failed"

	// Security & Account
	NotifTypeSecurityAlert NotificationType = "security_alert"
	NotifTypeAccountUpdate NotificationType = "account_update"
)

type NotificationPriority string

const (
	PriorityLow    NotificationPriority = "low"
	PriorityMedium NotificationPriority = "medium"
	PriorityHigh   NotificationPriority = "high"
	PriorityUrgent NotificationPriority = "urgent"
)

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION MODEL
// ─────────────────────────────────────────────────────────────────────────────

type Notification struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID string        `bson:"user_id"       json:"user_id"` // Target User

	Type     NotificationType     `bson:"type"     json:"type"`
	Priority NotificationPriority `bson:"priority" json:"priority"`

	// Content
	Title string `bson:"title" json:"title"`
	Body  string `bson:"body"  json:"body"`
	Icon  string `bson:"icon"  json:"icon,omitempty"` // e.g. "heroicons/bell"

	// Actionable Metadata
	// e.g. {"project_id": "...", "chat_room_id": "...", "link": "/dashboard/projects/123"}
	Metadata bson.M `bson:"metadata,omitempty" json:"metadata,omitempty"`

	// State
	IsRead bool `bson:"is_read" json:"is_read"` // Clicked by user
	IsSeen bool `bson:"is_seen" json:"is_seen"` // Viewed in the dropdown

	// Timestamps
	CreatedAt time.Time  `bson:"created_at" json:"created_at"`
	ReadAt    *time.Time `bson:"read_at,omitempty" json:"read_at,omitempty"`
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PREFERENCES (Embedded in User DB or separate collection)
// ─────────────────────────────────────────────────────────────────────────────

type UserNotificationSettings struct {
	UserID string `bson:"user_id" json:"user_id"`

	// Toggle different channels
	InAppEnabled bool `bson:"in_app_enabled" json:"in_app_enabled"`
	EmailEnabled bool `bson:"email_enabled"  json:"email_enabled"`
	PushEnabled  bool `bson:"push_enabled"   json:"push_enabled"`

	// Fine-grained control
	DisabledTypes []NotificationType `bson:"disabled_types" json:"disabled_types"`
}

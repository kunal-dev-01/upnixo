package schemas

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type MessageType string

const (
	MessageTypeText      MessageType = "text"
	MessageTypeFile      MessageType = "file"
	MessageTypeSystem    MessageType = "system"    // For joined/left/etc.
	MessageTypeMilestone MessageType = "milestone" // For payment/approval events
)

type ParticipantRole string

const (
	ParticipantRoleClient     ParticipantRole = "client"
	ParticipantRoleFreelancer ParticipantRole = "freelancer"
	ParticipantRoleAdmin      ParticipantRole = "admin"
)

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ROOM (CONVERSATION)
// ─────────────────────────────────────────────────────────────────────────────

type ChatRoom struct {
	// ID is the unique chat identifier stored in PostgreSQL projects.chat_room_id
	ID        string `bson:"_id"         json:"id"`
	ProjectID string `bson:"project_id"  json:"project_id"`

	Participants []Participant       `bson:"participants" json:"participants"`
	LastMessage  *LastMessageSnippet `bson:"last_message" json:"last_message"`

	IsActive bool `bson:"is_active" json:"is_active"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type Participant struct {
	UserID      string          `bson:"user_id"     json:"user_id"`
	Role        ParticipantRole `bson:"role"        json:"role"`
	UnreadCount int             `bson:"unread_count" json:"unread_count"`
	LastReadAt  time.Time       `bson:"last_read_at" json:"last_read_at"`
}

type LastMessageSnippet struct {
	MessageID bson.ObjectID `bson:"message_id" json:"message_id"`
	SenderID  string        `bson:"sender_id"  json:"sender_id"`
	Text      string        `bson:"text"       json:"text"`
	Type      MessageType   `bson:"type"       json:"type"`
	SentAt    time.Time     `bson:"sent_at"    json:"sent_at"`
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

type ChatMessage struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"id"`
	RoomID string        `bson:"room_id"       json:"room_id"`

	SenderID string      `bson:"sender_id" json:"sender_id"`
	Type     MessageType `bson:"type"      json:"type"`

	// Content is the main text or a description of the attachment
	Content string `bson:"content" json:"content"`

	// Metadata stores rich data based on MessageType
	// e.g., File details, Milestone ID, System event type
	Metadata bson.M `bson:"metadata,omitempty" json:"metadata,omitempty"`

	// ReplyToID allows for threaded conversations
	ReplyToID *bson.ObjectID `bson:"reply_to_id,omitempty" json:"reply_to_id,omitempty"`

	// Audit & State
	IsEdited  bool       `bson:"is_edited"  json:"is_edited"`
	DeletedAt *time.Time `bson:"deleted_at" json:"deleted_at,omitempty"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS / DTOs
// ─────────────────────────────────────────────────────────────────────────────

type MessageAttachment struct {
	Name      string `bson:"name"      json:"name"`
	URL       string `bson:"url"       json:"url"`
	Size      int64  `bson:"size"      json:"size"`
	MimeType  string `bson:"mime_type" json:"mime_type"`
	StorageID string `bson:"storage_id" json:"storage_id"` // R2 Key
}

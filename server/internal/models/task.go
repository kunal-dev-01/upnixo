package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// TASK ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type TaskStatus string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusInReview   TaskStatus = "in_review"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusCancelled  TaskStatus = "cancelled"
)

func (s TaskStatus) IsValid() bool {
	switch s {
	case TaskStatusTodo, TaskStatusInProgress, TaskStatusInReview, TaskStatusCompleted, TaskStatusCancelled:
		return true
	}
	return false
}

type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityUrgent TaskPriority = "urgent"
)

func (p TaskPriority) IsValid() bool {
	switch p {
	case TaskPriorityLow, TaskPriorityMedium, TaskPriorityHigh, TaskPriorityUrgent:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE TASK
// ─────────────────────────────────────────────────────────────────────────────

type MaintenanceTask struct {
	ID             uuid.UUID `db:"id"              json:"id"`
	SubscriptionID uuid.UUID `db:"subscription_id" json:"subscription_id"`
	ClientID       uuid.UUID `db:"client_id"       json:"client_id"`

	Title       string      `db:"title"       json:"title"`
	Description pgtype.Text `db:"description" json:"description"`

	Status   TaskStatus   `db:"status"   json:"status"`
	Priority TaskPriority `db:"priority" json:"priority"`

	EstimatedHours pgtype.Numeric `db:"estimated_hours" json:"estimated_hours"`
	LoggedHours    decimal.Decimal `db:"logged_hours"    json:"logged_hours"`

	DueDate     pgtype.Timestamptz `db:"due_date"     json:"due_date"`
	StartedAt   pgtype.Timestamptz `db:"started_at"   json:"started_at"`
	CompletedAt pgtype.Timestamptz `db:"completed_at" json:"completed_at"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SafeMaintenanceTask struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	LoggedHours decimal.Decimal `json:"logged_hours"`
	DueDate     *time.Time   `json:"due_date,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
}

func (t *MaintenanceTask) ToSafe() SafeMaintenanceTask {
	s := SafeMaintenanceTask{
		ID:          t.ID,
		Title:       t.Title,
		Status:      t.Status,
		Priority:    t.Priority,
		LoggedHours: t.LoggedHours,
		CreatedAt:   t.CreatedAt,
	}

	if t.DueDate.Valid {
		tm := t.DueDate.Time
		s.DueDate = &tm
	}

	return s
}

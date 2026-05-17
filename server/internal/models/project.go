package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type ProjectStatus string

const (
	ProjectStatusDraft     ProjectStatus = "draft"
	ProjectStatusActive    ProjectStatus = "active"
	ProjectStatusInReview  ProjectStatus = "in_review"
	ProjectStatusCompleted ProjectStatus = "completed"
	ProjectStatusCancelled ProjectStatus = "cancelled"
	ProjectStatusDisputed  ProjectStatus = "disputed"
)

func (s ProjectStatus) IsValid() bool {
	switch s {
	case ProjectStatusDraft, ProjectStatusActive, ProjectStatusInReview,
		ProjectStatusCompleted, ProjectStatusCancelled, ProjectStatusDisputed:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT
// ─────────────────────────────────────────────────────────────────────────────

type Project struct {
	// Identity
	ID   uuid.UUID `db:"id"   json:"id"`
	Slug string    `db:"slug" json:"slug"`

	// Relationships
	ClientID     uuid.UUID  `db:"client_id"     json:"client_id"`
	FreelancerID *uuid.UUID `db:"freelancer_id" json:"freelancer_id"`

	// Real-time & Sync
	ChatRoomID    pgtype.Text `db:"chat_room_id"    json:"chat_room_id"`
	RepositoryURL pgtype.Text `db:"repository_url" json:"repository_url"`

	// Core Content
	Title            string `db:"title"             json:"title"`
	Description      string `db:"description"       json:"description"`
	RequirementsMeta []byte `db:"requirements_meta" json:"requirements_meta"`

	// Financials
	Budget         decimal.Decimal `db:"budget"           json:"budget"`
	Currency       string          `db:"currency"         json:"currency"`
	IsEscrowFunded bool            `db:"is_escrow_funded" json:"is_escrow_funded"`

	// Status & Priority
	Status   ProjectStatus `db:"status"   json:"status"`
	Priority int16         `db:"priority" json:"priority"` // 0:Normal, 1:High, 2:Urgent

	// Denormalized for Performance
	LastActivityAt     pgtype.Timestamptz `db:"last_activity_at"      json:"last_activity_at"`
	LastMessagePreview pgtype.Text        `db:"last_message_preview" json:"last_message_preview"`

	// Timestamps
	DeadlineAt  pgtype.Timestamptz `db:"deadline_at"  json:"deadline_at"`
	StartedAt   pgtype.Timestamptz `db:"started_at"   json:"started_at"`
	CompletedAt pgtype.Timestamptz `db:"completed_at" json:"completed_at"`
	CreatedAt   time.Time          `db:"created_at"   json:"created_at"`
	UpdatedAt   time.Time          `db:"updated_at"   json:"updated_at"`
	DeletedAt   pgtype.Timestamptz `db:"deleted_at"   json:"-"`
}

func (p *Project) IsDeleted() bool { return p.DeletedAt.Valid }

type SafeProject struct {
	ID             uuid.UUID       `json:"id"`
	Slug           string          `json:"slug"`
	Title          string          `json:"title"`
	Description    string          `json:"description"`
	Budget         decimal.Decimal `json:"budget"`
	Currency       string          `json:"currency"`
	Status         ProjectStatus   `json:"status"`
	Priority       int16           `json:"priority"`
	IsEscrowFunded bool            `json:"is_escrow_funded"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

func (p *Project) ToSafe() SafeProject {
	return SafeProject{
		ID:             p.ID,
		Slug:           p.Slug,
		Title:          p.Title,
		Description:    p.Description,
		Budget:         p.Budget,
		Currency:       p.Currency,
		Status:         p.Status,
		Priority:       p.Priority,
		IsEscrowFunded: p.IsEscrowFunded,
		CreatedAt:      p.CreatedAt,
		UpdatedAt:      p.UpdatedAt,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONE ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type MilestoneStatus string

const (
	MilestoneStatusPendingFunding MilestoneStatus = "pending_funding"
	MilestoneStatusFunded         MilestoneStatus = "funded"
	MilestoneStatusInReview       MilestoneStatus = "in_review"
	MilestoneStatusApproved       MilestoneStatus = "approved"
	MilestoneStatusReleased       MilestoneStatus = "released"
	MilestoneStatusCancelled      MilestoneStatus = "cancelled"
)

func (s MilestoneStatus) IsValid() bool {
	switch s {
	case MilestoneStatusPendingFunding, MilestoneStatusFunded, MilestoneStatusInReview,
		MilestoneStatusApproved, MilestoneStatusReleased, MilestoneStatusCancelled:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONE
// ─────────────────────────────────────────────────────────────────────────────

type Milestone struct {
	ID        uuid.UUID `db:"id"         json:"id"`
	ProjectID uuid.UUID `db:"project_id" json:"project_id"`

	OrderIndex  int16       `db:"order_index" json:"order_index"`
	Title       string      `db:"title"       json:"title"`
	Description pgtype.Text `db:"description" json:"description"`

	Amount decimal.Decimal `db:"amount" json:"amount"`
	Status MilestoneStatus `db:"status" json:"status"`

	PaymentEscrowID  pgtype.Text `db:"payment_escrow_id"  json:"payment_escrow_id"`
	PaymentReleaseID pgtype.Text `db:"payment_release_id" json:"payment_release_id"`

	SubmissionMeta []byte `db:"submission_meta" json:"submission_meta"`

	DueDate     pgtype.Timestamptz `db:"due_date"     json:"due_date"`
	SubmittedAt pgtype.Timestamptz `db:"submitted_at" json:"submitted_at"`
	ApprovedAt  pgtype.Timestamptz `db:"approved_at"  json:"approved_at"`
	PaidAt      pgtype.Timestamptz `db:"paid_at"      json:"paid_at"`
	CreatedAt   time.Time          `db:"created_at"   json:"created_at"`
	UpdatedAt   time.Time          `db:"updated_at"   json:"updated_at"`
}

type SafeMilestone struct {
	ID          uuid.UUID       `json:"id"`
	OrderIndex  int16           `json:"order_index"`
	Title       string          `json:"title"`
	Description *string         `json:"description,omitempty"`
	Amount      decimal.Decimal `json:"amount"`
	Status      MilestoneStatus `json:"status"`
	DueDate     *time.Time      `json:"due_date,omitempty"`
	PaidAt      *time.Time      `json:"paid_at,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
}

func (m *Milestone) ToSafe() SafeMilestone {
	s := SafeMilestone{
		ID:         m.ID,
		OrderIndex: m.OrderIndex,
		Title:      m.Title,
		Amount:     m.Amount,
		Status:     m.Status,
		CreatedAt:  m.CreatedAt,
	}

	if m.Description.Valid {
		s.Description = &m.Description.String
	}
	if m.DueDate.Valid {
		t := m.DueDate.Time
		s.DueDate = &t
	}
	if m.PaidAt.Valid {
		t := m.PaidAt.Time
		s.PaidAt = &t
	}

	return s
}

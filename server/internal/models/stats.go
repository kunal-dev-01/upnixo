package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT STATS
// ─────────────────────────────────────────────────────────────────────────────

type ClientStats struct {
	// Identity (1-to-1 relationship with users table)
	ClientID uuid.UUID `db:"client_id" json:"client_id"`

	// Financial Stats
	TotalSpent decimal.Decimal `db:"total_spent" json:"total_spent"`

	// Project Stats
	ActiveProjectsCount    int32 `db:"active_projects_count"    json:"active_projects_count"`
	CompletedProjectsCount int32 `db:"completed_projects_count" json:"completed_projects_count"`

	// Subscription & Task Stats
	ActiveSubscriptionsCount int32 `db:"active_subscriptions_count" json:"active_subscriptions_count"`
	OpenTasksCount           int32 `db:"open_tasks_count"           json:"open_tasks_count"`
	CompletedTasksCount      int32 `db:"completed_tasks_count"      json:"completed_tasks_count"`

	// Engagement
	LastLoginAt    pgtype.Timestamptz `db:"last_login_at"    json:"last_login_at"`
	LastActivityAt pgtype.Timestamptz `db:"last_activity_at" json:"last_activity_at"`

	// Timestamps
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SafeClientStats struct {
	TotalSpent             decimal.Decimal `json:"total_spent"`
	ActiveProjectsCount    int32           `json:"active_projects_count"`
	CompletedProjectsCount int32           `json:"completed_projects_count"`
	ActiveSubscriptionsCount int32           `json:"active_subscriptions_count"`
	OpenTasksCount           int32           `json:"open_tasks_count"`
	CompletedTasksCount      int32           `json:"completed_tasks_count"`
	LastActivityAt         *time.Time      `json:"last_activity_at,omitempty"`
}

func (s *ClientStats) ToSafe() SafeClientStats {
	safe := SafeClientStats{
		TotalSpent:               s.TotalSpent,
		ActiveProjectsCount:      s.ActiveProjectsCount,
		CompletedProjectsCount:   s.CompletedProjectsCount,
		ActiveSubscriptionsCount: s.ActiveSubscriptionsCount,
		OpenTasksCount:           s.OpenTasksCount,
		CompletedTasksCount:      s.CompletedTasksCount,
	}

	if s.LastActivityAt.Valid {
		t := s.LastActivityAt.Time
		safe.LastActivityAt = &t
	}

	return safe
}

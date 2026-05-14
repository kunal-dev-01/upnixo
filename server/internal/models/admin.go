package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ─────────────────────────────────────────────────────────────────────────────
// MASTER ADMIN
// ─────────────────────────────────────────────────────────────────────────────

type MasterAdmin struct {
	// Identity
	ID uuid.UUID `db:"id" json:"id"`

	// Contact & Personal Details
	FullName string `db:"full_name" json:"full_name"`
	Email    string `db:"email"     json:"email"`
	Phone    string `db:"phone"     json:"phone"`

	// Primary Auth
	PasswordHash string `db:"password_hash" json:"-"`

	// Secondary Auth (The Secret Access Key)
	MasterSecretKey string `db:"master_secret_key" json:"-"`

	// Account Protection Logic
	IsVerified              bool               `db:"is_verified"                json:"is_verified"`
	VerificationTokenSentAt pgtype.Timestamptz `db:"verification_token_sent_at" json:"verification_token_sent_at"`
	IsActive                bool               `db:"is_active"                  json:"is_active"`

	// Audit & Security Monitoring
	LastLoginAt   pgtype.Timestamptz `db:"last_login_at"   json:"last_login_at"`
	LastLoginIP   pgtype.Text        `db:"last_login_ip"   json:"last_login_ip"`
	LastUserAgent pgtype.Text        `db:"last_user_agent" json:"last_user_agent"`

	// Timestamps
	CreatedAt time.Time          `db:"created_at" json:"created_at"`
	UpdatedAt time.Time          `db:"updated_at" json:"updated_at"`
	DeletedAt pgtype.Timestamptz `db:"deleted_at" json:"-"`
}

func (a *MasterAdmin) IsDeleted() bool { return a.DeletedAt.Valid }

type SafeMasterAdmin struct {
	ID          uuid.UUID  `json:"id"`
	FullName    string     `json:"full_name"`
	Email       string     `json:"email"`
	Phone       string     `json:"phone"`
	IsVerified  bool       `json:"is_verified"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (a *MasterAdmin) ToSafe() SafeMasterAdmin {
	s := SafeMasterAdmin{
		ID:         a.ID,
		FullName:   a.FullName,
		Email:      a.Email,
		Phone:      a.Phone,
		IsVerified: a.IsVerified,
		IsActive:   a.IsActive,
		CreatedAt:  a.CreatedAt,
	}

	if a.LastLoginAt.Valid {
		t := a.LastLoginAt.Time
		s.LastLoginAt = &t
	}

	return s
}

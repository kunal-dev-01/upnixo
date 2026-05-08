package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type OAuthProvider string

const (
	OAuthProviderGoogle OAuthProvider = "google"
	OAuthProviderGitHub OAuthProvider = "github"
)

func (p OAuthProvider) IsValid() bool {
	switch p {
	case OAuthProviderGoogle, OAuthProviderGitHub:
		return true
	}
	return false
}

type TwoFactorMethod string

const (
	TwoFactorMethodTOTP       TwoFactorMethod = "totp"
	TwoFactorMethodBackupCode TwoFactorMethod = "backup_code"
)

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

type User struct {
	// Identity
	ID uuid.UUID `db:"id"`

	// Contact
	Email           string             `db:"email"`
	EmailVerified   bool               `db:"email_verified"`
	EmailVerifiedAt pgtype.Timestamptz `db:"email_verified_at"`

	Phone           pgtype.Text        `db:"phone"`
	PhoneVerified   bool               `db:"phone_verified"`
	PhoneVerifiedAt pgtype.Timestamptz `db:"phone_verified_at"`

	// Auth
	PasswordHash             pgtype.Text        `db:"password_hash"        json:"-"`
	PasswordChangedAt        pgtype.Timestamptz `db:"password_changed_at"`
	PasswordResetRequestedAt pgtype.Timestamptz `db:"password_reset_requested_at"`

	// Profile
	FullName  string      `db:"full_name"`
	AvatarURL pgtype.Text `db:"avatar_url"`

	// Locale
	Timezone string `db:"timezone"`
	Locale   string `db:"locale"`

	// Account state
	IsActive      bool               `db:"is_active"`
	IsBlocked     bool               `db:"is_blocked"`
	BlockedAt     pgtype.Timestamptz `db:"blocked_at"`
	BlockedReason pgtype.Text        `db:"blocked_reason"`

	// Security / audit
	LastLoginAt pgtype.Timestamptz `db:"last_login_at"`
	LastLoginIP pgtype.Text        `db:"last_login_ip"`

	// 2FA (denormalised)
	TwoFactorEnabled   bool               `db:"two_factor_enabled"`
	TwoFactorEnabledAt pgtype.Timestamptz `db:"two_factor_enabled_at"`

	// Embedded Preferences (Mapped from user_preferences table)
	UserPreferences `db:""`

	// Timestamps
	CreatedAt time.Time          `db:"created_at"`
	UpdatedAt time.Time          `db:"updated_at"`
	DeletedAt pgtype.Timestamptz `db:"deleted_at"`
}

func (u *User) IsDeleted() bool    { return u.DeletedAt.Valid }
func (u *User) HasPassword() bool  { return u.PasswordHash.Valid && u.PasswordHash.String != "" }
func (u *User) IsAccessible() bool { return u.IsActive && !u.IsBlocked && !u.IsDeleted() }

type SafeUser struct {
	ID               uuid.UUID        `json:"id"`
	Email            string           `json:"email"`
	EmailVerified    bool             `json:"email_verified"`
	Phone            *string          `json:"phone,omitempty"`
	PhoneVerified    bool             `json:"phone_verified"`
	FullName         string           `json:"full_name"`
	AvatarURL        *string          `json:"avatar_url,omitempty"`
	Timezone         string           `json:"timezone"`
	Locale           string           `json:"locale"`
	IsActive         bool             `json:"is_active"`
	TwoFactorEnabled bool             `json:"two_factor_enabled"`
	Preferences      *SafePreferences `json:"preferences,omitempty"`
	LastLoginAt      *time.Time       `json:"last_login_at,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

func (u *User) ToSafe() SafeUser {
	s := SafeUser{
		ID:               u.ID,
		Email:            u.Email,
		EmailVerified:    u.EmailVerified,
		PhoneVerified:    u.PhoneVerified,
		FullName:         u.FullName,
		Timezone:         u.Timezone,
		Locale:           u.Locale,
		IsActive:         u.IsActive,
		TwoFactorEnabled: u.TwoFactorEnabled,
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
	}

	// Map nested preferences
	if safePrefs, err := u.UserPreferences.ToSafe(); err == nil {
		s.Preferences = &safePrefs
	}

	if u.Phone.Valid {
		s.Phone = &u.Phone.String
	}
	if u.AvatarURL.Valid {
		s.AvatarURL = &u.AvatarURL.String
	}
	if u.LastLoginAt.Valid {
		t := u.LastLoginAt.Time
		s.LastLoginAt = &t
	}

	return s
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

type UserPreferences struct {
	UserID           uuid.UUID `db:"-"`
	Theme            string    `db:"theme"`
	SidebarCollapsed bool      `db:"sidebar_collapsed"`
	CompactView      bool      `db:"compact_view"`
	Notifications    []byte    `db:"notifications"`
	DefaultCurrency  string    `db:"default_currency"`
	Language         string    `db:"language"`
	UpdatedAt        time.Time `db:"updated_at"`
}

type NotificationSettings struct {
	Email struct {
		OrderUpdates    bool `json:"order_updates"`
		ChatMessages    bool `json:"chat_messages"`
		BillingInvoices bool `json:"billing_invoices"`
		Marketing       bool `json:"marketing"`
	} `json:"email"`
	Push struct {
		Mentions       bool `json:"mentions"`
		DirectMessages bool `json:"direct_messages"`
		SecurityAlerts bool `json:"security_alerts"`
	} `json:"push"`
}

type SafePreferences struct {
	Theme            string               `json:"theme"`
	SidebarCollapsed bool                 `json:"sidebar_collapsed"`
	CompactView      bool                 `json:"compact_view"`
	Notifications    NotificationSettings `json:"notifications"`
	DefaultCurrency  string               `json:"default_currency"`
	Language         string               `json:"language"`
}

func (p *UserPreferences) ToSafe() (SafePreferences, error) {
	var notifSettings NotificationSettings
	// Default values handle karne ke liye agar JSON empty ho
	if len(p.Notifications) == 0 {
		return SafePreferences{
			Theme: p.Theme, SidebarCollapsed: p.SidebarCollapsed, CompactView: p.CompactView,
			DefaultCurrency: p.DefaultCurrency, Language: p.Language,
		}, nil
	}

	if err := json.Unmarshal(p.Notifications, &notifSettings); err != nil {
		return SafePreferences{}, err
	}

	return SafePreferences{
		Theme:            p.Theme,
		SidebarCollapsed: p.SidebarCollapsed,
		CompactView:      p.CompactView,
		Notifications:    notifSettings,
		DefaultCurrency:  p.DefaultCurrency,
		Language:         p.Language,
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH & 2FA
// ─────────────────────────────────────────────────────────────────────────────

type OAuthAccount struct {
	ID                uuid.UUID          `db:"id"`
	UserID            uuid.UUID          `db:"user_id"`
	Provider          OAuthProvider      `db:"provider"`
	ProviderUserID    string             `db:"provider_user_id"`
	ProviderEmail     pgtype.Text        `db:"provider_email"`
	ProviderName      pgtype.Text        `db:"provider_name"`
	ProviderAvatarURL pgtype.Text        `db:"provider_avatar_url"`
	Scopes            []string           `db:"scopes"`
	ProviderMeta      []byte             `db:"provider_meta"`
	ConnectedAt       pgtype.Timestamptz `db:"connected_at"`
	LastUsedAt        pgtype.Timestamptz `db:"last_used_at"`
	UpdatedAt         time.Time          `db:"updated_at"`
}

type TwoFactorAuth struct {
	ID                     uuid.UUID          `db:"id"`
	UserID                 uuid.UUID          `db:"user_id"`
	TOTPSecret             string             `db:"totp_secret"`
	TOTPAlgorithm          string             `db:"totp_algorithm"`
	TOTPDigits             int16              `db:"totp_digits"`
	TOTPPeriod             int16              `db:"totp_period"`
	BackupCodes            []string           `db:"backup_codes"`
	BackupCodesGeneratedAt pgtype.Timestamptz `db:"backup_codes_generated_at"`
	IsEnabled              bool               `db:"is_enabled"`
	EnabledAt              pgtype.Timestamptz `db:"enabled_at"`
	LastVerifiedAt         pgtype.Timestamptz `db:"last_verified_at"`
	LastMethodUsed         pgtype.Text        `db:"last_method_used"`
	CreatedAt              time.Time          `db:"created_at"`
	UpdatedAt              time.Time          `db:"updated_at"`
}

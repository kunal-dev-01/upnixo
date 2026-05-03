package models

import (
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

// User is the full internal model — never expose this directly over API.
// Use SafeUser for any outbound response.
type User struct {
	// Identity
	ID uuid.UUID `db:"id"`

	// Contact
	Email           string      `db:"email"`
	EmailVerified   bool        `db:"email_verified"`
	EmailVerifiedAt pgtype.Timestamptz `db:"email_verified_at"`

	Phone           pgtype.Text        `db:"phone"`
	PhoneVerified   bool               `db:"phone_verified"`
	PhoneVerifiedAt pgtype.Timestamptz `db:"phone_verified_at"`

	// Auth — never include in any response struct
	PasswordHash               pgtype.Text        `db:"password_hash"        json:"-"`
	PasswordChangedAt          pgtype.Timestamptz `db:"password_changed_at"`
	PasswordResetRequestedAt   pgtype.Timestamptz `db:"password_reset_requested_at"`

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
	LastLoginIP pgtype.Text        `db:"last_login_ip"` // INET scanned as text

	// 2FA (denormalised)
	TwoFactorEnabled   bool               `db:"two_factor_enabled"`
	TwoFactorEnabledAt pgtype.Timestamptz `db:"two_factor_enabled_at"`

	// Timestamps
	CreatedAt time.Time      `db:"created_at"`
	UpdatedAt time.Time      `db:"updated_at"`
	DeletedAt pgtype.Timestamptz `db:"deleted_at"`
}

// IsDeleted reports whether the user has been soft-deleted.
func (u *User) IsDeleted() bool {
	return u.DeletedAt.Valid
}

// HasPassword reports whether the user has a local password set.
// Pure-OAuth users will return false.
func (u *User) HasPassword() bool {
	return u.PasswordHash.Valid && u.PasswordHash.String != ""
}

// IsAccessible returns true when the user can authenticate —
// active, not blocked, and not soft-deleted.
func (u *User) IsAccessible() bool {
	return u.IsActive && !u.IsBlocked && !u.IsDeleted()
}

// SafeUser is the public-safe representation of a user.
// Omits all sensitive fields: password hash, blocked reason,
// reset timestamps, and internal audit fields.
type SafeUser struct {
	ID              uuid.UUID  `json:"id"`
	Email           string     `json:"email"`
	EmailVerified   bool       `json:"email_verified"`
	Phone           *string    `json:"phone,omitempty"`
	PhoneVerified   bool       `json:"phone_verified"`
	FullName        string     `json:"full_name"`
	AvatarURL       *string    `json:"avatar_url,omitempty"`
	Timezone        string     `json:"timezone"`
	Locale          string     `json:"locale"`
	IsActive        bool       `json:"is_active"`
	TwoFactorEnabled bool      `json:"two_factor_enabled"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// ToSafe converts a full User to its public-safe representation.
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
// OAUTH ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

type OAuthAccount struct {
	ID   uuid.UUID     `db:"id"`
	UserID uuid.UUID   `db:"user_id"`

	Provider        OAuthProvider `db:"provider"`
	ProviderUserID  string        `db:"provider_user_id"`
	ProviderEmail   pgtype.Text   `db:"provider_email"`
	ProviderName    pgtype.Text   `db:"provider_name"`
	ProviderAvatarURL pgtype.Text `db:"provider_avatar_url"`

	Scopes       []string `db:"scopes"`        // TEXT[]
	ProviderMeta []byte   `db:"provider_meta"` // JSONB → raw JSON bytes

	ConnectedAt pgtype.Timestamptz `db:"connected_at"`
	LastUsedAt  pgtype.Timestamptz `db:"last_used_at"`
	UpdatedAt   time.Time          `db:"updated_at"`
}

// SafeOAuthAccount is the public-safe view of a linked provider.
// Never exposes raw provider metadata or internal IDs.
type SafeOAuthAccount struct {
	Provider        OAuthProvider `json:"provider"`
	ProviderEmail   *string       `json:"provider_email,omitempty"`
	ProviderName    *string       `json:"provider_name,omitempty"`
	ProviderAvatar  *string       `json:"provider_avatar_url,omitempty"`
	ConnectedAt     time.Time     `json:"connected_at"`
}

func (o *OAuthAccount) ToSafe() SafeOAuthAccount {
	s := SafeOAuthAccount{
		Provider:    o.Provider,
		ConnectedAt: o.ConnectedAt.Time,
	}

	if o.ProviderEmail.Valid {
		s.ProviderEmail = &o.ProviderEmail.String
	}
	if o.ProviderName.Valid {
		s.ProviderName = &o.ProviderName.String
	}
	if o.ProviderAvatarURL.Valid {
		s.ProviderAvatar = &o.ProviderAvatarURL.String
	}

	return s
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO FACTOR AUTH
// ─────────────────────────────────────────────────────────────────────────────

// TwoFactorAuth is strictly internal — never expose over API.
// TOTPSecret must be AES-256 encrypted before INSERT and
// decrypted only at the point of TOTP verification.
type TwoFactorAuth struct {
	ID     uuid.UUID `db:"id"`
	UserID uuid.UUID `db:"user_id"`

	// Encrypted at rest — decrypt only on verify
	TOTPSecret    string `db:"totp_secret"    json:"-"`
	TOTPAlgorithm string `db:"totp_algorithm"`
	TOTPDigits    int16  `db:"totp_digits"`
	TOTPPeriod    int16  `db:"totp_period"`

	// Hashed backup codes — never expose raw
	BackupCodes             []string           `db:"backup_codes"              json:"-"`
	BackupCodesGeneratedAt  pgtype.Timestamptz `db:"backup_codes_generated_at"`

	IsEnabled      bool               `db:"is_enabled"`
	EnabledAt      pgtype.Timestamptz `db:"enabled_at"`
	LastVerifiedAt pgtype.Timestamptz `db:"last_verified_at"`
	LastMethodUsed pgtype.Text        `db:"last_method_used"`

	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

// RemainingBackupCodes returns the count of unused backup codes.
func (t *TwoFactorAuth) RemainingBackupCodes() int {
	return len(t.BackupCodes)
}

// Safe2FAStatus is the only 2FA info safe to return to the client.
// Never expose secret, backup code hashes, or last method used.
type Safe2FAStatus struct {
	Enabled              bool       `json:"enabled"`
	EnabledAt            *time.Time `json:"enabled_at,omitempty"`
	LastVerifiedAt       *time.Time `json:"last_verified_at,omitempty"`
	RemainingBackupCodes int        `json:"remaining_backup_codes"`
}

func (t *TwoFactorAuth) ToSafeStatus() Safe2FAStatus {
	s := Safe2FAStatus{
		Enabled:              t.IsEnabled,
		RemainingBackupCodes: t.RemainingBackupCodes(),
	}

	if t.EnabledAt.Valid {
		ts := t.EnabledAt.Time
		s.EnabledAt = &ts
	}
	if t.LastVerifiedAt.Valid {
		ts := t.LastVerifiedAt.Time
		s.LastVerifiedAt = &ts
	}

	return s
}
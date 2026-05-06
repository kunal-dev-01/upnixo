package dto

import (
	"server/internal/models"
	"time"

	"github.com/google/uuid"
)

// ─────────────────────────────────────────────────────────────────────────────
// Client Info Dto
// ─────────────────────────────────────────────────────────────────────────────

type ClientInfo struct {
	IP         string
	Browser    string
	OS         string
	DeviceName string
	City       string
	Country    string
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST DTOs
// ─────────────────────────────────────────────────────────────────────────────

type RegisterRequest struct {
	FullName string `json:"full_name" validate:"required,valid_name"`
	Email    string `json:"email"     validate:"required,email"`
	Password string `json:"password"  validate:"required,secure_password"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}

type ResendVerifyEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE DTOs
// ─────────────────────────────────────────────────────────────────────────────

type RegisterResponse struct {
	Message string `json:"message"`
}

type VerifyEmailResult struct {
	User        *models.SafeUser `json:"user"`
	AccessToken string           `json:"access_token"`
	SessionID   string           `json:"session_id"`
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

type SafeUser struct {
	ID               uuid.UUID        `json:"id"`
	Email            string           `json:"email"`
	EmailVerified    bool             `json:"email_verified"`
	FullName         string           `json:"full_name"`
	AvatarURL        *string          `json:"avatar_url,omitempty"`
	Phone            *string          `json:"phone,omitempty"`
	PhoneVerified    bool             `json:"phone_verified"`
	Timezone         string           `json:"timezone"`
	Locale           string           `json:"locale"`
	TwoFactorEnabled bool             `json:"two_factor_enabled"`
	Preferences      *SafePreferences `json:"preferences,omitempty"`
	LastLoginAt      *time.Time       `json:"last_login_at,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA DTOs
// ─────────────────────────────────────────────────────────────────────────────

type Setup2FAResult struct {
	QRCodeURL   string   `json:"qr_code_url"`  // otpauth:// URL for QR code
	Secret      string   `json:"secret"`       // base32 secret (show once)
	BackupCodes []string `json:"backup_codes"` // plain codes (show once)
}

type Confirm2FAInput struct {
	Code string `json:"code" validate:"required,len=6"`
}

type Verify2FAInput struct {
	Code              string `json:"code"             validate:"required"`
	TwoFAPendingToken string `json:"two_fa_pending_token" validate:"required"`
}

type VerifyBackupInput struct {
	BackupCode        string `json:"backup_code"      validate:"required"`
	TwoFAPendingToken string `json:"two_fa_pending_token" validate:"required"`
}

type Disable2FAInput struct {
	Code string `json:"code" validate:"required"` // TOTP code to confirm disable
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD DTOs
// ─────────────────────────────────────────────────────────────────────────────

type ForgotPasswordInput struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordInput struct {
	Token    string `json:"token"    validate:"required"`
	Password string `json:"password" validate:"required,secure_password"`
}

type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password"     validate:"required,secure_password"`
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION DTOs
// ─────────────────────────────────────────────────────────────────────────────

type SessionMetadata struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	RefreshToken string    `json:"refresh_token"`
	IPAddress    string    `json:"ip_address"`
	Browser      string    `json:"browser"`
	OS           string    `json:"os"`
	DeviceName   string    `json:"device_name"`
	City         string    `json:"city"`
	Country      string    `json:"country"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
}

func (s *SessionMetadata) ToSafe(currentSessionID string) SafeSession {
	return SafeSession{
		ID:         s.ID,
		IPAddress:  s.IPAddress,
		Browser:    s.Browser,
		OS:         s.OS,
		DeviceName: s.DeviceName,
		City:       s.City,
		Country:    s.Country,
		CreatedAt:  s.CreatedAt,
		ExpiresAt:  s.ExpiresAt,
		IsCurrent:  s.ID == currentSessionID,
	}
}

type SafeSession struct {
	ID         string    `json:"id"`
	IPAddress  string    `json:"ip_address"`
	Browser    string    `json:"browser"`
	OS         string    `json:"os"`
	DeviceName string    `json:"device_name"`
	City       string    `json:"city"`
	Country    string    `json:"country"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	IsCurrent  bool      `json:"is_current"`
}

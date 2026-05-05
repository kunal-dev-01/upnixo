package dto

import (
	"time"

	"github.com/google/uuid"
)

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

// RegisterResponse — no user data, no token
// User must verify email before getting access
type RegisterResponse struct {
	Message string `json:"message"`
}

// VerifyEmailResponse — returned after successful email verification
// Refresh token is set as httpOnly cookie by the handler — not in this struct
type VerifyEmailResponse struct {
	AccessToken string    `json:"access_token"`
	User        *SafeUser `json:"user"`
}

// SafeUser — public-safe user representation
// Never includes password hash, blocked reason, or internal timestamps
type SafeUser struct {
	ID               uuid.UUID  `json:"id"`
	Email            string     `json:"email"`
	EmailVerified    bool       `json:"email_verified"`
	FullName         string     `json:"full_name"`
	AvatarURL        *string    `json:"avatar_url,omitempty"`
	Phone            *string    `json:"phone,omitempty"`
	PhoneVerified    bool       `json:"phone_verified"`
	Timezone         string     `json:"timezone"`
	Locale           string     `json:"locale"`
	TwoFactorEnabled bool       `json:"two_factor_enabled"`
	LastLoginAt      *time.Time `json:"last_login_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

// MessageResponse — generic success message response
type MessageResponse struct {
	Message string `json:"message"`
}

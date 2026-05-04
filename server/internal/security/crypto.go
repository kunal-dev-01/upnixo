package security

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"server/internal/utils"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

const bcryptCost = 12

// HashPassword creates a bcrypt hash. Cost 12 is the production standard.
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		utils.Error("password hash failed", err, nil)
		return "", utils.Internal(err)
	}
	return string(hash), nil
}

// VerifyPassword returns true if plainPassword matches the hash.
func VerifyPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN GENERATION
// ─────────────────────────────────────────────────────────────────────────────

// GenerateToken generates a cryptographically secure hex token.
// length = number of random bytes (e.g. 32 → 64 char hex string).
func GenerateToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		utils.Error("random token generation failed", err, nil)
		return "", utils.Internal(err)
	}
	return hex.EncodeToString(b), nil
}

// GenerateEmailVerifyToken returns a 64-char secure token for email verification.
func GenerateEmailVerifyToken() (string, error) {
	return GenerateToken(32)
}

// GeneratePasswordResetToken returns a 64-char secure token for password reset.
func GeneratePasswordResetToken() (string, error) {
	return GenerateToken(32)
}

// GenerateSessionID returns a 48-char secure ID for session/refresh token families.
func GenerateSessionID() (string, error) {
	return GenerateToken(24)
}

// GenerateTwoFAPendingToken returns a short-lived token for the 2FA pending state.
func GenerateTwoFAPendingToken() (string, error) {
	return GenerateToken(32)
}

// ─────────────────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────────────────

// NewID returns a UUID v7 (time-ordered). Falls back to v4 on error.
func NewID() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.New()
	}
	return id
}

// FormatKey builds a namespaced Redis key: prefix + value.
func FormatKey(prefix, value string) string {
	return fmt.Sprintf("%s%s", prefix, value)
}

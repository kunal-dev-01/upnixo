package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"

	"server/internal/utils"
)

// ─────────────────────────────────────────────────────────────────────────────
// AES-256-GCM TOTP SECRET ENCRYPTION
// ─────────────────────────────────────────────────────────────────────────────

// EncryptTOTPSecret encrypts the TOTP base32 secret using AES-256-GCM.
// key must be exactly 32 bytes (use cfg.Security.TOTPEncryptionKey).
// Output is base64(nonce + ciphertext) — safe to store in TEXT column.
func EncryptTOTPSecret(plaintext, key string) (string, error) {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", utils.Internal(fmt.Errorf("aes cipher: %w", err))
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", utils.Internal(fmt.Errorf("gcm: %w", err))
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", utils.Internal(fmt.Errorf("nonce: %w", err))
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptTOTPSecret decrypts a secret previously encrypted with EncryptTOTPSecret.
func DecryptTOTPSecret(encoded, key string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", utils.Internal(fmt.Errorf("base64 decode: %w", err))
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", utils.Internal(fmt.Errorf("aes cipher: %w", err))
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", utils.Internal(fmt.Errorf("gcm: %w", err))
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", utils.Internal(fmt.Errorf("ciphertext too short"))
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", utils.Internal(fmt.Errorf("gcm open: %w", err))
	}

	return string(plaintext), nil
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP CODES
// ─────────────────────────────────────────────────────────────────────────────

// GenerateBackupCodes returns n plain-text backup codes (8 chars each).
// The caller must hash these before storing.
func GenerateBackupCodes(n int) ([]string, error) {
	codes := make([]string, n)
	for i := range codes {
		raw := make([]byte, 5) // 5 bytes → 10 hex chars, we take 8
		if _, err := rand.Read(raw); err != nil {
			return nil, utils.Internal(err)
		}
		codes[i] = fmt.Sprintf("%x", raw)[:8]
	}
	return codes, nil
}

// HashBackupCodes hashes each plain-text backup code with bcrypt.
func HashBackupCodes(codes []string) ([]string, error) {
	hashed := make([]string, len(codes))
	for i, code := range codes {
		h, err := HashPassword(code)
		if err != nil {
			return nil, err
		}
		hashed[i] = h
	}
	return hashed, nil
}

// VerifyBackupCode checks plain against a slice of hashed codes.
// Returns the index of the matching code, or -1 if not found.
func VerifyBackupCode(plain string, hashedCodes []string) int {
	for i, h := range hashedCodes {
		if VerifyPassword(h, plain) {
			return i
		}
	}
	return -1
}

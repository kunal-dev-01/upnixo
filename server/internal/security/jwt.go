package security

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"server/internal/config"
	"server/internal/models"
	"server/internal/utils"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TokenType string

const (
	TokenAccess       TokenType = "access"
	TokenRefresh      TokenType = "refresh"
	TokenTwoFAPending TokenType = "2fa_pending" // issued after password OK, before 2FA verify
)

// CustomClaims is the JWT payload.
type CustomClaims struct {
	UserID           uuid.UUID `json:"uid"`
	Email            string    `json:"eml"`
	TwoFactorEnabled bool      `json:"2fa"`
	Type             TokenType `json:"typ"`
	jwt.RegisteredClaims
}

// TokenPair holds both access and refresh tokens.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT MANAGER
// ─────────────────────────────────────────────────────────────────────────────

type JWTManager struct {
	cfg         *config.JWTConfig
	secretBytes []byte
}

func NewJWTManager(cfg *config.JWTConfig) *JWTManager {
	return &JWTManager{
		cfg:         cfg,
		secretBytes: []byte(cfg.Secret),
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATION
// ─────────────────────────────────────────────────────────────────────────────

// GenerateTokenPair creates access + refresh tokens sharing the same session ID (JTI).
func (m *JWTManager) GenerateTokenPair(user *models.User, sessionID string) (*TokenPair, error) {
	accessToken, err := m.generate(user, TokenAccess, m.cfg.AccessTokenDuration, sessionID)
	if err != nil {
		return nil, err
	}

	refreshToken, err := m.generate(user, TokenRefresh, m.cfg.RefreshTokenDuration, sessionID)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(m.cfg.AccessTokenDuration).Unix(),
	}, nil
}

// GenerateTwoFAPendingToken issues a short-lived token after password login
// succeeds but before 2FA is verified. TTL: 5 minutes.
func (m *JWTManager) GenerateTwoFAPendingToken(user *models.User, sessionID string) (string, error) {
	return m.generate(user, TokenTwoFAPending, 5*time.Minute, sessionID)
}

func (m *JWTManager) generate(user *models.User, tokenType TokenType, duration time.Duration, sessionID string) (string, error) {
	now := time.Now()

	claims := CustomClaims{
		UserID:           user.ID,
		Email:            user.Email,
		TwoFactorEnabled: user.TwoFactorEnabled,
		Type:             tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    m.cfg.Issuer,
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(duration)),
			NotBefore: jwt.NewNumericDate(now),
			ID:        sessionID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secretBytes)
	if err != nil {
		utils.Error("jwt sign failed", err, nil)
		return "", utils.Internal(err)
	}

	return signed, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

// ValidateToken parses and validates a token against its expected type.
func (m *JWTManager) ValidateToken(tokenStr string, expectedType TokenType) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.secretBytes, nil
	})

	if err != nil {
		switch {
		case errors.Is(err, jwt.ErrTokenExpired):
			return nil, utils.Unauthorized("token has expired")
		case errors.Is(err, jwt.ErrTokenSignatureInvalid):
			return nil, utils.Unauthorized("invalid token signature")
		default:
			return nil, utils.Unauthorized("invalid or malformed token")
		}
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, utils.Unauthorized("invalid token claims")
	}

	if claims.Type != expectedType {
		return nil, utils.Unauthorized(fmt.Sprintf("expected %s token", expectedType))
	}

	if claims.Issuer != m.cfg.Issuer {
		return nil, utils.Unauthorized("invalid token issuer")
	}

	return claims, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// ExtractToken strips "Bearer " prefix from the Authorization header.
func ExtractToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", utils.Unauthorized("missing authorization header")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
		return "", utils.Unauthorized("invalid authorization format — use: Bearer <token>")
	}

	return parts[1], nil
}

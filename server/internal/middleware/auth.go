package middleware

import (
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ─────────────────────────────────────────────────────────────────────────────
// AUTH REQUIRED
// ─────────────────────────────────────────────────────────────────────────────

// AuthRequired guards protected routes.
// Two-layer check: stateless JWT validation + stateful Redis session check.
func AuthRequired(jwt *security.JWTManager, sessions *repo.SessionRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, err := extractAndValidate(c, jwt)
		if err != nil {
			return err
		}

		// Stateful check — ensures revoked sessions are rejected immediately
		if _, err = sessions.GetSession(c.Context(), claims.ID); err != nil {
			return utils.Unauthorized("session expired or invalidated")
		}

		setLocals(c, claims)
		return c.Next()
	}
}

// AdminRequired ensures the authenticated user is an administrator.
// Must be used AFTER AuthRequired.
func AdminRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := GetRole(c)
		if role != string(security.RoleAdmin) {
			return utils.Forbidden("admin access required")
		}
		return c.Next()
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL AUTH
// ─────────────────────────────────────────────────────────────────────────────

// OptionalAuth enriches the context with user info if a valid token is present.
// Never fails — unauthenticated requests pass through normally.
func OptionalAuth(jwt *security.JWTManager, sessions *repo.SessionRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, err := extractAndValidate(c, jwt)
		if err != nil {
			return c.Next()
		}

		if _, err = sessions.GetSession(c.Context(), claims.ID); err != nil {
			return c.Next()
		}

		setLocals(c, claims)
		return c.Next()
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFIED ONLY
// ─────────────────────────────────────────────────────────────────────────────

// VerifiedOnly ensures the request comes from a user who has verified their email.
// Must be placed after AuthRequired in the middleware chain.
func VerifiedOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if c.Locals("user_id") == nil {
			return utils.Unauthorized("authentication required")
		}

		verified, _ := c.Locals("email_verified").(bool)
		if !verified {
			return utils.Forbidden("email verification required")
		}

		return c.Next()
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO FACTOR PENDING
// ─────────────────────────────────────────────────────────────────────────────

// TwoFAPending validates the short-lived 2fa_pending token submitted
// alongside the TOTP code. Used exclusively on the 2FA verify endpoint.
func TwoFAPending(jwt *security.JWTManager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		tokenStr, err := security.ExtractToken(authHeader)
		if err != nil {
			return err
		}

		claims, err := jwt.ValidateToken(tokenStr, security.TokenTwoFAPending)
		if err != nil {
			return err
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("session_id", claims.ID)
		return c.Next()
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

func extractAndValidate(c *fiber.Ctx, jwt *security.JWTManager) (*security.CustomClaims, error) {
	authHeader := c.Get("Authorization")
	tokenStr, err := security.ExtractToken(authHeader)
	if err != nil {
		return nil, err
	}
	return jwt.ValidateToken(tokenStr, security.TokenAccess)
}

func setLocals(c *fiber.Ctx, claims *security.CustomClaims) {
	c.Locals("user_id", claims.UserID) // uuid.UUID
	c.Locals("email", claims.Email)
	c.Locals("session_id", claims.ID)
	c.Locals("2fa_enabled", claims.TwoFactorEnabled)
	c.Locals("role", string(claims.Role))
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT HELPERS (use in handlers)
// ─────────────────────────────────────────────────────────────────────────────

// GetUserID returns the authenticated user's UUID from Fiber locals.
func GetUserID(c *fiber.Ctx) (uuid.UUID, bool) {
	id, ok := c.Locals("user_id").(uuid.UUID)
	return id, ok
}

// GetRole returns the authenticated account's role (user/admin).
func GetRole(c *fiber.Ctx) string {
	role, _ := c.Locals("role").(string)
	return role
}

// IsAdmin returns true if the authenticated account is an administrator.
func IsAdmin(c *fiber.Ctx) bool {
	return GetRole(c) == string(security.RoleAdmin)
}

// GetSessionID returns the session ID from Fiber locals.
func GetSessionID(c *fiber.Ctx) string {
	id, _ := c.Locals("session_id").(string)
	return id
}

// GetEmail returns the authenticated user's email from Fiber locals.
func GetEmail(c *fiber.Ctx) string {
	email, _ := c.Locals("email").(string)
	return email
}
package handler

import (
	"time"

	"server/internal/config"
	"server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

type SessionHandler struct {
	svc *service.SessionService
	cfg *config.Config
}

func NewSessionHandler(
	svc *service.SessionService,
	cfg *config.Config,
) *SessionHandler {
	return &SessionHandler{
		svc: svc,
		cfg: cfg,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ACTIVE SESSIONS
// GET /api/v1/auth/sessions
// ─────────────────────────────────────────────────────────────────────────────

func (h *SessionHandler) GetSessions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	sessionID := c.Locals("session_id").(string)

	sessions, err := h.svc.GetActiveSessions(
		c.Context(),
		userID,
		sessionID,
	)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":  true,
		"sessions": sessions,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT CURRENT SESSION
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

func (h *SessionHandler) Logout(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	sessionID := c.Locals("session_id").(string)

	err := h.svc.Logout(
		c.Context(),
		userID,
		sessionID,
	)
	if err != nil {
		return err
	}

	clearRefreshCookie(c, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "logged out successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE SESSION BY ID
// DELETE /api/v1/auth/sessions/:id
// ─────────────────────────────────────────────────────────────────────────────

func (h *SessionHandler) RevokeSession(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	currentSessionID := c.Locals("session_id").(string)

	targetSessionID := c.Params("id")
	if targetSessionID == "" {
		return utils.BadRequest("session id is required")
	}

	err := h.svc.RevokeSession(
		c.Context(),
		userID,
		currentSessionID,
		targetSessionID,
	)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "session revoked successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE ALL OTHER SESSIONS
// POST /api/v1/auth/logout-all
// ─────────────────────────────────────────────────────────────────────────────

func (h *SessionHandler) RevokeAllSessions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	currentSessionID := c.Locals("session_id").(string)

	err := h.svc.RevokeAllSessions(
		c.Context(),
		userID,
		currentSessionID,
	)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "all other sessions revoked successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// clearRefreshCookie removes refresh token cookie from browser.
func clearRefreshCookie(c *fiber.Ctx, cfg *config.Config) {
	secure := cfg.App.IsProduction()

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth",
		MaxAge:   -1,
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
	})
}

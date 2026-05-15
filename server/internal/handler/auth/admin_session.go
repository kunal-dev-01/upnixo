package handler

import (
	"server/internal/config"
	"server/internal/middleware"
	"server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminSessionHandler struct {
	svc *service.AdminSessionService
	cfg *config.Config
}

func NewAdminSessionHandler(svc *service.AdminSessionService, cfg *config.Config) *AdminSessionHandler {
	return &AdminSessionHandler{svc: svc, cfg: cfg}
}

// GetSessions GET /auth/admin/sessions
func (h *AdminSessionHandler) GetSessions(c *fiber.Ctx) error {
	adminID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("unauthorized")
	}

	sessions, err := h.svc.GetSessions(c.Context(), adminID.String())
	if err != nil {
		return err
	}

	// Mark the current session
	currentID := middleware.GetSessionID(c)
	for i := range sessions {
		if sessions[i].ID == currentID {
			sessions[i].IsCurrent = true
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":  true,
		"sessions": sessions,
	})
}

// RevokeSession DELETE /auth/admin/sessions/:id
func (h *AdminSessionHandler) RevokeSession(c *fiber.Ctx) error {
	adminID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("unauthorized")
	}

	sessionID := c.Params("id")
	if sessionID == "" {
		return utils.BadRequest("session id is required")
	}

	if err := h.svc.RevokeSession(c.Context(), adminID.String(), sessionID); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Session revoked successfully",
	})
}

// RevokeAllSessions POST /auth/admin/logout-all
func (h *AdminSessionHandler) RevokeAllSessions(c *fiber.Ctx) error {
	adminID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("unauthorized")
	}

	if err := h.svc.RevokeAllSessions(c.Context(), adminID.String()); err != nil {
		return err
	}

	// Also clear the current cookie
	clearRefreshCookie(c, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "All sessions revoked successfully",
	})
}

// Logout POST /auth/admin/logout
func (h *AdminSessionHandler) Logout(c *fiber.Ctx) error {
	sessionID := c.Cookies("refresh_token")
	if sessionID != "" {
		_ = h.svc.Logout(c.Context(), sessionID)
	}

	clearRefreshCookie(c, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Logged out successfully",
	})
}

package handler

import (
	"server/internal/dto"
	"server/internal/middleware"
	"server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

type PasswordHandler struct {
	svc *service.PasswordService
}

func NewPasswordHandler(svc *service.PasswordService) *PasswordHandler {
	return &PasswordHandler{svc: svc}
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────

func (h *PasswordHandler) ForgotPassword(c *fiber.Ctx) error {
	var input dto.ForgotPasswordInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	// Always return same response — never reveal if email exists
	_ = h.svc.ForgotPassword(c.Context(), input)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "if this email is registered, a password reset link has been sent",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// POST /api/v1/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────

func (h *PasswordHandler) ResetPassword(c *fiber.Ctx) error {
	var input dto.ResetPasswordInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := h.svc.ResetPassword(c.Context(), input); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "password has been reset successfully — please login",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// POST /api/v1/auth/change-password  (AuthRequired)
// ─────────────────────────────────────────────────────────────────────────────

func (h *PasswordHandler) ChangePassword(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var input dto.ChangePasswordInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := h.svc.ChangePassword(c.Context(), userID, input); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "password changed successfully",
	})
}

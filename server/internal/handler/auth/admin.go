package handler

import (
	"server/internal/config"
	"server/internal/dto"
	"server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminHandler struct {
	svc *service.AdminService
	cfg *config.Config
}

func NewAdminHandler(svc *service.AdminService, cfg *config.Config) *AdminHandler {
	return &AdminHandler{svc: svc, cfg: cfg}
}

// Login POST /auth/admin/login
func (h *AdminHandler) Login(c *fiber.Ctx) error {
	var req dto.AdminLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request input")
	}

	if err := h.svc.Login(c.Context(), req); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Login code sent to your email",
	})
}

// VerifyLogin POST /auth/admin/verify
func (h *AdminHandler) VerifyLogin(c *fiber.Ctx) error {
	var req dto.AdminVerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request input")
	}

	clientInfo := parseClientInfo(c)

	result, err := h.svc.VerifyLogin(c.Context(), req, clientInfo)
	if err != nil {
		return err
	}

	// Set refresh token in httpOnly cookie
	setRefreshCookie(c, result.SessionID, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"access_token": result.AccessToken,
		"admin":        result.Admin,
	})
}

// ForgotPassword POST /auth/admin/forgot-password
func (h *AdminHandler) ForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email" validate:"required,email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request input")
	}

	if err := h.svc.ForgotPassword(c.Context(), req.Email); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Password reset instructions sent to your email",
	})
}

// ResetPassword POST /auth/admin/reset-password
func (h *AdminHandler) ResetPassword(c *fiber.Ctx) error {
	var req dto.AdminResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request input")
	}

	if err := h.svc.ResetPassword(c.Context(), req); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Password has been reset successfully",
	})
}

// ForgotMasterKey POST /auth/admin/forgot-master-key
func (h *AdminHandler) ForgotMasterKey(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email" validate:"required,email"`
		Phone string `json:"phone" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request input")
	}

	if err := h.svc.ForgotMasterKey(c.Context(), req.Email, req.Phone); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Master key reset instructions sent to your email",
	})
}

// ResetMasterKey POST /auth/admin/reset-master-key
func (h *AdminHandler) ResetMasterKey(c *fiber.Ctx) error {
	var req dto.AdminResetMasterKeyRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request input")
	}

	if err := h.svc.ResetMasterKey(c.Context(), req); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Master key has been reset successfully",
	})
}

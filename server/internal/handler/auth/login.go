package handler

import (
	"server/internal/config"
	"server/internal/dto"
	service "server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

type LoginHandler struct {
	svc *service.LoginService
	cfg *config.Config
}

func NewLoginHandler(
	svc *service.LoginService,
	cfg *config.Config,
) *LoginHandler {
	return &LoginHandler{
		svc: svc,
		cfg: cfg,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────

func (h *LoginHandler) Login(c *fiber.Ctx) error {
	var input dto.LoginRequest

	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request input")
	}

	clientInfo := parseClientInfo(c)

	result, err := h.svc.Login(
		c.Context(),
		input.Email,
		input.Password,
		clientInfo,
	)
	if err != nil {
		return err
	}

	// ─────────────────────────────────────────────────────────────────────
	// 2FA REQUIRED
	// ─────────────────────────────────────────────────────────────────────

	if result.TwoFAPending {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"success":              true,
			"two_fa_required":      true,
			"two_fa_pending_token": result.TwoFAPendingToken,
			"message":              "2FA verification required",
		})
	}

	// ─────────────────────────────────────────────────────────────────────
	// LOGIN SUCCESS
	// ─────────────────────────────────────────────────────────────────────

	setRefreshCookie(c, result.AuthResult.SessionID, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"access_token": result.AuthResult.AccessToken,
		"user":         result.AuthResult.User,
	})
}

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

type AccountHandler struct {
	svc *service.AccountService
	cfg *config.Config
}

func NewAccountHandler(svc *service.AccountService, cfg *config.Config) *AccountHandler {
	return &AccountHandler{svc: svc, cfg: cfg}
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────

func (h *AccountHandler) Register(c *fiber.Ctx) error {
	var input service.RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	result, err := h.svc.Register(c.Context(), input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": result.Message,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// GET /api/v1/auth/verify-email?token=xxx
// ─────────────────────────────────────────────────────────────────────────────

func (h *AccountHandler) VerifyEmail(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return utils.BadRequest("verification token is required")
	}

	info := parseClientInfo(c)

	result, err := h.svc.VerifyEmail(c.Context(), token, info)
	if err != nil {
		return err
	}

	// Set refresh token in httpOnly cookie
	setRefreshCookie(c, result.SessionID, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"access_token": result.AccessToken,
		"user":         result.User,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFY EMAIL
// POST /api/v1/auth/resend-verify
// ─────────────────────────────────────────────────────────────────────────────

func (h *AccountHandler) ResendVerifyEmail(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if body.Email == "" {
		return utils.BadRequest("email is required")
	}

	// Always return success — never reveal if email exists or not
	_ = h.svc.ResendVerifyEmail(c.Context(), body.Email)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "if this email is registered, a verification link has been sent",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// setRefreshCookie sets the refresh token (session ID) as a secure httpOnly cookie.
// JS cannot access this cookie — protects against XSS.
func setRefreshCookie(c *fiber.Ctx, sessionID string, cfg *config.Config) {
	secure := cfg.App.IsProduction()

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    sessionID,
		Path:     "/api/v1/auth", // only sent to auth endpoints
		MaxAge:   int(cfg.JWT.RefreshTokenDuration.Seconds()),
		Expires:  time.Now().Add(cfg.JWT.RefreshTokenDuration),
		HTTPOnly: true,   // JS cannot access
		Secure:   secure, // HTTPS only in production
		SameSite: "Lax",  // CSRF protection
	})
}

// parseClientInfo extracts device + location metadata from the request.
func parseClientInfo(c *fiber.Ctx) service.ClientInfo {
	parsed := utils.ParseClientInfo(c.IP(), c.Get("User-Agent"))

	return service.ClientInfo{
		IP:         c.IP(),
		Browser:    parsed.Browser,
		OS:         parsed.OS,
		DeviceName: parsed.DeviceName,
		City:       parsed.City,
		Country:    parsed.Country,
	}
}

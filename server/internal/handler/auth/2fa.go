package handler

import (
	"server/internal/config"
	"server/internal/dto"
	"server/internal/middleware"
	"server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

type TwoFAHandler struct {
	svc *service.TwoFAService
	cfg *config.Config
}

func NewTwoFAHandler(svc *service.TwoFAService, cfg *config.Config) *TwoFAHandler {
	return &TwoFAHandler{svc: svc, cfg: cfg}
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// POST /api/v1/auth/2fa/setup  (AuthRequired)
// ─────────────────────────────────────────────────────────────────────────────

func (h *TwoFAHandler) Setup(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	result, err := h.svc.Setup(c.Context(), userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    result,
		"message": "scan the QR code with your authenticator app, then confirm with a code",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM ENABLE
// POST /api/v1/auth/2fa/confirm  (AuthRequired)
// ─────────────────────────────────────────────────────────────────────────────

func (h *TwoFAHandler) ConfirmEnable(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var input dto.Confirm2FAInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := h.svc.ConfirmEnable(c.Context(), userID, input); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "2FA has been enabled on your account",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TOTP (login step 2)
// POST /api/v1/auth/2fa/verify
// ─────────────────────────────────────────────────────────────────────────────

func (h *TwoFAHandler) VerifyTOTP(c *fiber.Ctx) error {
	var input dto.Verify2FAInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	clientInfo := parseClientInfoDTO(c)

	result, err := h.svc.VerifyTOTP(c.Context(), input, clientInfo)
	if err != nil {
		return err
	}

	setRefreshCookie(c, result.SessionID, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"access_token": result.AccessToken,
		"user":         result.User,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY BACKUP CODE (login step 2 fallback)
// POST /api/v1/auth/2fa/backup
// ─────────────────────────────────────────────────────────────────────────────

func (h *TwoFAHandler) VerifyBackupCode(c *fiber.Ctx) error {
	var input dto.VerifyBackupInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	clientInfo := parseClientInfoDTO(c)

	result, err := h.svc.VerifyBackupCode(c.Context(), input, clientInfo)
	if err != nil {
		return err
	}

	setRefreshCookie(c, result.SessionID, h.cfg)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"access_token": result.AccessToken,
		"user":         result.User,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// DISABLE
// POST /api/v1/auth/2fa/disable  (AuthRequired)
// ─────────────────────────────────────────────────────────────────────────────

func (h *TwoFAHandler) Disable(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var input dto.Disable2FAInput
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := h.svc.Disable(c.Context(), userID, input); err != nil {
		return err
	}

	// Clear refresh cookie — all sessions revoked
	clearRefreshCookie(c)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "2FA disabled — all sessions have been revoked, please login again",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// REGENERATE BACKUP CODES
// POST /api/v1/auth/2fa/backup/regenerate  (AuthRequired)
// ─────────────────────────────────────────────────────────────────────────────

func (h *TwoFAHandler) RegenerateBackupCodes(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var body struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest("invalid request body")
	}
	if body.Code == "" {
		return utils.BadRequest("totp code is required to regenerate backup codes")
	}

	codes, err := h.svc.RegenerateBackupCodes(c.Context(), userID, body.Code)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"backup_codes": codes,
		"message":      "new backup codes generated — save them in a safe place",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

func parseClientInfoDTO(c *fiber.Ctx) dto.ClientInfo {
	parsed := utils.ParseClientInfo(c.IP(), c.Get("User-Agent"))
	return dto.ClientInfo{
		IP:         c.IP(),
		Browser:    parsed.Browser,
		OS:         parsed.OS,
		DeviceName: parsed.DeviceName,
		City:       parsed.City,
		Country:    parsed.Country,
	}
}

func clearRefreshCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})
}

package handler

import (
	"server/internal/config"
	"server/internal/models"
	service "server/internal/service/auth"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

type OAuthHandler struct {
	svc *service.OAuthService
	cfg *config.Config
}

func NewOAuthHandler(
	svc *service.OAuthService,
	cfg *config.Config,
) *OAuthHandler {
	return &OAuthHandler{
		svc: svc,
		cfg: cfg,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE REDIRECT
// GET /api/v1/auth/oauth/google
// ─────────────────────────────────────────────────────────────────────────────

func (h *OAuthHandler) GoogleRedirect(c *fiber.Ctx) error {
	url, err := h.svc.GetRedirectURL(
		c.Context(),
		models.OAuthProviderGoogle,
	)
	if err != nil {
		return err
	}

	return c.Redirect(url, fiber.StatusTemporaryRedirect)
}

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB REDIRECT
// GET /api/v1/auth/oauth/github
// ─────────────────────────────────────────────────────────────────────────────

func (h *OAuthHandler) GithubRedirect(c *fiber.Ctx) error {
	url, err := h.svc.GetRedirectURL(
		c.Context(),
		models.OAuthProviderGitHub,
	)
	if err != nil {
		return err
	}

	return c.Redirect(url, fiber.StatusTemporaryRedirect)
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE CALLBACK
// GET /api/v1/auth/oauth/google/callback
// ─────────────────────────────────────────────────────────────────────────────

func (h *OAuthHandler) GoogleCallback(c *fiber.Ctx) error {
	return h.handleCallback(c, models.OAuthProviderGoogle)
}

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB CALLBACK
// GET /api/v1/auth/oauth/github/callback
// ─────────────────────────────────────────────────────────────────────────────

func (h *OAuthHandler) GithubCallback(c *fiber.Ctx) error {
	return h.handleCallback(c, models.OAuthProviderGitHub)
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL CALLBACK HANDLER
// ─────────────────────────────────────────────────────────────────────────────

func (h *OAuthHandler) handleCallback(
	c *fiber.Ctx,
	provider models.OAuthProvider,
) error {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		return utils.BadRequest("oauth code is required")
	}

	if state == "" {
		return utils.BadRequest("oauth state is required")
	}

	clientInfo := parseClientInfo(c)

	result, err := h.svc.HandleCallback(
		c.Context(),
		provider,
		code,
		state,
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

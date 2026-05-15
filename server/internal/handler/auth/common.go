package handler

import (
	"time"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

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

// parseClientInfo extracts device + location metadata from the request.
func parseClientInfo(c *fiber.Ctx) dto.ClientInfo {
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

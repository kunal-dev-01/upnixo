package app

import (
	"server/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

// RegisterRoutes mounts all application routes onto the Fiber app.
func RegisterRoutes(app *fiber.App, d *Dependencies) {
	// ── Global Middleware ──────────────────────────────────────────────────────
	app.Use(d.LoggerMW.Recovery())
	app.Use(d.LoggerMW.HTTP())
	app.Use(d.Limiters.General)

	// ── Health ────────────────────────────────────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// ── API v1 ────────────────────────────────────────────────────────────────
	v1 := app.Group("/api/v1")

	registerAuthRoutes(v1, d)
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

func registerAuthRoutes(r fiber.Router, d *Dependencies) {
	auth := r.Group("/auth")

	// ── Account ───────────────────────────────────────────────────────────────
	auth.Post("/register", d.Limiters.Auth, d.AccountHandler.Register)
	auth.Get("/verify-email", d.Limiters.OTP, d.AccountHandler.VerifyEmail)
	auth.Post("/resend-verify", d.Limiters.OTP, d.AccountHandler.ResendVerifyEmail)

	// ── Password (public) ─────────────────────────────────────────────────────
	auth.Post("/forgot-password", d.Limiters.Auth, d.PasswordHandler.ForgotPassword)
	auth.Post("/reset-password", d.Limiters.Auth, d.PasswordHandler.ResetPassword)

	// ── OAuth ──────────────────────────────────────────────────────────────────
	auth.Get("/oauth/google", d.Limiters.Auth, d.OAuthHandler.GoogleRedirect)

	auth.Get("/oauth/google/callback",
		d.Limiters.Auth,
		d.OAuthHandler.GoogleCallback,
	)

	auth.Get("/oauth/github", d.Limiters.Auth, d.OAuthHandler.GithubRedirect)

	auth.Get("/oauth/github/callback",
		d.Limiters.Auth,
		d.OAuthHandler.GithubCallback,
	)

	// ── Protected ─────────────────────────────────────────────────────────────
	protected := auth.Group("",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		d.Limiters.API,
	)

	protected.Post("/change-password", d.PasswordHandler.ChangePassword)

	// 2FA management (requires auth)
	protected.Post("/2fa/setup", d.TwoFAHandler.Setup)
	protected.Post("/2fa/confirm", d.TwoFAHandler.ConfirmEnable)
	protected.Post("/2fa/disable", d.TwoFAHandler.Disable)
	protected.Post("/2fa/backup/regenerate", d.TwoFAHandler.RegenerateBackupCodes)
}

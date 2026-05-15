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

	// Split routes into logical functions
	registerPublicAuthRoutes(v1, d)
	registerAdminRoutes(v1, d)
	registerUserRoutes(v1, d)
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

func registerPublicAuthRoutes(r fiber.Router, d *Dependencies) {
	auth := r.Group("/auth")

	// Account
	auth.Post("/register", d.Limiters.Auth, d.AccountHandler.Register)
	auth.Post("/login", d.Limiters.Auth, d.LoginHandler.Login)
	auth.Get("/verify-email", d.Limiters.OTP, d.AccountHandler.VerifyEmail)
	auth.Post("/resend-verify", d.Limiters.OTP, d.AccountHandler.ResendVerifyEmail)

	// Password
	auth.Post("/forgot-password", d.Limiters.Auth, d.PasswordHandler.ForgotPassword)
	auth.Post("/reset-password", d.Limiters.Auth, d.PasswordHandler.ResetPassword)

	// OAuth
	auth.Get("/oauth/google", d.Limiters.Auth, d.OAuthHandler.GoogleRedirect)
	auth.Get("/oauth/google/callback", d.Limiters.Auth, d.OAuthHandler.GoogleCallback)
	auth.Get("/oauth/github", d.Limiters.Auth, d.OAuthHandler.GithubRedirect)
	auth.Get("/oauth/github/callback", d.Limiters.Auth, d.OAuthHandler.GithubCallback)

	// Special Auth (Refresh & 2FA)
	auth.Post("/refresh", d.LoginHandler.Refresh)
	auth.Post("/2fa/verify", d.TwoFAHandler.VerifyTOTP)
	auth.Post("/2fa/backup", d.TwoFAHandler.VerifyBackupCode)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

func registerAdminRoutes(r fiber.Router, d *Dependencies) {
	admin := r.Group("/auth/admin")

	// Public Admin Auth
	admin.Post("/login", d.Limiters.Auth, d.AdminHandler.Login)
	admin.Post("/verify", d.Limiters.Auth, d.AdminHandler.VerifyLogin)
	admin.Post("/forgot-password", d.Limiters.Auth, d.AdminHandler.ForgotPassword)
	admin.Post("/reset-password", d.Limiters.Auth, d.AdminHandler.ResetPassword)
	admin.Post("/forgot-master-key", d.Limiters.Auth, d.AdminHandler.ForgotMasterKey)
	admin.Post("/reset-master-key", d.Limiters.Auth, d.AdminHandler.ResetMasterKey)
	admin.Post("/refresh", d.AdminHandler.Refresh)
	admin.Post("/logout", d.AdminSessionHandler.Logout)

	// Protected Admin Routes
	protected := admin.Group("/",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		middleware.AdminRequired(),
		d.Limiters.API,
	)

	protected.Get("/sessions", d.AdminSessionHandler.GetSessions)
	protected.Delete("/sessions/:id", d.AdminSessionHandler.RevokeSession)
	protected.Post("/logout-all", d.AdminSessionHandler.RevokeAllSessions)
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ROUTES (Protected)
// ─────────────────────────────────────────────────────────────────────────────

func registerUserRoutes(r fiber.Router, d *Dependencies) {
	// Root protected group for users
	protected := r.Group("/",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		d.Limiters.API,
	)

	// Password Management
	protected.Post("/auth/change-password", d.PasswordHandler.ChangePassword)

	// 2FA Management
	twoFA := protected.Group("/auth/2fa")
	twoFA.Post("/setup", d.TwoFAHandler.Setup)
	twoFA.Post("/confirm", d.TwoFAHandler.ConfirmEnable)
	twoFA.Post("/disable", d.TwoFAHandler.Disable)
	twoFA.Post("/backup/regenerate", d.TwoFAHandler.RegenerateBackupCodes)

	// Session Management
	sessions := protected.Group("/auth/sessions")
	sessions.Get("/", d.SessionHandler.GetSessions)
	sessions.Post("/logout", d.SessionHandler.Logout)
	sessions.Post("/logout-all", d.SessionHandler.RevokeAllSessions)
	sessions.Delete("/:id", d.SessionHandler.RevokeSession)

	// User Profile
	user := protected.Group("/user")
	user.Get("/me", d.UserHandler.GetMe)
	user.Get("/:id", d.UserHandler.GetByID)
	user.Get("/email/:email", d.UserHandler.GetByEmail)
	user.Patch("/profile", d.UserHandler.UpdateProfile)
	user.Patch("/preferences", d.UserHandler.UpdatePreferences)
	user.Post("/avatar", d.UserHandler.UpdateAvatar)
}

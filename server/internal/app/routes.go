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
	app.Use(d.Limiters.General) // global IP-based limit on all routes

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

	// Registration — Auth limiter (10 req / 5 min per IP)
	auth.Post("/register", d.Limiters.Auth, d.AccountHandler.Register)

	// Email verification — OTP limiter (3 req / 10 min per IP)
	auth.Get("/verify-email", d.Limiters.OTP, d.AccountHandler.VerifyEmail)
	auth.Post("/resend-verify", d.Limiters.OTP, d.AccountHandler.ResendVerifyEmail)

	// Protected routes — auth required + API limiter per user
	protected := auth.Group("",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		d.Limiters.API,
	)
	_ = protected // more routes will be added here
}

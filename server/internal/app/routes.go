package app

import (
	"server/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/contrib/websocket"
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
	registerProjectRoutes(v1, d)
	registerMilestoneRoutes(v1, d)
	registerChatRoutes(v1, d)
	registerVaultRoutes(v1, d)
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
	protected.Get("/users", d.UserHandler.ListUsers)
	protected.Post("/users/:id/block", d.UserHandler.BlockUser)
	protected.Post("/users/:id/unblock", d.UserHandler.UnblockUser)
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

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT ROUTES (Protected)
// ─────────────────────────────────────────────────────────────────────────────

func registerProjectRoutes(r fiber.Router, d *Dependencies) {
	projects := r.Group("/projects",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		d.Limiters.API,
	)

	projects.Post("/", d.ProjectHandler.Create)
	projects.Get("/", d.ProjectHandler.ListByClient)
	projects.Get("/freelancer", d.ProjectHandler.ListByFreelancer)
	projects.Get("/:id", d.ProjectHandler.GetByID)
	projects.Get("/slug/:slug", d.ProjectHandler.GetBySlug)
	projects.Patch("/:id", d.ProjectHandler.ClientUpdate)

	// Admin routes
	admin := r.Group("/auth/admin/projects",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		middleware.AdminRequired(),
		d.Limiters.API,
	)
	admin.Get("/", d.ProjectHandler.ListAll)
	admin.Patch("/:id", d.ProjectHandler.AdminUpdate)
	admin.Delete("/:id", d.ProjectHandler.Delete)
}

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONE ROUTES (Protected)
// ─────────────────────────────────────────────────────────────────────────────

func registerMilestoneRoutes(r fiber.Router, d *Dependencies) {
	// User routes (Read-only access to their project's milestones)
	milestones := r.Group("/milestones",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		d.Limiters.API,
	)
	milestones.Get("/:id", d.MilestoneHandler.GetByID)
	milestones.Get("/project/:project_id", d.MilestoneHandler.ListByProject)

	// Admin routes (Full management power)
	admin := r.Group("/auth/admin/milestones",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		middleware.AdminRequired(),
		d.Limiters.API,
	)
	admin.Post("/", d.MilestoneHandler.Create)
	admin.Patch("/:id", d.MilestoneHandler.Update)
	admin.Delete("/:id", d.MilestoneHandler.Delete)
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

func registerChatRoutes(r fiber.Router, d *Dependencies) {
	chat := r.Group("/projects")

	// WebSocket: /api/v1/projects/:id/ws
	chat.Get("/:id/ws",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		func(c *fiber.Ctx) error {
			if websocket.IsWebSocketUpgrade(c) {
				return c.Next()
			}
			return fiber.ErrUpgradeRequired
		},
		websocket.New(d.WSHandler.Handle),
	)
}

// ─────────────────────────────────────────────────────────────────────────────
// VAULT ROUTES (Protected)
// ─────────────────────────────────────────────────────────────────────────────

func registerVaultRoutes(r fiber.Router, d *Dependencies) {
	// User routes (Read/Write access based on project participants)
	vault := r.Group("/vault",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		d.Limiters.API,
	)
	
	// Collections
	vault.Post("/collections", d.VaultHandler.CreateCollection)
	vault.Get("/collections/:id", d.VaultHandler.GetCollection)
	vault.Get("/collections/project/:project_id", d.VaultHandler.ListCollectionsByProject)
	vault.Patch("/collections/:id", d.VaultHandler.UpdateCollection)
	vault.Delete("/collections/:id", d.VaultHandler.DeleteCollection)

	// Items
	vault.Post("/items", d.VaultHandler.CreateItem)
	vault.Get("/items/:id", d.VaultHandler.GetItem)
	vault.Get("/items/collection/:collection_id", d.VaultHandler.ListItemsByCollection)
	vault.Patch("/items/:id", d.VaultHandler.UpdateItem)
	vault.Delete("/items/:id", d.VaultHandler.DeleteItem)

	// Admin routes (Full management power)
	admin := r.Group("/auth/admin/vault",
		middleware.AuthRequired(d.JWT, d.SessionRepo),
		middleware.AdminRequired(),
		d.Limiters.API,
	)
	
	// Admin Collections
	admin.Post("/collections", d.VaultHandler.CreateCollection)
	admin.Get("/collections/:id", d.VaultHandler.GetCollection)
	admin.Get("/collections/project/:project_id", d.VaultHandler.ListCollectionsByProject)
	admin.Patch("/collections/:id", d.VaultHandler.UpdateCollection)
	admin.Delete("/collections/:id", d.VaultHandler.DeleteCollection)

	// Admin Items
	admin.Post("/items", d.VaultHandler.CreateItem)
	admin.Get("/items/:id", d.VaultHandler.GetItem)
	admin.Get("/items/collection/:collection_id", d.VaultHandler.ListItemsByCollection)
	admin.Patch("/items/:id", d.VaultHandler.UpdateItem)
	admin.Delete("/items/:id", d.VaultHandler.DeleteItem)
}

package app

import (
	"server/internal/broker"
	"server/internal/config"
	"server/internal/email"
	handler "server/internal/handler/auth"
	chatHandler "server/internal/handler/chat"
	projectHandler "server/internal/handler/project"
	userHandler "server/internal/handler/user"
	vaultHandler "server/internal/handler/vault"
	"server/internal/middleware"
	"server/internal/queue"
	rds "server/internal/redis"
	"server/internal/repo"
	"server/internal/security"
	service "server/internal/service/auth"
	chatService "server/internal/service/chat"
	projectService "server/internal/service/project"
	"server/internal/service/storage"
	userService "server/internal/service/user"
	vaultService "server/internal/service/vault"
	"server/internal/utils"
)

// Dependencies holds every wired dependency for the application.
// Built once at startup — no globals, no init().
type Dependencies struct {
	// Infrastructure
	Config *config.Config
	Logger *utils.Logger
	Redis  *rds.Redis
	Broker *broker.RabbitBroker
	Queue  *queue.Manager
	R2     *storage.R2Service

	// Security
	JWT *security.JWTManager

	// Repositories
	AuthRepo      repo.AuthRepository
	AdminRepo     repo.AdminRepository
	ProjectRepo   repo.ProjectRepository
	MilestoneRepo repo.MilestoneRepository
	ChatRepo      repo.ChatRepository
	VaultRepo     repo.VaultRepository
	SessionRepo   *repo.SessionRepository
	TokenRepo     *repo.TokenRepository

	// Services
	EmailSvc        *email.EmailService
	AccountSvc      *service.AccountService
	AdminSvc        *service.AdminService
	AdminSessionSvc *service.AdminSessionService
	PasswordSvc     *service.PasswordService
	TwoFASvc        *service.TwoFAService
	OAuthSvc        *service.OAuthService
	LoginSvc        *service.LoginService
	SessionSvc      *service.SessionService
	UserSvc         *userService.UserService
	ProjectSvc      *projectService.ProjectService
	MilestoneSvc    *projectService.MilestoneService
	MediaSvc        *chatService.MediaService
	ChatSvc         *chatService.ChatService
	WSMgr           *chatService.WSManager
	VaultSvc        *vaultService.VaultService

	// Handlers
	AccountHandler      *handler.AccountHandler
	AdminHandler        *handler.AdminHandler
	AdminSessionHandler *handler.AdminSessionHandler
	PasswordHandler     *handler.PasswordHandler
	TwoFAHandler        *handler.TwoFAHandler
	OAuthHandler        *handler.OAuthHandler
	LoginHandler        *handler.LoginHandler
	SessionHandler      *handler.SessionHandler
	UserHandler         *userHandler.UserHandler
	ProjectHandler      *projectHandler.ProjectHandler
	MilestoneHandler    *projectHandler.MilestoneHandler
	WSHandler           *chatHandler.WSHandler
	VaultHandler        *vaultHandler.VaultHandler

	// Middleware
	LoggerMW *middleware.Logger
	Limiters *middleware.Limiters
}

// Wire builds and connects all dependencies in the correct order.
func Wire(cfg *config.Config, log *utils.Logger, redisClient *rds.Redis, brk *broker.RabbitBroker, emailSvc *email.EmailService) *Dependencies {
	// ── Security ──────────────────────────────────────────────────────────────
	jwt := security.NewJWTManager(&cfg.JWT)

	// ── Infrastructure ───────────────────────────────────────────────────────
	qManager := queue.NewManager(cfg, brk)
	if err := qManager.SetupQueues(); err != nil {
		utils.Fatal("failed to setup queues", err, nil)
	}

	r2Svc := storage.NewR2Service(cfg)

	// ── Repositories ──────────────────────────────────────────────────────────
	authRepo := repo.NewAuthRepository(log)
	adminRepo := repo.NewAdminRepository(log)
	projectRepo := repo.NewProjectRepository(log)
	milestoneRepo := repo.NewMilestoneRepository(log)
	chatRepo := repo.NewChatRepository(log)
	vaultRepo := repo.NewVaultRepository(log)
	sessionRepo := repo.NewSessionRepository(redisClient, cfg)
	tokenRepo := repo.NewTokenRepository(redisClient)

	// ── Services ──────────────────────────────────────────────────────────────
	accountSvc := service.NewAccountService(cfg, authRepo, tokenRepo, sessionRepo, jwt, emailSvc)
	adminSvc := service.NewAdminService(cfg, adminRepo, tokenRepo, sessionRepo, jwt, emailSvc)
	adminSessionSvc := service.NewAdminSessionService(sessionRepo)
	passwordSvc := service.NewPasswordService(cfg, authRepo, tokenRepo, emailSvc)
	twoFASvc := service.NewTwoFAService(cfg, authRepo, tokenRepo, sessionRepo, jwt)
	oAuthSvc := service.NewOAuthService(cfg, authRepo, tokenRepo, sessionRepo, jwt)
	loginSvc := service.NewLoginService(cfg, authRepo, tokenRepo, sessionRepo, jwt)
	sessionSvc := service.NewSessionService(sessionRepo)
	userSvc := userService.NewUserService(cfg, authRepo, sessionRepo, qManager)
	projectSvc := projectService.NewProjectService(projectRepo, log)
	milestoneSvc := projectService.NewMilestoneService(milestoneRepo, projectRepo, log)
	mediaSvc := chatService.NewMediaService(cfg, r2Svc, qManager, log)
	chatSvc := chatService.NewChatService(chatRepo, projectRepo, log)
	wsMgr := chatService.NewWSManager(log)
	vaultSvc := vaultService.NewVaultService(vaultRepo, projectRepo, cfg, log)

	// ── Handlers ──────────────────────────────────────────────────────────────
	accountHandler := handler.NewAccountHandler(accountSvc, cfg)
	adminHandler := handler.NewAdminHandler(adminSvc, cfg)
	adminSessionHandler := handler.NewAdminSessionHandler(adminSessionSvc, cfg)
	passwordHandler := handler.NewPasswordHandler(passwordSvc)
	twoFAHandler := handler.NewTwoFAHandler(twoFASvc, cfg)
	oAuthHandler := handler.NewOAuthHandler(oAuthSvc, cfg)
	loginHandler := handler.NewLoginHandler(loginSvc, cfg)
	sessionHandler := handler.NewSessionHandler(sessionSvc, cfg)
	userHdl := userHandler.NewUserHandler(userSvc)
	projectHdl := projectHandler.NewProjectHandler(projectSvc)
	milestoneHdl := projectHandler.NewMilestoneHandler(milestoneSvc)
	wsHandler := chatHandler.NewWSHandler(chatSvc, wsMgr, log)
	vaultHdl := vaultHandler.NewVaultHandler(vaultSvc)

	// ── Middleware ─────────────────────────────────────────────────────────────
	loggerMW := middleware.NewLogger(log, cfg)
	limiters := middleware.NewLimiters(redisClient)

	return &Dependencies{
		Config:              cfg,
		Logger:              log,
		Redis:               redisClient,
		Broker:              brk,
		Queue:               qManager,
		R2:                  r2Svc,
		JWT:                 jwt,
		AuthRepo:            authRepo,
		AdminRepo:           adminRepo,
		ProjectRepo:         projectRepo,
		MilestoneRepo:       milestoneRepo,
		ChatRepo:            chatRepo,
		VaultRepo:           vaultRepo,
		SessionRepo:         sessionRepo,
		TokenRepo:           tokenRepo,
		EmailSvc:            emailSvc,
		AccountSvc:          accountSvc,
		AdminSvc:            adminSvc,
		AdminSessionSvc:     adminSessionSvc,
		PasswordSvc:         passwordSvc,
		TwoFASvc:            twoFASvc,
		OAuthSvc:            oAuthSvc,
		LoginSvc:            loginSvc,
		SessionSvc:          sessionSvc,
		UserSvc:             userSvc,
		ProjectSvc:          projectSvc,
		MilestoneSvc:        milestoneSvc,
		MediaSvc:            mediaSvc,
		ChatSvc:             chatSvc,
		WSMgr:               wsMgr,
		VaultSvc:            vaultSvc,
		AccountHandler:      accountHandler,
		AdminHandler:        adminHandler,
		AdminSessionHandler: adminSessionHandler,
		PasswordHandler:     passwordHandler,
		TwoFAHandler:        twoFAHandler,
		OAuthHandler:        oAuthHandler,
		LoginHandler:        loginHandler,
		SessionHandler:      sessionHandler,
		UserHandler:         userHdl,
		ProjectHandler:      projectHdl,
		MilestoneHandler:    milestoneHdl,
		WSHandler:           wsHandler,
		VaultHandler:        vaultHdl,
		LoggerMW:            loggerMW,
		Limiters:            limiters,
	}
}

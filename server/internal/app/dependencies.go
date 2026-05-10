package app

import (
	"server/internal/broker"
	"server/internal/config"
	"server/internal/email"
	"server/internal/handler/auth"
	userHandler "server/internal/handler/user"
	"server/internal/middleware"
	"server/internal/queue"
	rds "server/internal/redis"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/service/auth"
	"server/internal/service/storage"
	userService "server/internal/service/user"
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
	AuthRepo    repo.AuthRepository
	SessionRepo *repo.SessionRepository
	TokenRepo   *repo.TokenRepository

	// Services
	EmailSvc    *email.EmailService
	AccountSvc  *service.AccountService
	PasswordSvc *service.PasswordService
	TwoFASvc    *service.TwoFAService
	OAuthSvc    *service.OAuthService
	LoginSvc    *service.LoginService
	SessionSvc  *service.SessionService
	UserSvc     *userService.UserService

	// Handlers
	AccountHandler  *handler.AccountHandler
	PasswordHandler *handler.PasswordHandler
	TwoFAHandler    *handler.TwoFAHandler
	OAuthHandler    *handler.OAuthHandler
	LoginHandler    *handler.LoginHandler
	SessionHandler  *handler.SessionHandler
	UserHandler     *userHandler.UserHandler

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
	sessionRepo := repo.NewSessionRepository(redisClient, cfg)
	tokenRepo := repo.NewTokenRepository(redisClient)

	// ── Services ──────────────────────────────────────────────────────────────
	accountSvc := service.NewAccountService(cfg, authRepo, tokenRepo, sessionRepo, emailSvc)
	passwordSvc := service.NewPasswordService(cfg, authRepo, tokenRepo, emailSvc)
	twoFASvc := service.NewTwoFAService(cfg, authRepo, tokenRepo, sessionRepo, jwt)
	oAuthSvc := service.NewOAuthService(cfg, authRepo, tokenRepo, sessionRepo, jwt)
	loginSvc := service.NewLoginService(cfg, authRepo, tokenRepo, sessionRepo, jwt)
	sessionSvc := service.NewSessionService(sessionRepo)
	userSvc := userService.NewUserService(cfg, authRepo, qManager)

	// ── Handlers ──────────────────────────────────────────────────────────────
	accountHandler := handler.NewAccountHandler(accountSvc, cfg)
	passwordHandler := handler.NewPasswordHandler(passwordSvc)
	twoFAHandler := handler.NewTwoFAHandler(twoFASvc, cfg)
	oAuthHandler := handler.NewOAuthHandler(oAuthSvc, cfg)
	loginHandler := handler.NewLoginHandler(loginSvc, cfg)
	sessionHandler := handler.NewSessionHandler(sessionSvc, cfg)
	userHandler := userHandler.NewUserHandler(userSvc)

	// ── Middleware ─────────────────────────────────────────────────────────────
	loggerMW := middleware.NewLogger(log, cfg)
	limiters := middleware.NewLimiters(redisClient)

	return &Dependencies{
		Config:          cfg,
		Logger:          log,
		Redis:           redisClient,
		Broker:          brk,
		Queue:           qManager,
		R2:              r2Svc,
		JWT:             jwt,
		AuthRepo:        authRepo,
		SessionRepo:     sessionRepo,
		TokenRepo:       tokenRepo,
		EmailSvc:        emailSvc,
		AccountSvc:      accountSvc,
		PasswordSvc:     passwordSvc,
		TwoFASvc:        twoFASvc,
		OAuthSvc:        oAuthSvc,
		LoginSvc:        loginSvc,
		SessionSvc:      sessionSvc,
		UserSvc:         userSvc,
		AccountHandler:  accountHandler,
		PasswordHandler: passwordHandler,
		TwoFAHandler:    twoFAHandler,
		OAuthHandler:    oAuthHandler,
		LoginHandler:    loginHandler,
		SessionHandler:  sessionHandler,
		UserHandler:     userHandler,
		LoggerMW:        loggerMW,
		Limiters:        limiters,
	}
}

package service

import (
	"context"
	"time"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/email"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"

	"github.com/google/uuid"
)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type AccountService struct {
	cfg         *config.Config
	authRepo    repo.AuthRepository
	tokenRepo   *repo.TokenRepository
	sessionRepo *repo.SessionRepository
	emailSvc    *email.EmailService
}

func NewAccountService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	emailSvc *email.EmailService,
) *AccountService {
	return &AccountService{
		cfg:         cfg,
		authRepo:    authRepo,
		tokenRepo:   tokenRepo,
		sessionRepo: sessionRepo,
		emailSvc:    emailSvc,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

type RegisterInput struct {
	FullName string `json:"full_name" validate:"required,valid_name"`
	Email    string `json:"email"     validate:"required,email"`
	Password string `json:"password"  validate:"required,secure_password"`
}

type RegisterResult struct {
	Message string `json:"message"`
}

type VerifyEmailResult struct {
	User        *models.SafeUser `json:"user"`
	AccessToken string           `json:"access_token"`
	SessionID   string           `json:"session_id"`
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

func (s *AccountService) Register(ctx context.Context, input RegisterInput) (*RegisterResult, error) {
	// 1. Validate input
	if err := utils.ValidateStructToAppError(input); err != nil {
		return nil, err
	}

	// 2. Hash password
	hash, err := security.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	// 3. Create user
	user, err := s.authRepo.Register(ctx, repo.RegisterParams{
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.FullName,
	})
	if err != nil {
		return nil, err
	}

	// 4. Send verification email in background — never block register response
	go s.sendVerificationEmail(user)

	return &RegisterResult{
		Message: "account created — please check your email to verify your account",
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────

func (s *AccountService) VerifyEmail(ctx context.Context, token string, clientInfo ClientInfo) (*VerifyEmailResult, error) {
	// 1. Consume token (single-use, deletes from Redis)
	userIDStr, err := s.tokenRepo.ConsumeEmailVerifyToken(ctx, token)
	if err != nil {
		return nil, err
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, utils.BadRequest("invalid token payload")
	}

	// 2. Mark email verified in DB
	if err = s.authRepo.VerifyEmail(ctx, userID); err != nil {
		return nil, err
	}

	// 3. Fetch fresh user
	user, err := s.authRepo.GetUserForLogin(ctx, "")
	if err != nil {
		return nil, err
	}
	// Re-fetch by ID since GetUserForLogin takes email
	user, err = s.fetchUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 4. Create session + tokens
	result, err := s.createSession(ctx, user, clientInfo)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────

func (s *AccountService) ResendVerifyEmail(ctx context.Context, email string) error {
	// 1. Fetch user — generic error to prevent email enumeration
	user, err := s.authRepo.GetUserForLogin(ctx, email)
	if err != nil {
		// Return success anyway — don't leak whether email exists
		return nil
	}

	// 2. Already verified — silent no-op
	if user.EmailVerified {
		return nil
	}

	// 3. Send in background
	go s.sendVerificationEmail(user)

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

// sendVerificationEmail generates a token and queues the email.
// Always called in a goroutine — uses a fresh background context.
func (s *AccountService) sendVerificationEmail(user *models.User) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	token, err := security.GenerateEmailVerifyToken()
	if err != nil {
		utils.Error("generate email verify token failed", err, map[string]any{
			"user_id": user.ID,
		})
		return
	}

	ttl := 24 * time.Hour
	if err = s.tokenRepo.StoreEmailVerifyToken(ctx, user.ID.String(), token, ttl); err != nil {
		utils.Error("store email verify token failed", err, map[string]any{
			"user_id": user.ID,
		})
		return
	}

	if err = s.emailSvc.SendVerificationEmail(user.FullName, user.Email, token); err != nil {
		utils.Error("queue verification email failed", err, map[string]any{
			"user_id": user.ID,
		})
	}
}

// createSession builds JWT pair + stores session in Redis.
func (s *AccountService) createSession(ctx context.Context, user *models.User, info ClientInfo) (*VerifyEmailResult, error) {
	sessionID, err := security.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	jwt := security.NewJWTManager(&s.cfg.JWT)

	pair, err := jwt.GenerateTokenPair(user, sessionID)
	if err != nil {
		return nil, err
	}

	ttl := s.cfg.JWT.RefreshTokenDuration
	expiresAt := time.Now().Add(ttl)

	meta := &dto.SessionMetadata{
		ID:           sessionID,
		UserID:       user.ID.String(),
		RefreshToken: pair.RefreshToken,
		IPAddress:    info.IP,
		Browser:      info.Browser,
		OS:           info.OS,
		DeviceName:   info.DeviceName,
		City:         info.City,
		Country:      info.Country,
		CreatedAt:    time.Now(),
		ExpiresAt:    expiresAt,
	}

	if err = s.sessionRepo.StoreSession(ctx, meta, ttl); err != nil {
		return nil, err
	}

	safe := user.ToSafe()

	return &VerifyEmailResult{
		User:        &safe,
		AccessToken: pair.AccessToken,
		SessionID:   sessionID,
	}, nil
}

// fetchUserByID is a thin wrapper — add a GetByID method to AuthRepository
// or use a separate UserRepository if preferred.
func (s *AccountService) fetchUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	// Delegate to authRepo — add GetByID to AuthRepository interface if not present
	user, err := s.authRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// ClientInfo carries parsed request metadata passed from the handler.
type ClientInfo struct {
	IP         string
	Browser    string
	OS         string
	DeviceName string
	City       string
	Country    string
}

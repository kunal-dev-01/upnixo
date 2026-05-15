package service

import (
	"context"
	"fmt"
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
	baseService
	authRepo  repo.AuthRepository
	tokenRepo *repo.TokenRepository
	emailSvc  *email.EmailService
}

func NewAccountService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	jwt *security.JWTManager,
	emailSvc *email.EmailService,
) *AccountService {
	return &AccountService{
		baseService: baseService{
			cfg:         cfg,
			sessionRepo: sessionRepo,
			jwt:         jwt,
		},
		authRepo:  authRepo,
		tokenRepo: tokenRepo,
		emailSvc:  emailSvc,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

func (s *AccountService) Register(ctx context.Context, input dto.RegisterRequest) (*dto.RegisterResponse, error) {
	// 1. Validate input
	if err := utils.ValidateStructToAppError(input); err != nil {
		return nil, err
	}

	// 2. Check for existing account (Security: prevent registration overlap with OAuth)
	existingUser, _, err := s.authRepo.GetUserByEmail(ctx, input.Email)
	if err == nil && existingUser != nil {
		// Fetch linked OAuth accounts
		accounts, err := s.authRepo.GetOAuthAccountsByUserID(ctx, existingUser.ID)
		if err == nil && len(accounts) > 0 {
			// Found an OAuth account -> tell them to login via provider
			return nil, utils.Conflict(fmt.Sprintf(
				"This email is already associated with a %s account. Please sign in using %s.",
				accounts[0].Provider, accounts[0].Provider,
			))
		}
		// Found a regular user -> standard conflict
		return nil, utils.Conflict("Email is already registered. Please log in instead.")
	}

	// 3. Hash password
	hash, err := security.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	// 4. Create user
	user, err := s.authRepo.Register(ctx, repo.RegisterParams{
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.FullName,
	})
	if err != nil {
		return nil, err
	}

	// 5. Send verification email in background — never block register response
	go s.sendVerificationEmail(user)

	return &dto.RegisterResponse{
		Message: "account created — please check your email to verify your account",
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────

func (s *AccountService) VerifyEmail(ctx context.Context, token string, clientInfo dto.ClientInfo) (*dto.AuthResult, error) {
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

	// 3. Fetch fresh user (Re-fetch by ID since we have it)
	user, prefs, err := s.fetchUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 4. Create session + tokens
	result, err := s.createSession(ctx, user, prefs, clientInfo)
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
	user, _, err := s.authRepo.GetUserForLogin(ctx, email)
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

func (s *AccountService) fetchUserByID(ctx context.Context, id uuid.UUID) (*models.User, *models.UserPreferences, error) {
	// Delegate to authRepo — add GetByID to AuthRepository interface if not present
	user, prefs, err := s.authRepo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	return user, prefs, nil
}

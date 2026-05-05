package service

import (
	"context"
	"time"

	"server/internal/config"
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

type PasswordService struct {
	cfg       *config.Config
	authRepo  repo.AuthRepository
	tokenRepo *repo.TokenRepository
	emailSvc  *email.EmailService
}

func NewPasswordService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	emailSvc *email.EmailService,
) *PasswordService {
	return &PasswordService{
		cfg:       cfg,
		authRepo:  authRepo,
		tokenRepo: tokenRepo,
		emailSvc:  emailSvc,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT DTOs
// ─────────────────────────────────────────────────────────────────────────────

type ForgotPasswordInput struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordInput struct {
	Token    string `json:"token"    validate:"required"`
	Password string `json:"password" validate:"required,secure_password"`
}

type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password"     validate:"required,secure_password"`
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

// ForgotPassword generates a reset token and queues the email.
// Always returns success — never reveals whether the email exists.
func (s *PasswordService) ForgotPassword(ctx context.Context, input ForgotPasswordInput) error {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return err
	}

	user, err := s.authRepo.GetUserForLogin(ctx, input.Email)
	if err != nil {
		// Silent — do not leak whether email is registered
		return nil
	}

	// Pure-OAuth users have no password — silent no-op
	if !user.HasPassword() {
		return nil
	}

	go s.sendPasswordResetEmail(user)

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD (token-based, unauthenticated)
// ─────────────────────────────────────────────────────────────────────────────

// ResetPassword validates the token and sets a new password.
func (s *PasswordService) ResetPassword(ctx context.Context, input ResetPasswordInput) error {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return err
	}

	// 1. Consume token — single-use, deleted from Redis immediately
	userIDStr, err := s.tokenRepo.ConsumePasswordResetToken(ctx, input.Token)
	if err != nil {
		return err
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return utils.BadRequest("invalid reset token payload")
	}

	// 2. Hash new password
	hash, err := security.HashPassword(input.Password)
	if err != nil {
		return err
	}

	// 3. Persist
	if err = s.authRepo.ResetPassword(ctx, userID, hash); err != nil {
		return err
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD (authenticated)
// ─────────────────────────────────────────────────────────────────────────────

// ChangePassword verifies the current password before setting a new one.
// userID comes from JWT claims — never trust client input for this.
func (s *PasswordService) ChangePassword(ctx context.Context, userID uuid.UUID, input ChangePasswordInput) error {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return err
	}

	// 1. Fetch user
	user, err := s.authRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// 2. Pure-OAuth users have no password to change
	if !user.HasPassword() {
		return utils.BadRequest("your account uses social login — set a password first")
	}

	// 3. Verify current password
	if !security.VerifyPassword(user.PasswordHash.String, input.CurrentPassword) {
		return utils.Unauthorized("current password is incorrect")
	}

	// 4. Prevent reuse — new password must differ from current
	if security.VerifyPassword(user.PasswordHash.String, input.NewPassword) {
		return utils.BadRequest("new password must be different from your current password")
	}

	// 5. Hash + persist
	hash, err := security.HashPassword(input.NewPassword)
	if err != nil {
		return err
	}

	return s.authRepo.ResetPassword(ctx, userID, hash)
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

// sendPasswordResetEmail generates a token, stores it in Redis, and queues the email.
// Always called in a goroutine — uses a fresh background context.
func (s *PasswordService) sendPasswordResetEmail(user *models.User) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	token, err := security.GeneratePasswordResetToken()
	if err != nil {
		utils.Error("generate password reset token failed", err, map[string]any{
			"user_id": user.ID,
		})
		return
	}

	ttl := 15 * time.Minute
	if err = s.tokenRepo.StorePasswordResetToken(ctx, user.ID.String(), token, ttl); err != nil {
		utils.Error("store password reset token failed", err, map[string]any{
			"user_id": user.ID,
		})
		return
	}

	// Mark reset as requested in DB (audit trail)
	go func() {
		bgCtx, bgCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer bgCancel()
		if dbErr := s.authRepo.MarkPasswordResetRequested(bgCtx, user.ID); dbErr != nil {
			utils.Error("mark password reset requested failed", dbErr, map[string]any{
				"user_id": user.ID,
			})
		}
	}()

	if err = s.emailSvc.SendPasswordResetEmail(user.FullName, user.Email, token); err != nil {
		utils.Error("queue password reset email failed", err, map[string]any{
			"user_id": user.ID,
		})
	}
}

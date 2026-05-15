package service

import (
	"context"
	"time"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"

	"github.com/google/uuid"
)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type LoginService struct {
	baseService
	authRepo  repo.AuthRepository
	tokenRepo *repo.TokenRepository
}

func NewLoginService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	jwt *security.JWTManager,
) *LoginService {
	return &LoginService{
		baseService: baseService{
			cfg:         cfg,
			sessionRepo: sessionRepo,
			jwt:         jwt,
		},
		authRepo:  authRepo,
		tokenRepo: tokenRepo,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

func (s *LoginService) Login(
	ctx context.Context,
	email string,
	password string,
	clientInfo dto.ClientInfo,
) (*dto.LoginResult, error) {

	// ─────────────────────────────────────────────────────────────────────
	// VALIDATION
	// ─────────────────────────────────────────────────────────────────────

	if email == "" || password == "" {
		return nil, utils.BadRequest("email and password are required")
	}

	// ─────────────────────────────────────────────────────────────────────
	// ACCOUNT LOCK CHECK
	// ─────────────────────────────────────────────────────────────────────

	locked, err := s.tokenRepo.IsAccountLocked(ctx, email)
	if err != nil {
		return nil, err
	}

	if locked {
		utils.Warn("login blocked: account locked", map[string]any{
			"email": email,
			"ip":    clientInfo.IP,
		})

		return nil, utils.TooManyRequests(
			"account temporarily locked due to too many failed login attempts",
		)
	}

	// ─────────────────────────────────────────────────────────────────────
	// FIND USER
	// ─────────────────────────────────────────────────────────────────────

	user, prefs, err := s.authRepo.GetUserForLogin(ctx, email)
	if err != nil {
		utils.Warn("login failed", map[string]any{
			"email": email,
			"ip":    clientInfo.IP,
		})

		_, _ = s.handleFailedAttempt(ctx, email)

		return nil, utils.Unauthorized("invalid email or password")
	}

	// ─────────────────────────────────────────────────────────────────────
	// PASSWORD LOGIN CHECK
	// ─────────────────────────────────────────────────────────────────────

	if !user.HasPassword() {
		return nil, utils.Forbidden(
			"this account uses social login, please continue with OAuth provider",
		)
	}

	// ─────────────────────────────────────────────────────────────────────
	// PASSWORD VERIFY
	// ─────────────────────────────────────────────────────────────────────

	ok := security.VerifyPassword(
		user.PasswordHash.String,
		password,
	)

	if !ok {
		attempts, attemptErr := s.handleFailedAttempt(ctx, email)
		if attemptErr != nil {
			return nil, attemptErr
		}

		utils.Warn("invalid password attempt", map[string]any{
			"email":    email,
			"attempts": attempts,
			"ip":       clientInfo.IP,
		})

		return nil, utils.Unauthorized("invalid email or password")
	}

	// ─────────────────────────────────────────────────────────────────────
	// CLEAR FAILED ATTEMPTS
	// ─────────────────────────────────────────────────────────────────────

	if err = s.tokenRepo.ClearLoginAttempts(ctx, email); err != nil {
		utils.Error("clear login attempts failed", err, map[string]any{
			"email": email,
		})
	}

	// ─────────────────────────────────────────────────────────────────────
	// ACCOUNT STATE CHECKS
	// ─────────────────────────────────────────────────────────────────────

	if user.IsDeleted() {
		return nil, utils.Forbidden("account has been deleted")
	}

	if user.IsBlocked {
		return nil, utils.Forbidden("your account has been suspended")
	}

	if !user.IsActive {
		return nil, utils.Forbidden("your account is inactive")
	}

	if !user.EmailVerified {
		return nil, utils.Forbidden("please verify your email address first")
	}

	// ─────────────────────────────────────────────────────────────────────
	// 2FA FLOW
	// ─────────────────────────────────────────────────────────────────────

	if user.TwoFactorEnabled {
		pendingToken, err := security.GenerateTwoFAPendingToken()
		if err != nil {
			return nil, err
		}

		if err = s.tokenRepo.StoreTwoFAPendingToken(
			ctx,
			user.ID.String(),
			pendingToken,
			5*time.Minute,
		); err != nil {
			return nil, err
		}

		utils.Info("2fa login pending", map[string]any{
			"user_id": user.ID.String(),
			"ip":      clientInfo.IP,
		})

		return &dto.LoginResult{
			TwoFAPending:      true,
			TwoFAPendingToken: pendingToken,
		}, nil
	}

	// ─────────────────────────────────────────────────────────────────────
	// CREATE SESSION
	// ─────────────────────────────────────────────────────────────────────

	authResult, err := s.createSession(ctx, user, prefs, clientInfo)
	if err != nil {
		return nil, err
	}

	// ─────────────────────────────────────────────────────────────────────
	// RECORD LOGIN
	// ─────────────────────────────────────────────────────────────────────

	s.authRepo.RecordLogin(ctx, user.ID, clientInfo.IP)

	utils.Info("user login successful", map[string]any{
		"user_id": user.ID.String(),
		"ip":      clientInfo.IP,
	})

	return &dto.LoginResult{
		AuthResult: *authResult,
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILED LOGIN ATTEMPTS
// ─────────────────────────────────────────────────────────────────────────────

func (s *LoginService) handleFailedAttempt(
	ctx context.Context,
	email string,
) (int64, error) {

	attempts, err := s.tokenRepo.IncrLoginAttempt(
		ctx,
		email,
		s.cfg.Security.LockoutDuration,
	)
	if err != nil {
		return 0, err
	}

	if attempts >= int64(s.cfg.Security.MaxLoginAttempts) {

		if err = s.tokenRepo.LockAccount(
			ctx,
			email,
			s.cfg.Security.LockoutDuration,
		); err != nil {
			return attempts, err
		}

		utils.Warn("account locked due to failed attempts", map[string]any{
			"email":    email,
			"attempts": attempts,
		})
	}

	return attempts, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH
// ─────────────────────────────────────────────────────────────────────────────

func (s *LoginService) Refresh(
	ctx context.Context,
	sessionID string,
) (*dto.AuthResult, error) {

	if sessionID == "" {
		return nil, utils.Unauthorized("missing refresh session")
	}

	// 1. Get session from Redis
	session, err := s.sessionRepo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, utils.Unauthorized("session expired or invalid")
	}

	// 2. Get user to ensure account is still valid/active
	uid, err := uuid.Parse(session.UserID)
	if err != nil {
		return nil, utils.Unauthorized("invalid session data")
	}

	user, prefs, err := s.authRepo.GetByID(ctx, uid)
	if err != nil {
		return nil, utils.Unauthorized("user no longer exists")
	}

	// 3. Security checks
	if user.IsBlocked || !user.IsActive || user.IsDeleted() {
		return nil, utils.Forbidden("account is no longer active")
	}

	// 4. Generate only NEW access token (keep same session ID)
	pair, err := s.jwt.GenerateTokenPair(user, sessionID)
	if err != nil {
		return nil, err
	}

	safe := user.ToSafe(prefs)

	return &dto.AuthResult{
		AccessToken: pair.AccessToken,
		SessionID:   sessionID,
		User:        &safe,
	}, nil
}

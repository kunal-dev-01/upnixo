package service

import (
	"context"
	"time"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"
)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type LoginService struct {
	cfg         *config.Config
	authRepo    repo.AuthRepository
	tokenRepo   *repo.TokenRepository
	sessionRepo *repo.SessionRepository
	jwt         *security.JWTManager
}

func NewLoginService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	jwt *security.JWTManager,
) *LoginService {
	return &LoginService{
		cfg:         cfg,
		authRepo:    authRepo,
		tokenRepo:   tokenRepo,
		sessionRepo: sessionRepo,
		jwt:         jwt,
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

func (s *LoginService) createSession(
	ctx context.Context,
	user *models.User,
	prefs *models.UserPreferences,
	info dto.ClientInfo,
) (*dto.AuthResult, error) {

	sessionID, err := security.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	pair, err := s.jwt.GenerateTokenPair(user, sessionID)
	if err != nil {
		return nil, err
	}

	ttl := s.cfg.JWT.RefreshTokenDuration

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
		ExpiresAt:    time.Now().Add(ttl),
	}

	if err = s.sessionRepo.StoreSession(ctx, meta, ttl); err != nil {
		return nil, err
	}

	safe := user.ToSafe(prefs)

	return &dto.AuthResult{
		AccessToken: pair.AccessToken,
		SessionID:   sessionID,
		User:        &safe,
	}, nil
}

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

	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type TwoFAService struct {
	cfg         *config.Config
	authRepo    repo.AuthRepository
	tokenRepo   *repo.TokenRepository
	sessionRepo *repo.SessionRepository
	jwt         *security.JWTManager
}

func NewTwoFAService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	jwt *security.JWTManager,
) *TwoFAService {
	return &TwoFAService{
		cfg:         cfg,
		authRepo:    authRepo,
		tokenRepo:   tokenRepo,
		sessionRepo: sessionRepo,
		jwt:         jwt,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP — generate secret + backup codes, store (not enabled yet)
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) Setup(ctx context.Context, userID uuid.UUID) (*dto.Setup2FAResult, error) {
	user, err := s.authRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user.TwoFactorEnabled {
		return nil, utils.Conflict("2FA is already enabled on your account")
	}

	// Generate TOTP key
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.cfg.App.AppName,
		AccountName: user.Email,
		Period:      30,
		Digits:      6,
	})
	if err != nil {
		utils.Error("totp generate failed", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}

	// Encrypt secret before storing
	encrypted, err := security.EncryptTOTPSecret(key.Secret(), s.cfg.Security.TOTPEncryptionKey)
	if err != nil {
		return nil, err
	}

	// Generate + hash backup codes
	plainCodes, err := security.GenerateBackupCodes(10)
	if err != nil {
		return nil, err
	}

	hashedCodes, err := security.HashBackupCodes(plainCodes)
	if err != nil {
		return nil, err
	}

	// Store in DB — is_enabled = FALSE until user confirms with first TOTP
	if err = s.authRepo.Setup2FA(ctx, repo.Setup2FAParams{
		UserID:            userID,
		EncryptedSecret:   encrypted,
		HashedBackupCodes: hashedCodes,
	}); err != nil {
		return nil, err
	}

	return &dto.Setup2FAResult{
		QRCodeURL:   key.URL(),
		Secret:      key.Secret(), // shown once — user saves in authenticator app
		BackupCodes: plainCodes,   // shown once — user saves somewhere safe
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM ENABLE — verify first TOTP code to activate 2FA
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) ConfirmEnable(ctx context.Context, userID uuid.UUID, input dto.Confirm2FAInput) error {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return err
	}

	tf, err := s.authRepo.GetTwoFactor(ctx, userID)
	if err != nil {
		return err
	}

	if tf.IsEnabled {
		return utils.Conflict("2FA is already enabled")
	}

	if err = s.verifyTOTPCode(tf, input.Code); err != nil {
		return err
	}

	// Enable atomically — updates two_factor_auth + users.two_factor_enabled
	return s.authRepo.Verify2FA(ctx, userID, models.TwoFactorMethodTOTP)
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TOTP — during login (2fa_pending token → full JWT pair)
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) VerifyTOTP(ctx context.Context, input dto.Verify2FAInput, clientInfo dto.ClientInfo) (*dto.VerifyEmailResult, error) {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return nil, err
	}

	// 1. Consume 2FA pending token — single use
	userIDStr, err := s.tokenRepo.ConsumeTwoFAPendingToken(ctx, input.TwoFAPendingToken)
	if err != nil {
		return nil, utils.Unauthorized("invalid or expired 2FA session")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, utils.Unauthorized("invalid 2FA session payload")
	}

	// 2. Fetch 2FA config
	tf, err := s.authRepo.GetTwoFactor(ctx, userID)
	if err != nil {
		return nil, err
	}

	if !tf.IsEnabled {
		return nil, utils.Forbidden("2FA is not enabled on this account")
	}

	// 3. Verify TOTP code
	if err = s.verifyTOTPCode(tf, input.Code); err != nil {
		return nil, err
	}

	// 4. Record verify timestamp
	go s.recordVerified(userID, models.TwoFactorMethodTOTP)

	// 5. Issue full session
	user, err := s.authRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.createSession(ctx, user, clientInfo)
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY BACKUP CODE — fallback when TOTP app unavailable
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) VerifyBackupCode(ctx context.Context, input dto.VerifyBackupInput, clientInfo dto.ClientInfo) (*dto.VerifyEmailResult, error) {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return nil, err
	}

	// 1. Consume 2FA pending token
	userIDStr, err := s.tokenRepo.ConsumeTwoFAPendingToken(ctx, input.TwoFAPendingToken)
	if err != nil {
		return nil, utils.Unauthorized("invalid or expired 2FA session")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, utils.Unauthorized("invalid 2FA session payload")
	}

	// 2. Fetch 2FA config
	tf, err := s.authRepo.GetTwoFactor(ctx, userID)
	if err != nil {
		return nil, err
	}

	if !tf.IsEnabled {
		return nil, utils.Forbidden("2FA is not enabled on this account")
	}

	// 3. Find matching backup code
	idx := security.VerifyBackupCode(input.BackupCode, tf.BackupCodes)
	if idx == -1 {
		return nil, utils.Unauthorized("invalid backup code")
	}

	// 4. Remove consumed code atomically
	remaining := append(tf.BackupCodes[:idx], tf.BackupCodes[idx+1:]...)
	if err = s.authRepo.ConsumeBackupCode(ctx, userID, remaining); err != nil {
		return nil, err
	}

	// 5. Record verify timestamp
	go s.recordVerified(userID, models.TwoFactorMethodBackupCode)

	// 6. Issue full session
	user, err := s.authRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.createSession(ctx, user, clientInfo)
}

// ─────────────────────────────────────────────────────────────────────────────
// DISABLE — authenticated user disables 2FA (requires valid TOTP to confirm)
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) Disable(ctx context.Context, userID uuid.UUID, input dto.Disable2FAInput) error {
	if err := utils.ValidateStructToAppError(input); err != nil {
		return err
	}

	tf, err := s.authRepo.GetTwoFactor(ctx, userID)
	if err != nil {
		return err
	}

	if !tf.IsEnabled {
		return utils.BadRequest("2FA is not enabled on your account")
	}

	// Require valid TOTP before disabling
	if err = s.verifyTOTPCode(tf, input.Code); err != nil {
		return err
	}

	// Disable atomically — updates two_factor_auth + users.two_factor_enabled
	if err = s.authRepo.Disable2FA(ctx, userID); err != nil {
		return err
	}

	// Revoke all sessions — force re-login after disabling 2FA
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if rErr := s.sessionRepo.RevokeAllSessions(bgCtx, userID.String()); rErr != nil {
			utils.Error("revoke all sessions after 2fa disable failed", rErr, map[string]any{
				"user_id": userID,
			})
		}
	}()

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// REGENERATE BACKUP CODES
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) RegenerateBackupCodes(ctx context.Context, userID uuid.UUID, totpCode string) ([]string, error) {
	tf, err := s.authRepo.GetTwoFactor(ctx, userID)
	if err != nil {
		return nil, err
	}

	if !tf.IsEnabled {
		return nil, utils.BadRequest("2FA is not enabled on your account")
	}

	// Require valid TOTP to regenerate
	if err = s.verifyTOTPCode(tf, totpCode); err != nil {
		return nil, err
	}

	plainCodes, err := security.GenerateBackupCodes(10)
	if err != nil {
		return nil, err
	}

	hashedCodes, err := security.HashBackupCodes(plainCodes)
	if err != nil {
		return nil, err
	}

	if err = s.authRepo.ConsumeBackupCode(ctx, userID, hashedCodes); err != nil {
		return nil, err
	}

	return plainCodes, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func (s *TwoFAService) verifyTOTPCode(tf *models.TwoFactorAuth, code string) error {
	secret, err := security.DecryptTOTPSecret(tf.TOTPSecret, s.cfg.Security.TOTPEncryptionKey)
	if err != nil {
		return err
	}

	valid := totp.Validate(code, secret)
	if !valid {
		return utils.Unauthorized("invalid 2FA code")
	}

	return nil
}

func (s *TwoFAService) recordVerified(userID uuid.UUID, method models.TwoFactorMethod) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := s.authRepo.Verify2FA(ctx, userID, method); err != nil {
		utils.Error("record 2fa verified failed", err, map[string]any{"user_id": userID})
	}
}

func (s *TwoFAService) createSession(ctx context.Context, user *models.User, info dto.ClientInfo) (*dto.VerifyEmailResult, error) {
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

	safe := user.ToSafe()
	return &dto.VerifyEmailResult{
		User:        &safe,
		AccessToken: pair.AccessToken,
		SessionID:   sessionID,
	}, nil
}

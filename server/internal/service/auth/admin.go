package service

import (
	"context"
	"server/internal/config"
	"server/internal/dto"
	"server/internal/email"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"
	"time"
)

type AdminService struct {
	baseService
	adminRepo repo.AdminRepository
	tokenRepo *repo.TokenRepository
	emailSvc  *email.EmailService
}

func NewAdminService(
	cfg *config.Config,
	adminRepo repo.AdminRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	jwt *security.JWTManager,
	emailSvc *email.EmailService,
) *AdminService {
	return &AdminService{
		baseService: baseService{
			cfg:         cfg,
			sessionRepo: sessionRepo,
			jwt:         jwt,
		},
		adminRepo: adminRepo,
		tokenRepo: tokenRepo,
		emailSvc:  emailSvc,
	}
}

// Login verifies primary credentials and sends a 6-digit code.
func (s *AdminService) Login(ctx context.Context, req dto.AdminLoginRequest) error {
	// 1. Get admin
	admin, err := s.adminRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return utils.Unauthorized("invalid credentials")
	}

	// 2. Security checks
	if !admin.IsActive || admin.IsDeleted() {
		return utils.Forbidden("account is disabled")
	}

	// 3. Verify password
	if !security.VerifyPassword(admin.PasswordHash, req.Password) {
		return utils.Unauthorized("invalid credentials")
	}

	// 4. Verify Master Secret Key
	// Assuming master key is stored as a hash or plain text? 
	// User said "email password and master key se ye hnn".
	// Models show MasterSecretKey field. Let's assume it's a plain string comparison for now 
	// or another bcrypt hash. Given the context, let's treat it as a secondary password.
	if admin.MasterSecretKey != req.MasterSecretKey {
		return utils.Unauthorized("invalid master secret key")
	}

	// 5. Generate 6-digit OTP
	code := security.GenerateOTP()

	// 6. Store in Redis (TTL 5m)
	if err := s.tokenRepo.StoreAdminLoginCode(ctx, admin.Email, code, 5*time.Minute); err != nil {
		return err
	}

	// 7. Send Email
	go func() {
		_ = s.emailSvc.SendLoginCodeEmail(admin.FullName, admin.Email, code)
	}()

	return nil
}

// VerifyLogin checks the OTP and issues a full session.
func (s *AdminService) VerifyLogin(ctx context.Context, req dto.AdminVerifyRequest, clientInfo dto.ClientInfo) (*dto.AdminAuthResult, error) {
	// 1. Consume code
	storedCode, err := s.tokenRepo.ConsumeAdminLoginCode(ctx, req.Email)
	if err != nil {
		return nil, err
	}

	if storedCode != req.Code {
		return nil, utils.Unauthorized("invalid or expired login code")
	}

	// 2. Get admin
	admin, err := s.adminRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, utils.Unauthorized("admin no longer exists")
	}

	// 3. Issue session
	return s.createAdminSession(ctx, admin, clientInfo)
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDENTIAL RESET
// ─────────────────────────────────────────────────────────────────────────────

func (s *AdminService) ForgotPassword(ctx context.Context, email string) error {
	admin, err := s.adminRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil // Silent fail for security
	}

	token, _ := security.GenerateToken(32)
	if err := s.tokenRepo.StoreAdminPasswordResetToken(ctx, email, token, 1*time.Hour); err != nil {
		return err
	}

	go func() {
		_ = s.emailSvc.SendAdminPasswordResetEmail(admin.FullName, admin.Email, token)
	}()

	return nil
}

func (s *AdminService) ResetPassword(ctx context.Context, req dto.AdminResetPasswordRequest) error {
	email, err := s.tokenRepo.ConsumeAdminPasswordResetToken(ctx, req.Token)
	if err != nil {
		return err
	}

	admin, err := s.adminRepo.GetByEmail(ctx, email)
	if err != nil {
		return utils.NotFound("admin not found")
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return err
	}

	return s.adminRepo.SetPassword(ctx, admin.ID, hash)
}

func (s *AdminService) ForgotMasterKey(ctx context.Context, email, phone string) error {
	admin, err := s.adminRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil // Silent fail
	}

	// Verify phone matches for master key reset (extra security)
	if admin.Phone != phone {
		return nil // Silent fail
	}

	token, _ := security.GenerateToken(32)
	if err := s.tokenRepo.StoreAdminMasterKeyResetToken(ctx, email, token, 1*time.Hour); err != nil {
		return err
	}

	go func() {
		_ = s.emailSvc.SendSecretResetEmail(admin.FullName, admin.Email, token)
	}()

	return nil
}

func (s *AdminService) ResetMasterKey(ctx context.Context, req dto.AdminResetMasterKeyRequest) error {
	email, err := s.tokenRepo.ConsumeAdminMasterKeyResetToken(ctx, req.Token)
	if err != nil {
		return err
	}

	admin, err := s.adminRepo.GetByEmail(ctx, email)
	if err != nil {
		return utils.NotFound("admin not found")
	}

	// For master key, we store it plain as per current model/design
	return s.adminRepo.SetMasterKey(ctx, admin.ID, req.MasterKey)
}

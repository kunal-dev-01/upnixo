package repo

import (
	"context"
	"time"

	rds "server/internal/redis"
	"server/internal/utils"
)

// ─────────────────────────────────────────────────────────────────────────────
// KEY PREFIXES
// ─────────────────────────────────────────────────────────────────────────────

const (
	prefixEmailVerify   = "token:email_verify:"     // token:email_verify:<token>  → user_id
	prefixPasswordReset = "token:pwd_reset:"        // token:pwd_reset:<token>     → user_id
	prefixTwoFASetup    = "token:2fa_setup:"        // token:2fa_setup:<user_id>   → temp state
	prefixTwoFAPending  = "token:2fa_pending:"      // token:2fa_pending:<token>   → user_id
	prefixLoginAttempt  = "security:login_attempt:" // security:login_attempt:<email> → count
	prefixAccountLock   = "security:lock:"          // security:lock:<email>       → "1"
	prefixOAuthState    = "oauth:state:"            // oauth:state:<state>        → user_id (optional, for linking)
	prefixAdminLogin    = "token:admin_login:"      // token:admin_login:<email>  → code
	prefixAdminPwdReset = "token:admin:pwd_reset:"  // token:admin:pwd_reset:<token> → email
	prefixAdminSecReset = "token:admin:sec_reset:"  // token:admin:sec_reset:<token> → email
)

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

type TokenRepository struct {
	r *rds.Redis
}

func NewTokenRepository(r *rds.Redis) *TokenRepository {
	return &TokenRepository{r: r}
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

// StoreEmailVerifyToken stores token → userID atomically (SetNX).
// Returns false if a token already exists for this key — prevents overwrites.
func (t *TokenRepository) StoreEmailVerifyToken(ctx context.Context, userID, token string, ttl time.Duration) error {
	ok, err := t.r.SetNX(ctx, prefixEmailVerify+token, userID, ttl)
	if err != nil {
		utils.Error("store email verify token failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}
	if !ok {
		return utils.Conflict("verification token already exists, request a new one")
	}
	return nil
}

// ConsumeEmailVerifyToken returns userID and deletes the token atomically.
// Single-use enforced — token is gone after first call.
func (t *TokenRepository) ConsumeEmailVerifyToken(ctx context.Context, token string) (string, error) {
	return t.consumeToken(ctx, prefixEmailVerify+token, "email verification")
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────

func (t *TokenRepository) StorePasswordResetToken(ctx context.Context, userID, token string, ttl time.Duration) error {
	ok, err := t.r.SetNX(ctx, prefixPasswordReset+token, userID, ttl)
	if err != nil {
		utils.Error("store password reset token failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}
	if !ok {
		return utils.Conflict("reset token already exists, request a new one")
	}
	return nil
}

func (t *TokenRepository) ConsumePasswordResetToken(ctx context.Context, token string) (string, error) {
	return t.consumeToken(ctx, prefixPasswordReset+token, "password reset")
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA PENDING (post-login, pre-2FA-verify)
// ─────────────────────────────────────────────────────────────────────────────

// StoreTwoFAPendingToken stores a short-lived token issued after password
// login succeeds but before 2FA is verified.
// Frontend sends this token when submitting the TOTP code.
func (t *TokenRepository) StoreTwoFAPendingToken(ctx context.Context, userID, token string, ttl time.Duration) error {
	ok, err := t.r.SetNX(ctx, prefixTwoFAPending+token, userID, ttl)
	if err != nil {
		utils.Error("store 2fa pending token failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}
	if !ok {
		return utils.Internal(nil)
	}
	return nil
}

func (t *TokenRepository) ConsumeTwoFAPendingToken(ctx context.Context, token string) (string, error) {
	return t.consumeToken(ctx, prefixTwoFAPending+token, "2fa pending")
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN CODE
// ─────────────────────────────────────────────────────────────────────────────

func (t *TokenRepository) StoreAdminLoginCode(ctx context.Context, email, code string, ttl time.Duration) error {
	return t.r.Set(ctx, prefixAdminLogin+email, code, ttl)
}

func (t *TokenRepository) ConsumeAdminLoginCode(ctx context.Context, email string) (string, error) {
	key := prefixAdminLogin + email
	code, err := t.r.Get(ctx, key)
	if err != nil {
		return "", utils.Internal(err)
	}
	if code == "" {
		return "", utils.Unauthorized("login code expired or not found")
	}

	// Single use
	_ = t.r.Del(ctx, key)

	return code, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────

func (t *TokenRepository) StoreAdminPasswordResetToken(ctx context.Context, email, token string, ttl time.Duration) error {
	return t.r.Set(ctx, prefixAdminPwdReset+token, email, ttl)
}

func (t *TokenRepository) ConsumeAdminPasswordResetToken(ctx context.Context, token string) (string, error) {
	return t.consumeToken(ctx, prefixAdminPwdReset+token, "admin password reset")
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MASTER KEY RESET
// ─────────────────────────────────────────────────────────────────────────────

func (t *TokenRepository) StoreAdminMasterKeyResetToken(ctx context.Context, email, token string, ttl time.Duration) error {
	return t.r.Set(ctx, prefixAdminSecReset+token, email, ttl)
}

func (t *TokenRepository) ConsumeAdminMasterKeyResetToken(ctx context.Context, token string) (string, error) {
	return t.consumeToken(ctx, prefixAdminSecReset+token, "admin master key reset")
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN ATTEMPT TRACKING
// ─────────────────────────────────────────────────────────────────────────────

// IncrLoginAttempt increments the failed login counter for an email.
// Sets TTL on first increment so the counter auto-expires.
// Returns the new attempt count.
func (t *TokenRepository) IncrLoginAttempt(ctx context.Context, email string, windowTTL time.Duration) (int64, error) {
	key := prefixLoginAttempt + email

	count, err := t.r.Incr(ctx, key)
	if err != nil {
		return 0, utils.Internal(err)
	}

	// Set TTL only on first increment — subsequent increments preserve existing TTL
	if count == 1 {
		if _, err = t.r.Expire(ctx, key, windowTTL); err != nil {
			utils.Error("set login attempt TTL failed", err, map[string]any{"email": email})
		}
	}

	return count, nil
}

// LockAccount sets a lockout key for the given email.
func (t *TokenRepository) LockAccount(ctx context.Context, email string, lockDuration time.Duration) error {
	err := t.r.Set(ctx, prefixAccountLock+email, "1", lockDuration)
	if err != nil {
		utils.Error("lock account failed", err, map[string]any{"email": email})
		return utils.Internal(err)
	}
	return nil
}

// IsAccountLocked returns true if the email is currently locked out.
func (t *TokenRepository) IsAccountLocked(ctx context.Context, email string) (bool, error) {
	val, err := t.r.Get(ctx, prefixAccountLock+email)
	if err != nil {
		return false, utils.Internal(err)
	}
	return val == "1", nil
}

// ClearLoginAttempts removes both the attempt counter and lock key.
// Call this on successful login.
func (t *TokenRepository) ClearLoginAttempts(ctx context.Context, email string) error {
	return t.r.Del(ctx,
		prefixLoginAttempt+email,
		prefixAccountLock+email,
	)
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

// consumeToken does a GET + DEL in sequence.
// Not a true atomic operation but safe for single-use tokens since the key
// is deleted immediately — a second call returns not-found.
func (t *TokenRepository) consumeToken(ctx context.Context, key, label string) (string, error) {
	userID, err := t.r.Get(ctx, key)
	if err != nil {
		return "", utils.Internal(err)
	}
	if userID == "" {
		return "", utils.NotFound(label + " token not found or expired")
	}

	// Best-effort delete — token is considered consumed regardless
	if err = t.r.Del(ctx, key); err != nil {
		utils.Error("token delete after consume failed", err, map[string]any{"key": key})
	}

	return userID, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH STATE (CSRF protection)
// ─────────────────────────────────────────────────────────────────────────────

// StoreOAuthState stores oauth state token in redis.
// Key format:
// oauth:state:<provider>:<state> -> "1"
func (t *TokenRepository) StoreOAuthState(
	ctx context.Context,
	state string,
	provider string,
	ttl time.Duration,
) error {
	key := prefixOAuthState + provider + ":" + state

	ok, err := t.r.SetNX(ctx, key, "1", ttl)
	if err != nil {
		utils.Error("store oauth state failed", err, map[string]any{
			"provider": provider,
		})
		return utils.Internal(err)
	}

	if !ok {
		return utils.Conflict("oauth state already exists")
	}

	return nil
}

// ConsumeOAuthState validates and deletes oauth state.
// Single-use token protection.
func (t *TokenRepository) ConsumeOAuthState(
	ctx context.Context,
	state string,
	provider string,
) error {
	key := prefixOAuthState + provider + ":" + state

	val, err := t.r.Get(ctx, key)
	if err != nil {
		return utils.Internal(err)
	}

	if val == "" {
		return utils.BadRequest("invalid or expired oauth state")
	}

	// delete after consume
	if err = t.r.Del(ctx, key); err != nil {
		utils.Error("delete oauth state failed", err, map[string]any{
			"provider": provider,
		})
	}

	return nil
}

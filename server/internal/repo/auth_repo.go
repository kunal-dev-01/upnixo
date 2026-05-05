package repo

import (
	"context"
	"errors"
	"time"

	"server/internal/db"
	"server/internal/models"
	"server/internal/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

type AuthRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	// Email + Password
	Register(ctx context.Context, params RegisterParams) (*models.User, error)
	GetUserForLogin(ctx context.Context, email string) (*models.User, error)
	VerifyEmail(ctx context.Context, userID uuid.UUID) error

	// Password reset
	MarkPasswordResetRequested(ctx context.Context, userID uuid.UUID) error
	ResetPassword(ctx context.Context, userID uuid.UUID, newHash string) error

	// OAuth
	FindOrCreateOAuthUser(ctx context.Context, params OAuthLoginParams) (*models.User, bool, error)
	LinkOAuthAccount(ctx context.Context, params LinkOAuthParams) error

	// 2FA
	Setup2FA(ctx context.Context, params Setup2FAParams) error
	Verify2FA(ctx context.Context, userID uuid.UUID, method models.TwoFactorMethod) error
	Disable2FA(ctx context.Context, userID uuid.UUID) error
	ConsumeBackupCode(ctx context.Context, userID uuid.UUID, remainingCodes []string) error

	// Session audit (background-safe)
	RecordLogin(ctx context.Context, userID uuid.UUID, ip string)
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type RegisterParams struct {
	Email        string
	PasswordHash string
	FullName     string
	AvatarURL    *string
}

type OAuthLoginParams struct {
	Provider          models.OAuthProvider
	ProviderUserID    string
	ProviderEmail     string
	ProviderName      *string
	ProviderAvatarURL *string
	Scopes            []string
	ProviderMeta      []byte
}

type LinkOAuthParams struct {
	UserID            uuid.UUID
	Provider          models.OAuthProvider
	ProviderUserID    string
	ProviderEmail     *string
	ProviderName      *string
	ProviderAvatarURL *string
	Scopes            []string
	ProviderMeta      []byte
}

type Setup2FAParams struct {
	UserID            uuid.UUID
	EncryptedSecret   string   // AES-256 encrypted before passing in
	HashedBackupCodes []string // argon2id hashed before passing in
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type authRepo struct {
	log *utils.Logger
}

func NewAuthRepository(log *utils.Logger) AuthRepository {
	return &authRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

const registerSQL = `
	INSERT INTO users (email, password_hash, full_name, avatar_url)
	VALUES (@email, @password_hash, @full_name, @avatar_url)
	RETURNING
		id, email, email_verified, email_verified_at,
		phone, phone_verified, phone_verified_at,
		password_hash, password_changed_at, password_reset_requested_at,
		full_name, avatar_url, timezone, locale,
		is_active, is_blocked, blocked_at, blocked_reason,
		last_login_at, last_login_ip,
		two_factor_enabled, two_factor_enabled_at,
		created_at, updated_at, deleted_at`

func (r *authRepo) Register(ctx context.Context, params RegisterParams) (*models.User, error) {
	args := pgx.NamedArgs{
		"email":         params.Email,
		"password_hash": params.PasswordHash,
		"full_name":     params.FullName,
		"avatar_url":    params.AvatarURL,
	}

	rows, err := db.Pool.Query(ctx, registerSQL, args)
	if err != nil {
		r.log.Error("register: query failed", err, nil)
		return nil, utils.Internal(err)
	}

	user, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.User])
	if err != nil {
		if isPgConflict(err) {
			return nil, utils.Conflict("email is already registered")
		}
		r.log.Error("register: scan failed", err, nil)
		return nil, utils.Internal(err)
	}

	return &user, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SELECT COLUMNS
// ─────────────────────────────────────────────────────────────────────────────

const userColumns = `
	id, email, email_verified, email_verified_at,
	phone, phone_verified, phone_verified_at,
	password_hash, password_changed_at, password_reset_requested_at,
	full_name, avatar_url, timezone, locale,
	is_active, is_blocked, blocked_at, blocked_reason,
	last_login_at, last_login_ip,
	two_factor_enabled, two_factor_enabled_at,
	created_at, updated_at, deleted_at`

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────────────────────

func (r *authRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	sql := `SELECT ` + userColumns + `
		FROM users
		WHERE id = @id AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get by id: query failed", err, map[string]any{"user_id": id})
		return nil, utils.Internal(err)
	}

	user, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.User])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("user not found")
		}
		r.log.Error("get by id: scan failed", err, map[string]any{"user_id": id})
		return nil, utils.Internal(err)
	}

	return &user, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

// GetUserForLogin fetches the full user row for authentication.
// Password comparison and block checks happen in the service layer.
const getUserForLoginSQL = `
	SELECT
		id, email, email_verified, email_verified_at,
		phone, phone_verified, phone_verified_at,
		password_hash, password_changed_at, password_reset_requested_at,
		full_name, avatar_url, timezone, locale,
		is_active, is_blocked, blocked_at, blocked_reason,
		last_login_at, last_login_ip,
		two_factor_enabled, two_factor_enabled_at,
		created_at, updated_at, deleted_at
	FROM  users
	WHERE email = @email
	  AND deleted_at IS NULL`

func (r *authRepo) GetUserForLogin(ctx context.Context, email string) (*models.User, error) {
	rows, err := db.Pool.Query(ctx, getUserForLoginSQL, pgx.NamedArgs{"email": email})
	if err != nil {
		r.log.Error("login: query failed", err, nil)
		return nil, utils.Internal(err)
	}

	user, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.User])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Generic message — do not reveal whether email exists
			return nil, utils.Unauthorized("invalid email or password")
		}
		r.log.Error("login: scan failed", err, nil)
		return nil, utils.Internal(err)
	}

	return &user, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

func (r *authRepo) VerifyEmail(ctx context.Context, userID uuid.UUID) error {
	sql := `
		UPDATE users
		SET    email_verified    = TRUE,
		       email_verified_at = NOW()
		WHERE  id         = @id
		  AND  deleted_at IS NULL
		  AND  email_verified = FALSE`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": userID})
	if err != nil {
		r.log.Error("verify email: exec failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		// Already verified or user not found — both are safe no-ops from client POV
		return nil
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────

func (r *authRepo) MarkPasswordResetRequested(ctx context.Context, userID uuid.UUID) error {
	sql := `
		UPDATE users
		SET password_reset_requested_at = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": userID})
	if err != nil {
		r.log.Error("mark password reset: exec failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}

	return nil
}

func (r *authRepo) ResetPassword(ctx context.Context, userID uuid.UUID, newHash string) error {
	sql := `
		UPDATE users
		SET password_hash                = @hash,
		    password_changed_at          = NOW(),
		    password_reset_requested_at  = NULL
		WHERE id = @id AND deleted_at IS NULL`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": userID, "hash": newHash})
	if err != nil {
		r.log.Error("reset password: exec failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return utils.NotFound("user not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — FIND OR CREATE
// ─────────────────────────────────────────────────────────────────────────────

// FindOrCreateOAuthUser looks up an existing OAuth account.
// If not found, creates a new user + oauth_account in a single transaction.
// Returns (user, isNewUser, error).
func (r *authRepo) FindOrCreateOAuthUser(ctx context.Context, params OAuthLoginParams) (*models.User, bool, error) {
	// Fast path — existing OAuth account
	existing, err := r.findOAuthUser(ctx, params.Provider, params.ProviderUserID)
	if err == nil {
		return existing, false, nil
	}
	if !errors.Is(err, errOAuthNotFound) {
		return nil, false, err
	}

	// Slow path — create user + oauth_account atomically
	user, err := r.createOAuthUser(ctx, params)
	if err != nil {
		return nil, false, err
	}

	return user, true, nil
}

const findOAuthUserSQL = `
	SELECT u.id, u.email, u.email_verified, u.email_verified_at,
	       u.phone, u.phone_verified, u.phone_verified_at,
	       u.password_hash, u.password_changed_at, u.password_reset_requested_at,
	       u.full_name, u.avatar_url, u.timezone, u.locale,
	       u.is_active, u.is_blocked, u.blocked_at, u.blocked_reason,
	       u.last_login_at, u.last_login_ip,
	       u.two_factor_enabled, u.two_factor_enabled_at,
	       u.created_at, u.updated_at, u.deleted_at
	FROM   users u
	JOIN   oauth_accounts o ON o.user_id = u.id
	WHERE  o.provider         = @provider
	  AND  o.provider_user_id = @provider_user_id
	  AND  u.deleted_at       IS NULL`

var errOAuthNotFound = errors.New("oauth account not found")

func (r *authRepo) findOAuthUser(ctx context.Context, provider models.OAuthProvider, providerUserID string) (*models.User, error) {
	rows, err := db.Pool.Query(ctx, findOAuthUserSQL, pgx.NamedArgs{
		"provider":         provider,
		"provider_user_id": providerUserID,
	})
	if err != nil {
		return nil, utils.Internal(err)
	}

	user, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.User])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errOAuthNotFound
		}
		return nil, utils.Internal(err)
	}

	return &user, nil
}

func (r *authRepo) createOAuthUser(ctx context.Context, params OAuthLoginParams) (*models.User, error) {
	var user models.User

	err := withTx(ctx, func(tx pgx.Tx) error {
		// 1. Create user row — email comes from provider, no password
		createSQL := `
			INSERT INTO users (email, full_name, avatar_url, email_verified, email_verified_at)
			VALUES (@email, @full_name, @avatar_url, TRUE, NOW())
			ON CONFLICT (email) DO UPDATE SET
				full_name  = COALESCE(EXCLUDED.full_name, users.full_name),
				avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
			RETURNING
				id, email, email_verified, email_verified_at,
				phone, phone_verified, phone_verified_at,
				password_hash, password_changed_at, password_reset_requested_at,
				full_name, avatar_url, timezone, locale,
				is_active, is_blocked, blocked_at, blocked_reason,
				last_login_at, last_login_ip,
				two_factor_enabled, two_factor_enabled_at,
				created_at, updated_at, deleted_at`

		rows, err := tx.Query(ctx, createSQL, pgx.NamedArgs{
			"email":      params.ProviderEmail,
			"full_name":  params.ProviderName,
			"avatar_url": params.ProviderAvatarURL,
		})
		if err != nil {
			return utils.Internal(err)
		}

		u, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.User])
		if err != nil {
			return utils.Internal(err)
		}
		user = u

		// 2. Link OAuth account
		linkSQL := `
			INSERT INTO oauth_accounts (
				user_id, provider, provider_user_id,
				provider_email, provider_name, provider_avatar_url,
				scopes, provider_meta
			) VALUES (
				@user_id, @provider, @provider_user_id,
				@provider_email, @provider_name, @provider_avatar_url,
				@scopes, @provider_meta
			)
			ON CONFLICT (provider, provider_user_id) DO UPDATE SET
				provider_email      = EXCLUDED.provider_email,
				provider_name       = EXCLUDED.provider_name,
				provider_avatar_url = EXCLUDED.provider_avatar_url,
				scopes              = EXCLUDED.scopes,
				provider_meta       = EXCLUDED.provider_meta,
				last_used_at        = NOW()`

		_, err = tx.Exec(ctx, linkSQL, pgx.NamedArgs{
			"user_id":             user.ID,
			"provider":            params.Provider,
			"provider_user_id":    params.ProviderUserID,
			"provider_email":      params.ProviderEmail,
			"provider_name":       params.ProviderName,
			"provider_avatar_url": params.ProviderAvatarURL,
			"scopes":              params.Scopes,
			"provider_meta":       params.ProviderMeta,
		})
		if err != nil {
			return utils.Internal(err)
		}

		return nil
	})

	if err != nil {
		r.log.Error("create oauth user: tx failed", err, map[string]any{
			"provider":         params.Provider,
			"provider_user_id": params.ProviderUserID,
		})
		return nil, err
	}

	return &user, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — LINK TO EXISTING USER
// ─────────────────────────────────────────────────────────────────────────────

func (r *authRepo) LinkOAuthAccount(ctx context.Context, params LinkOAuthParams) error {
	sql := `
		INSERT INTO oauth_accounts (
			user_id, provider, provider_user_id,
			provider_email, provider_name, provider_avatar_url,
			scopes, provider_meta
		) VALUES (
			@user_id, @provider, @provider_user_id,
			@provider_email, @provider_name, @provider_avatar_url,
			@scopes, @provider_meta
		)
		ON CONFLICT (user_id, provider) DO UPDATE SET
			provider_email      = EXCLUDED.provider_email,
			provider_name       = EXCLUDED.provider_name,
			provider_avatar_url = EXCLUDED.provider_avatar_url,
			scopes              = EXCLUDED.scopes,
			provider_meta       = EXCLUDED.provider_meta,
			last_used_at        = NOW()`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"user_id":             params.UserID,
		"provider":            params.Provider,
		"provider_user_id":    params.ProviderUserID,
		"provider_email":      params.ProviderEmail,
		"provider_name":       params.ProviderName,
		"provider_avatar_url": params.ProviderAvatarURL,
		"scopes":              params.Scopes,
		"provider_meta":       params.ProviderMeta,
	})
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("this oauth account is already linked to another user")
		}
		r.log.Error("link oauth: exec failed", err, map[string]any{
			"user_id":  params.UserID,
			"provider": params.Provider,
		})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA
// ─────────────────────────────────────────────────────────────────────────────

// Setup2FA creates the two_factor_auth row.
// Enabling happens separately after the user verifies the first TOTP code.
func (r *authRepo) Setup2FA(ctx context.Context, params Setup2FAParams) error {
	sql := `
		INSERT INTO two_factor_auth (user_id, totp_secret, backup_codes, backup_codes_generated_at)
		VALUES (@user_id, @totp_secret, @backup_codes, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			totp_secret               = EXCLUDED.totp_secret,
			backup_codes              = EXCLUDED.backup_codes,
			backup_codes_generated_at = NOW(),
			is_enabled                = FALSE,
			enabled_at                = NULL`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"user_id":      params.UserID,
		"totp_secret":  params.EncryptedSecret,
		"backup_codes": params.HashedBackupCodes,
	})
	if err != nil {
		r.log.Error("setup 2fa: exec failed", err, map[string]any{"user_id": params.UserID})
		return utils.Internal(err)
	}

	return nil
}

// Verify2FA records a successful TOTP check and syncs the denormalised flag on users.
func (r *authRepo) Verify2FA(ctx context.Context, userID uuid.UUID, method models.TwoFactorMethod) error {
	return withTx(ctx, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx, `
			UPDATE two_factor_auth
			SET is_enabled       = TRUE,
			    enabled_at       = COALESCE(enabled_at, NOW()),
			    last_verified_at = NOW(),
			    last_method_used = @method
			WHERE user_id = @user_id`,
			pgx.NamedArgs{"user_id": userID, "method": method},
		)
		if err != nil {
			return utils.Internal(err)
		}

		_, err = tx.Exec(ctx, `
			UPDATE users
			SET two_factor_enabled    = TRUE,
			    two_factor_enabled_at = COALESCE(two_factor_enabled_at, NOW())
			WHERE id = @id`,
			pgx.NamedArgs{"id": userID},
		)
		if err != nil {
			return utils.Internal(err)
		}

		return nil
	})
}

// Disable2FA disables 2FA and clears the denormalised flag atomically.
func (r *authRepo) Disable2FA(ctx context.Context, userID uuid.UUID) error {
	return withTx(ctx, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx, `
			UPDATE two_factor_auth
			SET is_enabled = FALSE, enabled_at = NULL
			WHERE user_id = @user_id`,
			pgx.NamedArgs{"user_id": userID},
		)
		if err != nil {
			return utils.Internal(err)
		}

		_, err = tx.Exec(ctx, `
			UPDATE users
			SET two_factor_enabled = FALSE, two_factor_enabled_at = NULL
			WHERE id = @id`,
			pgx.NamedArgs{"id": userID},
		)
		if err != nil {
			return utils.Internal(err)
		}

		return nil
	})
}

// ConsumeBackupCode replaces the backup codes array after one code is used.
// The service layer is responsible for verifying the code and passing
// the remaining codes (original array minus the consumed one).
func (r *authRepo) ConsumeBackupCode(ctx context.Context, userID uuid.UUID, remainingCodes []string) error {
	sql := `
		UPDATE two_factor_auth
		SET backup_codes = @codes
		WHERE user_id = @user_id`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"user_id": userID,
		"codes":   remainingCodes,
	})
	if err != nil {
		r.log.Error("consume backup code: exec failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION AUDIT — BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

// RecordLogin updates last_login_at and last_login_ip in the background.
// It is intentionally fire-and-forget — login response is never blocked by this.
// A fresh context is used so caller cancellation does not abort the update.
func (r *authRepo) RecordLogin(ctx context.Context, userID uuid.UUID, ip string) {
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		sql := `
			UPDATE users
			SET last_login_at = NOW(), last_login_ip = @ip
			WHERE id = @id AND deleted_at IS NULL`

		_, err := db.Pool.Exec(bgCtx, sql, pgx.NamedArgs{"id": userID, "ip": ip})
		if err != nil {
			r.log.Error("record login: background update failed", err, map[string]any{
				"user_id": userID,
				"ip":      ip,
			})
		}
	}()
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// withTx runs fn inside a transaction, rolling back on any error.
func withTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return utils.Internal(err)
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return utils.Internal(err)
	}

	return nil
}

// isPgConflict returns true for PostgreSQL unique violation (23505).
func isPgConflict(err error) bool {
	return err != nil && len(err.Error()) > 5 && err.Error()[:5] == "23505"
}

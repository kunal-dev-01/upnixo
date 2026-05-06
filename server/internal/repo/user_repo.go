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
	GetTwoFactor(ctx context.Context, userID uuid.UUID) (*models.TwoFactorAuth, error)
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
// SHARED SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// insertUserColumns is used for RETURNING clauses when we only insert into the users table
const insertUserColumns = `
	id, email, email_verified, email_verified_at,
	phone, phone_verified, phone_verified_at,
	password_hash, password_changed_at, password_reset_requested_at,
	full_name, avatar_url, timezone, locale,
	is_active, is_blocked, blocked_at, blocked_reason,
	last_login_at, last_login_ip,
	two_factor_enabled, two_factor_enabled_at,
	created_at, updated_at, deleted_at`

// userWithPrefsColumns includes fields from both users and user_preferences tables
const userWithPrefsColumns = `
	u.id, u.email, u.email_verified, u.email_verified_at,
	u.phone, u.phone_verified, u.phone_verified_at,
	u.password_hash, u.password_changed_at, u.password_reset_requested_at,
	u.full_name, u.avatar_url, u.timezone, u.locale,
	u.is_active, u.is_blocked, u.blocked_at, u.blocked_reason,
	u.last_login_at, u.last_login_ip,
	u.two_factor_enabled, u.two_factor_enabled_at,
	u.created_at, u.updated_at, u.deleted_at,
	p.theme, p.sidebar_collapsed, p.compact_view, p.notifications, p.default_currency, p.language`

// userJoinPrefs is the standard JOIN clause for fetching a user with their preferences
const userJoinPrefs = `
	FROM users u
	LEFT JOIN user_preferences p ON p.user_id = u.id`

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

func (r *authRepo) Register(ctx context.Context, params RegisterParams) (*models.User, error) {
	var user models.User

	err := withTx(ctx, func(tx pgx.Tx) error {
		// 1. Insert User
		const insertUser = `
			INSERT INTO users (email, password_hash, full_name, avatar_url)
			VALUES (@email, @password_hash, @full_name, @avatar_url)
			RETURNING ` + insertUserColumns

		args := pgx.NamedArgs{
			"email":         params.Email,
			"password_hash": params.PasswordHash,
			"full_name":     params.FullName,
			"avatar_url":    params.AvatarURL,
		}

		uRow, err := tx.Query(ctx, insertUser, args)
		if err != nil {
			return err
		}

		user, err = pgx.CollectOneRow(uRow, pgx.RowToStructByName[models.User])
		if err != nil {
			return err
		}

		// 2. Insert Default Preferences
		_, err = tx.Exec(ctx, `INSERT INTO user_preferences (user_id) VALUES ($1)`, user.ID)
		return err
	})

	if err != nil {
		if isPgConflict(err) {
			return nil, utils.Conflict("email is already registered")
		}
		r.log.Error("register: failed", err, nil)
		return nil, utils.Internal(err)
	}

	return &user, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────────────────────

func (r *authRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	sql := `SELECT ` + userWithPrefsColumns + userJoinPrefs + ` WHERE u.id = @id AND u.deleted_at IS NULL`

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

func (r *authRepo) GetUserForLogin(ctx context.Context, email string) (*models.User, error) {
	sql := `SELECT ` + userWithPrefsColumns + userJoinPrefs + ` WHERE u.email = @email AND u.deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"email": email})
	if err != nil {
		r.log.Error("login: query failed", err, nil)
		return nil, utils.Internal(err)
	}

	user, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.User])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
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

func (r *authRepo) FindOrCreateOAuthUser(ctx context.Context, params OAuthLoginParams) (*models.User, bool, error) {
	existing, err := r.findOAuthUser(ctx, params.Provider, params.ProviderUserID)
	if err == nil {
		return existing, false, nil
	}
	if !errors.Is(err, errOAuthNotFound) {
		return nil, false, err
	}

	user, err := r.createOAuthUser(ctx, params)
	if err != nil {
		return nil, false, err
	}

	return user, true, nil
}

var errOAuthNotFound = errors.New("oauth account not found")

func (r *authRepo) findOAuthUser(ctx context.Context, provider models.OAuthProvider, providerUserID string) (*models.User, error) {
	sql := `
		SELECT ` + userWithPrefsColumns + `
		FROM   users u
		JOIN   oauth_accounts o ON o.user_id = u.id
		LEFT JOIN user_preferences p ON p.user_id = u.id
		WHERE  o.provider         = @provider
		  AND  o.provider_user_id = @provider_user_id
		  AND  u.deleted_at       IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{
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
		// 1. Create user row
		createSQL := `
			INSERT INTO users (email, full_name, avatar_url, email_verified, email_verified_at)
			VALUES (@email, @full_name, @avatar_url, TRUE, NOW())
			ON CONFLICT (email) DO UPDATE SET
				full_name  = COALESCE(EXCLUDED.full_name, users.full_name),
				avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
			RETURNING ` + insertUserColumns

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

		// 2. Insert Default Preferences
		_, err = tx.Exec(ctx, `INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, user.ID)
		if err != nil {
			return utils.Internal(err)
		}

		// 3. Link OAuth account
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

		return err
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

		return err
	})
}

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

		return err
	})
}

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
// GET TWO FACTOR
// ─────────────────────────────────────────────────────────────────────────────

func (r *authRepo) GetTwoFactor(ctx context.Context, userID uuid.UUID) (*models.TwoFactorAuth, error) {
	sql := `
		SELECT
			id, user_id, totp_secret, totp_algorithm, totp_digits, totp_period,
			backup_codes, backup_codes_generated_at,
			is_enabled, enabled_at, last_verified_at, last_method_used,
			created_at, updated_at
		FROM two_factor_auth
		WHERE user_id = @user_id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"user_id": userID})
	if err != nil {
		r.log.Error("get two factor: query failed", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}

	tf, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.TwoFactorAuth])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("2FA not configured for this account")
		}
		r.log.Error("get two factor: scan failed", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}

	return &tf, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

func isPgConflict(err error) bool {
	return err != nil && len(err.Error()) > 5 && err.Error()[:5] == "23505"
}

package repo

import (
	"context"
	"errors"

	"server/internal/db"
	"server/internal/models"
	"server/internal/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

type AdminRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.MasterAdmin, error)
	GetByEmail(ctx context.Context, email string) (*models.MasterAdmin, error)
	Update(ctx context.Context, id uuid.UUID, params UpdateAdminParams) error
	RecordLogin(ctx context.Context, id uuid.UUID, ip, userAgent string) error
	Verify(ctx context.Context, id uuid.UUID) error
	SetStatus(ctx context.Context, id uuid.UUID, isActive bool) error
	SetPassword(ctx context.Context, id uuid.UUID, hash string) error
	SetMasterKey(ctx context.Context, id uuid.UUID, key string) error
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type UpdateAdminParams struct {
	FullName *string
	Phone    *string
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const adminColumns = `
	id, full_name, email, phone,
	password_hash, master_secret_key,
	is_verified, verification_token_sent_at, is_active,
	last_login_at, last_login_ip, last_user_agent,
	created_at, updated_at, deleted_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type adminRepo struct {
	log *utils.Logger
}

func NewAdminRepository(log *utils.Logger) AdminRepository {
	return &adminRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

func (r *adminRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.MasterAdmin, error) {
	sql := `SELECT ` + adminColumns + ` FROM master_admins WHERE id = @id AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get admin by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.MasterAdmin])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("admin not found")
		}
		r.log.Error("get admin by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *adminRepo) GetByEmail(ctx context.Context, email string) (*models.MasterAdmin, error) {
	sql := `SELECT ` + adminColumns + ` FROM master_admins WHERE email = @email AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"email": email})
	if err != nil {
		r.log.Error("get admin by email: query failed", err, map[string]any{"email": email})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.MasterAdmin])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("admin not found")
		}
		r.log.Error("get admin by email: scan failed", err, map[string]any{"email": email})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

func (r *adminRepo) Update(ctx context.Context, id uuid.UUID, params UpdateAdminParams) error {
	sql := `
		UPDATE master_admins
		SET full_name = COALESCE(@full_name, full_name),
			phone     = COALESCE(@phone, phone),
			updated_at = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":        id,
		"full_name": params.FullName,
		"phone":     params.Phone,
	})
	if err != nil {
		r.log.Error("update admin: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("admin not found")
	}

	return nil
}

func (r *adminRepo) RecordLogin(ctx context.Context, id uuid.UUID, ip, userAgent string) error {
	sql := `
		UPDATE master_admins
		SET last_login_at   = NOW(),
			last_login_ip   = @ip,
			last_user_agent = @ua,
			updated_at      = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id": id,
		"ip": ip,
		"ua": userAgent,
	})
	if err != nil {
		r.log.Error("record admin login: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	return nil
}

func (r *adminRepo) Verify(ctx context.Context, id uuid.UUID) error {
	sql := `
		UPDATE master_admins
		SET is_verified = TRUE,
			updated_at  = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("verify admin: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("admin not found")
	}

	return nil
}

func (r *adminRepo) SetStatus(ctx context.Context, id uuid.UUID, isActive bool) error {
	sql := `
		UPDATE master_admins
		SET is_active  = @active,
			updated_at = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "active": isActive})
	if err != nil {
		r.log.Error("set admin status: exec failed", err, map[string]any{"id": id, "active": isActive})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("admin not found")
	}

	return nil
}

func (r *adminRepo) SetPassword(ctx context.Context, id uuid.UUID, hash string) error {
	sql := `
		UPDATE master_admins
		SET password_hash = @hash,
			updated_at    = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "hash": hash})
	if err != nil {
		r.log.Error("set admin password: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}
	return nil
}

func (r *adminRepo) SetMasterKey(ctx context.Context, id uuid.UUID, key string) error {
	sql := `
		UPDATE master_admins
		SET master_secret_key = @key,
			updated_at        = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	_, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "key": key})
	if err != nil {
		r.log.Error("set admin master key: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}
	return nil
}

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

type VaultRepository interface {
	// Collections
	CreateCollection(ctx context.Context, c *models.VaultCollection) error
	GetCollectionByID(ctx context.Context, id uuid.UUID) (*models.VaultCollection, error)
	ListCollectionsByProject(ctx context.Context, projectID uuid.UUID) ([]models.VaultCollection, error)
	UpdateCollection(ctx context.Context, id uuid.UUID, params UpdateVaultCollectionParams) error
	DeleteCollection(ctx context.Context, id uuid.UUID) error

	// Items
	CreateItem(ctx context.Context, i *models.VaultItem) error
	GetItemByID(ctx context.Context, id uuid.UUID) (*models.VaultItem, error)
	ListItemsByCollection(ctx context.Context, collectionID uuid.UUID) ([]models.VaultItem, error)
	UpdateItem(ctx context.Context, id uuid.UUID, params UpdateVaultItemParams) error
	DeleteItem(ctx context.Context, id uuid.UUID) error
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type UpdateVaultCollectionParams struct {
	Name        *string
	Description *string
}

type UpdateVaultItemParams struct {
	KeyName        *string
	EncryptedValue *string
	EncryptionIV   *string
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const collectionColumns = `id, project_id, name, description, created_at, updated_at`

const itemColumns = `
	id, collection_id, added_by, 
	key_name, encrypted_value, encryption_iv, 
	version, created_at, updated_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type vaultRepo struct {
	log *utils.Logger
}

func NewVaultRepository(log *utils.Logger) VaultRepository {
	return &vaultRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *vaultRepo) CreateCollection(ctx context.Context, c *models.VaultCollection) error {
	const sql = `
		INSERT INTO vault_collections (project_id, name, description)
		VALUES (@project_id, @name, @description)
		RETURNING ` + collectionColumns

	args := pgx.NamedArgs{
		"project_id":  c.ProjectID,
		"name":        c.Name,
		"description": c.Description,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		r.log.Error("create vault collection: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.VaultCollection])
	if err != nil {
		r.log.Error("create vault collection: scan failed", err, nil)
		return utils.Internal(err)
	}

	*c = res
	return nil
}

func (r *vaultRepo) GetCollectionByID(ctx context.Context, id uuid.UUID) (*models.VaultCollection, error) {
	sql := `SELECT ` + collectionColumns + ` FROM vault_collections WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get vault collection: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.VaultCollection])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("vault collection not found")
		}
		r.log.Error("get vault collection: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *vaultRepo) ListCollectionsByProject(ctx context.Context, projectID uuid.UUID) ([]models.VaultCollection, error) {
	sql := `SELECT ` + collectionColumns + ` FROM vault_collections WHERE project_id = @project_id ORDER BY created_at ASC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"project_id": projectID})
	if err != nil {
		r.log.Error("list vault collections: query failed", err, map[string]any{"project_id": projectID})
		return nil, utils.Internal(err)
	}

	collections, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.VaultCollection])
	if err != nil {
		r.log.Error("list vault collections: scan failed", err, map[string]any{"project_id": projectID})
		return nil, utils.Internal(err)
	}

	return collections, nil
}

func (r *vaultRepo) UpdateCollection(ctx context.Context, id uuid.UUID, params UpdateVaultCollectionParams) error {
	sql := `
		UPDATE vault_collections
		SET name        = COALESCE(@name, name),
			description = COALESCE(@description, description),
			updated_at  = NOW()
		WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":          id,
		"name":        params.Name,
		"description": params.Description,
	})
	if err != nil {
		r.log.Error("update vault collection: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("vault collection not found")
	}

	return nil
}

func (r *vaultRepo) DeleteCollection(ctx context.Context, id uuid.UUID) error {
	// Using withTx because deleting a collection might involve side effects
	// or we might want to ensure items are deleted if not cascading.
	return withTx(ctx, func(tx pgx.Tx) error {
		// First delete items
		_, err := tx.Exec(ctx, `DELETE FROM vault_items WHERE collection_id = $1`, id)
		if err != nil {
			return utils.Internal(err)
		}

		// Then delete collection
		tag, err := tx.Exec(ctx, `DELETE FROM vault_collections WHERE id = $1`, id)
		if err != nil {
			return utils.Internal(err)
		}

		if tag.RowsAffected() == 0 {
			return utils.NotFound("vault collection not found")
		}

		return nil
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *vaultRepo) CreateItem(ctx context.Context, i *models.VaultItem) error {
	const sql = `
		INSERT INTO vault_items (collection_id, added_by, key_name, encrypted_value, encryption_iv)
		VALUES (@collection_id, @added_by, @key_name, @encrypted_value, @encryption_iv)
		RETURNING ` + itemColumns

	args := pgx.NamedArgs{
		"collection_id":   i.CollectionID,
		"added_by":        i.AddedBy,
		"key_name":        i.KeyName,
		"encrypted_value": i.EncryptedValue,
		"encryption_iv":   i.EncryptionIV,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("item with this key already exists in the collection")
		}
		r.log.Error("create vault item: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.VaultItem])
	if err != nil {
		r.log.Error("create vault item: scan failed", err, nil)
		return utils.Internal(err)
	}

	*i = res
	return nil
}

func (r *vaultRepo) GetItemByID(ctx context.Context, id uuid.UUID) (*models.VaultItem, error) {
	sql := `SELECT ` + itemColumns + ` FROM vault_items WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get vault item: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.VaultItem])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("vault item not found")
		}
		r.log.Error("get vault item: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *vaultRepo) ListItemsByCollection(ctx context.Context, collectionID uuid.UUID) ([]models.VaultItem, error) {
	sql := `SELECT ` + itemColumns + ` FROM vault_items WHERE collection_id = @collection_id ORDER BY key_name ASC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"collection_id": collectionID})
	if err != nil {
		r.log.Error("list vault items: query failed", err, map[string]any{"collection_id": collectionID})
		return nil, utils.Internal(err)
	}

	items, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.VaultItem])
	if err != nil {
		r.log.Error("list vault items: scan failed", err, map[string]any{"collection_id": collectionID})
		return nil, utils.Internal(err)
	}

	return items, nil
}

func (r *vaultRepo) UpdateItem(ctx context.Context, id uuid.UUID, params UpdateVaultItemParams) error {
	// Increment version only if the value actually changes
	sql := `
		UPDATE vault_items
		SET key_name        = COALESCE(@key_name, key_name),
			encrypted_value = COALESCE(@encrypted_value, encrypted_value),
			encryption_iv   = COALESCE(@encryption_iv, encryption_iv),
			version         = CASE WHEN @encrypted_value IS NOT NULL THEN version + 1 ELSE version END,
			updated_at      = NOW()
		WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":              id,
		"key_name":        params.KeyName,
		"encrypted_value": params.EncryptedValue,
		"encryption_iv":   params.EncryptionIV,
	})
	if err != nil {
		r.log.Error("update vault item: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("vault item not found")
	}

	return nil
}

func (r *vaultRepo) DeleteItem(ctx context.Context, id uuid.UUID) error {
	sql := `DELETE FROM vault_items WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("delete vault item: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("vault item not found")
	}

	return nil
}

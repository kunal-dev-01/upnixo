package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ─────────────────────────────────────────────────────────────────────────────
// VAULT COLLECTION
// ─────────────────────────────────────────────────────────────────────────────

type VaultCollection struct {
	ID        uuid.UUID `db:"id"         json:"id"`
	ProjectID uuid.UUID `db:"project_id" json:"project_id"`

	Name        string      `db:"name"        json:"name"`
	Description pgtype.Text `db:"description" json:"description"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SafeVaultCollection struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

func (c *VaultCollection) ToSafe() SafeVaultCollection {
	s := SafeVaultCollection{
		ID:        c.ID,
		ProjectID: c.ProjectID,
		Name:      c.Name,
		CreatedAt: c.CreatedAt,
	}
	if c.Description.Valid {
		s.Description = &c.Description.String
	}
	return s
}

// ─────────────────────────────────────────────────────────────────────────────
// VAULT ITEM
// ─────────────────────────────────────────────────────────────────────────────

type VaultItem struct {
	ID           uuid.UUID `db:"id"            json:"id"`
	CollectionID uuid.UUID `db:"collection_id" json:"collection_id"`
	AddedBy      uuid.UUID `db:"added_by"      json:"added_by"`

	KeyName        string `db:"key_name"        json:"key_name"`
	EncryptedValue string `db:"encrypted_value" json:"-"`
	EncryptionIV   string `db:"encryption_iv"   json:"-"`

	Version int32 `db:"version" json:"version"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SafeVaultItem struct {
	ID           uuid.UUID `json:"id"`
	CollectionID uuid.UUID `json:"collection_id"`
	AddedBy      uuid.UUID `json:"added_by"`
	KeyName      string    `json:"key_name"`
	Version      int32     `json:"version"`
	CreatedAt    time.Time `json:"created_at"`
}

func (i *VaultItem) ToSafe() SafeVaultItem {
	return SafeVaultItem{
		ID:           i.ID,
		CollectionID: i.CollectionID,
		AddedBy:      i.AddedBy,
		KeyName:      i.KeyName,
		Version:      i.Version,
		CreatedAt:    i.CreatedAt,
	}
}

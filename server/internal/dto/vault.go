package dto

import (
	"server/internal/models"

	"github.com/google/uuid"
)

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

type CreateVaultCollectionRequest struct {
	ProjectID   uuid.UUID `json:"project_id"  validate:"required"`
	Name        string    `json:"name"        validate:"required,min=3,max=100"`
	Description string    `json:"description" validate:"omitempty,max=500"`
}

type UpdateVaultCollectionRequest struct {
	Name        *string `json:"name"        validate:"omitempty,min=3,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

type CreateVaultItemRequest struct {
	CollectionID uuid.UUID `json:"collection_id" validate:"required"`
	KeyName      string    `json:"key_name"      validate:"required,min=1,max=100"`
	Value        string    `json:"value"         validate:"required,min=1"`
}

type UpdateVaultItemRequest struct {
	KeyName *string `json:"key_name" validate:"omitempty,min=1,max=100"`
	Value   *string `json:"value"    validate:"omitempty,min=1"`
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

type VaultItemResponse struct {
	models.SafeVaultItem
	Value string `json:"value"` // Decrypted value returned securely
}

package service

import (
	"context"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"

	"github.com/google/uuid"
)

type VaultService struct {
	repo        repo.VaultRepository
	projectRepo repo.ProjectRepository
	cfg         *config.Config
	log         *utils.Logger
}

func NewVaultService(r repo.VaultRepository, pr repo.ProjectRepository, cfg *config.Config, log *utils.Logger) *VaultService {
	return &VaultService{repo: r, projectRepo: pr, cfg: cfg, log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// ─────────────────────────────────────────────────────────────────────────────

func (s *VaultService) CreateCollection(ctx context.Context, userID uuid.UUID, req dto.CreateVaultCollectionRequest, isAdmin bool) (*models.SafeVaultCollection, error) {
	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, req.ProjectID, userID); err != nil {
			return nil, err
		}
	}

	c := &models.VaultCollection{
		ProjectID: req.ProjectID,
		Name:      req.Name,
	}

	if req.Description != "" {
		c.Description.String = req.Description
		c.Description.Valid = true
	}

	if err := s.repo.CreateCollection(ctx, c); err != nil {
		return nil, err
	}

	safe := c.ToSafe()
	return &safe, nil
}

func (s *VaultService) GetCollectionByID(ctx context.Context, id, userID uuid.UUID, isAdmin bool) (*models.SafeVaultCollection, error) {
	c, err := s.repo.GetCollectionByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return nil, err
		}
	}

	safe := c.ToSafe()
	return &safe, nil
}

func (s *VaultService) ListCollectionsByProject(ctx context.Context, projectID, userID uuid.UUID, isAdmin bool) ([]models.SafeVaultCollection, error) {
	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, projectID, userID); err != nil {
			return nil, err
		}
	}

	collections, err := s.repo.ListCollectionsByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	var safeCols []models.SafeVaultCollection
	for _, c := range collections {
		safeCols = append(safeCols, c.ToSafe())
	}

	return safeCols, nil
}

func (s *VaultService) UpdateCollection(ctx context.Context, id, userID uuid.UUID, req dto.UpdateVaultCollectionRequest, isAdmin bool) error {
	if !isAdmin {
		c, err := s.repo.GetCollectionByID(ctx, id)
		if err != nil {
			return err
		}
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return err
		}
	}

	params := repo.UpdateVaultCollectionParams{
		Name:        req.Name,
		Description: req.Description,
	}
	return s.repo.UpdateCollection(ctx, id, params)
}

func (s *VaultService) DeleteCollection(ctx context.Context, id, userID uuid.UUID, isAdmin bool) error {
	if !isAdmin {
		c, err := s.repo.GetCollectionByID(ctx, id)
		if err != nil {
			return err
		}
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return err
		}
	}
	return s.repo.DeleteCollection(ctx, id)
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────────────────────────────────────

func (s *VaultService) CreateItem(ctx context.Context, userID uuid.UUID, req dto.CreateVaultItemRequest, isAdmin bool) (*dto.VaultItemResponse, error) {
	c, err := s.repo.GetCollectionByID(ctx, req.CollectionID)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return nil, err
		}
	}

	cipherBase64, ivBase64, err := security.EncryptVaultValue(req.Value, s.cfg.Security.VaultSecretKey)
	if err != nil {
		s.log.Error("failed to encrypt vault item", err, nil)
		return nil, utils.Internal(err)
	}

	i := &models.VaultItem{
		CollectionID:   req.CollectionID,
		AddedBy:        userID,
		KeyName:        req.KeyName,
		EncryptedValue: cipherBase64,
		EncryptionIV:   ivBase64,
	}

	if err := s.repo.CreateItem(ctx, i); err != nil {
		return nil, err
	}

	return &dto.VaultItemResponse{
		SafeVaultItem: i.ToSafe(),
		Value:         req.Value,
	}, nil
}

func (s *VaultService) GetItemByID(ctx context.Context, id, userID uuid.UUID, isAdmin bool) (*dto.VaultItemResponse, error) {
	i, err := s.repo.GetItemByID(ctx, id)
	if err != nil {
		return nil, err
	}

	c, err := s.repo.GetCollectionByID(ctx, i.CollectionID)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return nil, err
		}
	}

	decryptedValue, err := security.DecryptVaultValue(i.EncryptedValue, i.EncryptionIV, s.cfg.Security.VaultSecretKey)
	if err != nil {
		s.log.Error("failed to decrypt vault item", err, nil)
		return nil, utils.Internal(err)
	}

	return &dto.VaultItemResponse{
		SafeVaultItem: i.ToSafe(),
		Value:         decryptedValue,
	}, nil
}

func (s *VaultService) ListItemsByCollection(ctx context.Context, collectionID, userID uuid.UUID, isAdmin bool) ([]dto.VaultItemResponse, error) {
	c, err := s.repo.GetCollectionByID(ctx, collectionID)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return nil, err
		}
	}

	items, err := s.repo.ListItemsByCollection(ctx, collectionID)
	if err != nil {
		return nil, err
	}

	var responses []dto.VaultItemResponse
	for _, i := range items {
		decryptedValue, err := security.DecryptVaultValue(i.EncryptedValue, i.EncryptionIV, s.cfg.Security.VaultSecretKey)
		if err != nil {
			s.log.Error("failed to decrypt vault item in list", err, map[string]any{"item_id": i.ID})
			continue // skip corrupted items instead of failing the whole list
		}

		responses = append(responses, dto.VaultItemResponse{
			SafeVaultItem: i.ToSafe(),
			Value:         decryptedValue,
		})
	}

	return responses, nil
}

func (s *VaultService) UpdateItem(ctx context.Context, id, userID uuid.UUID, req dto.UpdateVaultItemRequest, isAdmin bool) error {
	i, err := s.repo.GetItemByID(ctx, id)
	if err != nil {
		return err
	}

	c, err := s.repo.GetCollectionByID(ctx, i.CollectionID)
	if err != nil {
		return err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return err
		}
	}

	params := repo.UpdateVaultItemParams{
		KeyName: req.KeyName,
	}

	if req.Value != nil {
		cipherBase64, ivBase64, err := security.EncryptVaultValue(*req.Value, s.cfg.Security.VaultSecretKey)
		if err != nil {
			s.log.Error("failed to encrypt vault item on update", err, nil)
			return utils.Internal(err)
		}
		params.EncryptedValue = &cipherBase64
		params.EncryptionIV = &ivBase64
	}

	return s.repo.UpdateItem(ctx, id, params)
}

func (s *VaultService) DeleteItem(ctx context.Context, id, userID uuid.UUID, isAdmin bool) error {
	i, err := s.repo.GetItemByID(ctx, id)
	if err != nil {
		return err
	}

	c, err := s.repo.GetCollectionByID(ctx, i.CollectionID)
	if err != nil {
		return err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, c.ProjectID, userID); err != nil {
			return err
		}
	}

	return s.repo.DeleteItem(ctx, id)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

func (s *VaultService) verifyProjectAccess(ctx context.Context, projectID uuid.UUID, userID uuid.UUID) error {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}

	if project.ClientID != userID && (project.FreelancerID == nil || *project.FreelancerID != userID) {
		return utils.Forbidden("you do not have access to this vault")
	}

	return nil
}

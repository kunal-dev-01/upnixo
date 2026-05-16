package service

import (
	"context"
	"server/internal/dto"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/utils"

	"github.com/google/uuid"
)

type MilestoneService struct {
	repo        repo.MilestoneRepository
	projectRepo repo.ProjectRepository
	log         *utils.Logger
}

func NewMilestoneService(repo repo.MilestoneRepository, projectRepo repo.ProjectRepository, log *utils.Logger) *MilestoneService {
	return &MilestoneService{repo: repo, projectRepo: projectRepo, log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN OPERATIONS (CREATE, UPDATE, DELETE)
// ─────────────────────────────────────────────────────────────────────────────

func (s *MilestoneService) Create(ctx context.Context, req dto.CreateMilestoneRequest) (*models.Milestone, error) {
	milestone := &models.Milestone{
		ProjectID:   req.ProjectID,
		OrderIndex:  req.OrderIndex,
		Title:       req.Title,
		Amount:      req.Amount,
		Status:      models.MilestoneStatusPendingFunding,
	}

	if req.Description != "" {
		milestone.Description.String = req.Description
		milestone.Description.Valid = true
	}

	if req.DueDate != nil {
		milestone.DueDate.Time = *req.DueDate
		milestone.DueDate.Valid = true
	}

	if err := s.repo.Create(ctx, milestone); err != nil {
		return nil, err
	}

	return milestone, nil
}

func (s *MilestoneService) Update(ctx context.Context, id uuid.UUID, req dto.UpdateMilestoneRequest) error {
	params := repo.UpdateMilestoneParams{
		OrderIndex:  req.OrderIndex,
		Title:       req.Title,
		Description: req.Description,
		Amount:      req.Amount,
		Status:      req.Status,
		DueDate:     req.DueDate,
	}

	return s.repo.Update(ctx, id, params)
}

func (s *MilestoneService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// ─────────────────────────────────────────────────────────────────────────────
// READ OPERATIONS (ACCESSIBLE BY PARTICIPANTS)
// ─────────────────────────────────────────────────────────────────────────────

func (s *MilestoneService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID, isAdmin bool) (*models.Milestone, error) {
	milestone, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, milestone.ProjectID, userID); err != nil {
			return nil, err
		}
	}

	return milestone, nil
}

func (s *MilestoneService) ListByProject(ctx context.Context, projectID uuid.UUID, userID uuid.UUID, isAdmin bool) ([]models.Milestone, error) {
	if !isAdmin {
		if err := s.verifyProjectAccess(ctx, projectID, userID); err != nil {
			return nil, err
		}
	}

	return s.repo.ListByProject(ctx, projectID)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

func (s *MilestoneService) verifyProjectAccess(ctx context.Context, projectID uuid.UUID, userID uuid.UUID) error {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}

	if project.ClientID != userID && project.FreelancerID != userID {
		return utils.Forbidden("you do not have access to this project's milestones")
	}

	return nil
}

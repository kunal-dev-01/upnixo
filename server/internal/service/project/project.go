package service

import (
	"context"
	"server/internal/dto"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/utils"

	"github.com/google/uuid"
)

type ProjectService struct {
	repo repo.ProjectRepository
	log  *utils.Logger
}

func NewProjectService(repo repo.ProjectRepository, log *utils.Logger) *ProjectService {
	return &ProjectService{repo: repo, log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

func (s *ProjectService) Create(ctx context.Context, clientID uuid.UUID, req dto.CreateProjectRequest) (*models.Project, error) {
	project := &models.Project{
		ClientID:     clientID,
		FreelancerID: req.FreelancerID,
		Title:        req.Title,
		Description:  req.Description,
		Budget:       req.Budget,
		Currency:     req.Currency,
		Priority:     req.Priority,
		Status:       models.ProjectStatusDraft,
	}

	if req.DeadlineAt != nil {
		project.DeadlineAt.Time = *req.DeadlineAt
		project.DeadlineAt.Valid = true
	}

	// Slug uniqueness retry loop (handles potential collisions)
	for range 3 {
		project.Slug = utils.GenerateSlug(req.Title)
		err := s.repo.Create(ctx, project)
		if err == nil {
			return project, nil
		}

		// Only retry if it's a conflict (likely slug collision)
		if !utils.IsConflict(err) {
			return nil, err
		}
	}

	return nil, utils.Conflict("could not generate a unique slug, please try again with a slightly different title")
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

func (s *ProjectService) GetByID(ctx context.Context, id uuid.UUID) (*models.Project, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ProjectService) GetBySlug(ctx context.Context, slug string) (*models.Project, error) {
	return s.repo.GetBySlug(ctx, slug)
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

func (s *ProjectService) Update(ctx context.Context, id uuid.UUID, req dto.UpdateProjectRequest) error {
	params := repo.UpdateProjectParams{
		Title:         req.Title,
		Description:   req.Description,
		Budget:        req.Budget,
		Currency:      req.Currency,
		Status:        req.Status,
		Priority:      req.Priority,
		RepositoryURL: req.RepositoryURL,
		DeadlineAt:    req.DeadlineAt,
	}

	return s.repo.Update(ctx, id, params)
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

func (s *ProjectService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTING
// ─────────────────────────────────────────────────────────────────────────────

func (s *ProjectService) ListByClient(ctx context.Context, clientID uuid.UUID, filter dto.ProjectFilter, pag dto.PaginationQuery) ([]models.Project, error) {
	params := repo.ListProjectsParams{
		ClientID: &clientID,
		Status:   filter.Status,
		Priority: filter.Priority,
		Currency: filter.Currency,
		Limit:    pag.GetLimit(),
		Offset:   pag.GetOffset(),
	}
	return s.repo.List(ctx, params)
}

func (s *ProjectService) ListByFreelancer(ctx context.Context, freelancerID uuid.UUID, filter dto.ProjectFilter, pag dto.PaginationQuery) ([]models.Project, error) {
	params := repo.ListProjectsParams{
		FreelancerID: &freelancerID,
		Status:       filter.Status,
		Priority:     filter.Priority,
		Currency:     filter.Currency,
		Limit:        pag.GetLimit(),
		Offset:       pag.GetOffset(),
	}
	return s.repo.List(ctx, params)
}

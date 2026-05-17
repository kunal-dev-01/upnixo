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
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

type ProjectRepository interface {
	Create(ctx context.Context, p *models.Project) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Project, error)
	GetBySlug(ctx context.Context, slug string) (*models.Project, error)
	Update(ctx context.Context, id uuid.UUID, params UpdateProjectParams) error
	Delete(ctx context.Context, id uuid.UUID) error

	List(ctx context.Context, params ListProjectsParams) ([]models.Project, error)
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type ListProjectsParams struct {
	ClientID     *uuid.UUID
	FreelancerID *uuid.UUID
	Status       *models.ProjectStatus
	Priority     *int16
	Currency     *string
	Limit        int
	Offset       int
}

type UpdateProjectParams struct {
	FreelancerID       *uuid.UUID
	Title              *string
	Description        *string
	RequirementsMeta   []byte
	Budget             *decimal.Decimal
	Currency           *string
	IsEscrowFunded     *bool
	Status             *models.ProjectStatus
	Priority           *int16
	ChatRoomID         *string
	RepositoryURL      *string
	DeadlineAt         *time.Time
	StartedAt          *time.Time
	CompletedAt        *time.Time
	LastMessagePreview *string
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const projectColumns = `
	id, slug, client_id, freelancer_id,
	chat_room_id, repository_url,
	title, description, requirements_meta,
	budget, currency, is_escrow_funded,
	status, priority,
	last_activity_at, last_message_preview,
	deadline_at, started_at, completed_at,
	created_at, updated_at, deleted_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type projectRepo struct {
	log *utils.Logger
}

func NewProjectRepository(log *utils.Logger) ProjectRepository {
	return &projectRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

func (r *projectRepo) Create(ctx context.Context, p *models.Project) error {
	const sql = `
		INSERT INTO projects (
			slug, client_id, freelancer_id, title, description, budget, currency, status, priority, deadline_at
		) VALUES (
			@slug, @client_id, @freelancer_id, @title, @description, @budget, @currency, @status, @priority, @deadline_at
		)
		RETURNING ` + projectColumns

	args := pgx.NamedArgs{
		"slug":          p.Slug,
		"client_id":     p.ClientID,
		"freelancer_id": p.FreelancerID,
		"title":         p.Title,
		"description":   p.Description,
		"budget":        p.Budget,
		"currency":      p.Currency,
		"status":        p.Status,
		"priority":      p.Priority,
		"deadline_at":   p.DeadlineAt,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("project slug already exists")
		}
		r.log.Error("create project: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Project])
	if err != nil {
		r.log.Error("create project: scan failed", err, nil)
		return utils.Internal(err)
	}

	*p = res
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

func (r *projectRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Project, error) {
	sql := `SELECT ` + projectColumns + ` FROM projects WHERE id = @id AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get project by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Project])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("project not found")
		}
		r.log.Error("get project by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *projectRepo) GetBySlug(ctx context.Context, slug string) (*models.Project, error) {
	sql := `SELECT ` + projectColumns + ` FROM projects WHERE slug = @slug AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"slug": slug})
	if err != nil {
		r.log.Error("get project by slug: query failed", err, map[string]any{"slug": slug})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Project])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("project not found")
		}
		r.log.Error("get project by slug: scan failed", err, map[string]any{"slug": slug})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

func (r *projectRepo) Update(ctx context.Context, id uuid.UUID, params UpdateProjectParams) error {
	sql := `
		UPDATE projects
		SET 
			freelancer_id        = COALESCE(@freelancer_id, freelancer_id),
			title                = COALESCE(@title, title),
			description          = COALESCE(@description, description),
			requirements_meta    = COALESCE(@requirements_meta, requirements_meta),
			budget               = COALESCE(@budget, budget),
			currency             = COALESCE(@currency, currency),
			is_escrow_funded     = COALESCE(@is_escrow_funded, is_escrow_funded),
			status               = COALESCE(@status, status),
			priority             = COALESCE(@priority, priority),
			chat_room_id         = COALESCE(@chat_room_id, chat_room_id),
			repository_url       = COALESCE(@repository_url, repository_url),
			deadline_at          = COALESCE(@deadline_at, deadline_at),
			started_at           = COALESCE(@started_at, started_at),
			completed_at         = COALESCE(@completed_at, completed_at),
			last_message_preview = COALESCE(@last_message_preview, last_message_preview),
			last_activity_at     = CASE WHEN @last_message_preview IS NOT NULL THEN NOW() ELSE last_activity_at END,
			updated_at           = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	args := pgx.NamedArgs{
		"id":                   id,
		"freelancer_id":        params.FreelancerID,
		"title":                params.Title,
		"description":          params.Description,
		"requirements_meta":    params.RequirementsMeta,
		"budget":               params.Budget,
		"currency":             params.Currency,
		"is_escrow_funded":     params.IsEscrowFunded,
		"status":               params.Status,
		"priority":             params.Priority,
		"chat_room_id":         params.ChatRoomID,
		"repository_url":       params.RepositoryURL,
		"deadline_at":          params.DeadlineAt,
		"started_at":           params.StartedAt,
		"completed_at":         params.CompletedAt,
		"last_message_preview": params.LastMessagePreview,
	}

	tag, err := db.Pool.Exec(ctx, sql, args)
	if err != nil {
		r.log.Error("update project: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("project not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (SOFT)
// ─────────────────────────────────────────────────────────────────────────────

func (r *projectRepo) Delete(ctx context.Context, id uuid.UUID) error {
	sql := `UPDATE projects SET deleted_at = NOW(), updated_at = NOW() WHERE id = @id AND deleted_at IS NULL`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("delete project: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("project not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTING
// ─────────────────────────────────────────────────────────────────────────────

func (r *projectRepo) List(ctx context.Context, params ListProjectsParams) ([]models.Project, error) {
	sql := `SELECT ` + projectColumns + ` FROM projects WHERE deleted_at IS NULL`
	args := pgx.NamedArgs{}

	if params.ClientID != nil {
		sql += ` AND client_id = @client_id`
		args["client_id"] = *params.ClientID
	}
	if params.FreelancerID != nil {
		sql += ` AND freelancer_id = @freelancer_id`
		args["freelancer_id"] = *params.FreelancerID
	}
	if params.Status != nil {
		sql += ` AND status = @status`
		args["status"] = *params.Status
	}
	if params.Priority != nil {
		sql += ` AND priority = @priority`
		args["priority"] = *params.Priority
	}
	if params.Currency != nil {
		sql += ` AND currency = @currency`
		args["currency"] = *params.Currency
	}

	sql += ` ORDER BY created_at DESC`

	if params.Limit > 0 {
		sql += ` LIMIT @limit`
		args["limit"] = params.Limit
	}
	if params.Offset > 0 {
		sql += ` OFFSET @offset`
		args["offset"] = params.Offset
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		r.log.Error("list projects: query failed", err, args)
		return nil, utils.Internal(err)
	}

	projects, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Project])
	if err != nil {
		r.log.Error("list projects: scan failed", err, args)
		return nil, utils.Internal(err)
	}

	return projects, nil
}

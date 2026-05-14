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

type MilestoneRepository interface {
	Create(ctx context.Context, m *models.Milestone) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Milestone, error)
	ListByProject(ctx context.Context, projectID uuid.UUID) ([]models.Milestone, error)
	Update(ctx context.Context, id uuid.UUID, params UpdateMilestoneParams) error
	Delete(ctx context.Context, id uuid.UUID) error

	UpdateStatus(ctx context.Context, id uuid.UUID, status models.MilestoneStatus) error
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type UpdateMilestoneParams struct {
	OrderIndex       *int16
	Title            *string
	Description      *string
	Amount           *decimal.Decimal
	Status           *models.MilestoneStatus
	PaymentEscrowID  *string
	PaymentReleaseID *string
	SubmissionMeta   []byte
	DueDate          *time.Time
	SubmittedAt      *time.Time
	ApprovedAt       *time.Time
	PaidAt           *time.Time
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const milestoneColumns = `
	id, project_id, order_index, title, description,
	amount, status, payment_escrow_id, payment_release_id,
	submission_meta, due_date, submitted_at, approved_at, paid_at,
	created_at, updated_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type milestoneRepo struct {
	log *utils.Logger
}

func NewMilestoneRepository(log *utils.Logger) MilestoneRepository {
	return &milestoneRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

func (r *milestoneRepo) Create(ctx context.Context, m *models.Milestone) error {
	const sql = `
		INSERT INTO milestones (
			project_id, order_index, title, description, amount, status, due_date
		) VALUES (
			@project_id, @order_index, @title, @description, @amount, @status, @due_date
		)
		RETURNING ` + milestoneColumns

	args := pgx.NamedArgs{
		"project_id":  m.ProjectID,
		"order_index": m.OrderIndex,
		"title":       m.Title,
		"description": m.Description,
		"amount":      m.Amount,
		"status":      m.Status,
		"due_date":    m.DueDate,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		r.log.Error("create milestone: query failed", err, map[string]any{"project_id": m.ProjectID})
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Milestone])
	if err != nil {
		r.log.Error("create milestone: scan failed", err, map[string]any{"project_id": m.ProjectID})
		return utils.Internal(err)
	}

	*m = res
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

func (r *milestoneRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Milestone, error) {
	sql := `SELECT ` + milestoneColumns + ` FROM milestones WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get milestone by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Milestone])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("milestone not found")
		}
		r.log.Error("get milestone by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *milestoneRepo) ListByProject(ctx context.Context, projectID uuid.UUID) ([]models.Milestone, error) {
	sql := `SELECT ` + milestoneColumns + ` FROM milestones WHERE project_id = @project_id ORDER BY order_index ASC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"project_id": projectID})
	if err != nil {
		r.log.Error("list milestones: query failed", err, map[string]any{"project_id": projectID})
		return nil, utils.Internal(err)
	}

	milestones, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Milestone])
	if err != nil {
		r.log.Error("list milestones: scan failed", err, map[string]any{"project_id": projectID})
		return nil, utils.Internal(err)
	}

	return milestones, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

func (r *milestoneRepo) Update(ctx context.Context, id uuid.UUID, params UpdateMilestoneParams) error {
	sql := `
		UPDATE milestones
		SET 
			order_index        = COALESCE(@order_index, order_index),
			title              = COALESCE(@title, title),
			description        = COALESCE(@description, description),
			amount             = COALESCE(@amount, amount),
			status             = COALESCE(@status, status),
			payment_escrow_id  = COALESCE(@payment_escrow_id, payment_escrow_id),
			payment_release_id = COALESCE(@payment_release_id, payment_release_id),
			submission_meta    = COALESCE(@submission_meta, submission_meta),
			due_date           = COALESCE(@due_date, due_date),
			submitted_at       = COALESCE(@submitted_at, submitted_at),
			approved_at        = COALESCE(@approved_at, approved_at),
			paid_at            = COALESCE(@paid_at, paid_at),
			updated_at         = NOW()
		WHERE id = @id`

	args := pgx.NamedArgs{
		"id":                 id,
		"order_index":        params.OrderIndex,
		"title":              params.Title,
		"description":        params.Description,
		"amount":             params.Amount,
		"status":             params.Status,
		"payment_escrow_id":  params.PaymentEscrowID,
		"payment_release_id": params.PaymentReleaseID,
		"submission_meta":    params.SubmissionMeta,
		"due_date":           params.DueDate,
		"submitted_at":       params.SubmittedAt,
		"approved_at":        params.ApprovedAt,
		"paid_at":            params.PaidAt,
	}

	tag, err := db.Pool.Exec(ctx, sql, args)
	if err != nil {
		r.log.Error("update milestone: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("milestone not found")
	}

	return nil
}

func (r *milestoneRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status models.MilestoneStatus) error {
	sql := `UPDATE milestones SET status = @status, updated_at = NOW() WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "status": status})
	if err != nil {
		r.log.Error("update milestone status: exec failed", err, map[string]any{"id": id, "status": status})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("milestone not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

func (r *milestoneRepo) Delete(ctx context.Context, id uuid.UUID) error {
	sql := `DELETE FROM milestones WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("delete milestone: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("milestone not found")
	}

	return nil
}

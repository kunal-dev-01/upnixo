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

type TaskRepository interface {
	Create(ctx context.Context, t *models.MaintenanceTask) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.MaintenanceTask, error)
	ListBySubscription(ctx context.Context, subID uuid.UUID) ([]models.MaintenanceTask, error)
	ListByClient(ctx context.Context, clientID uuid.UUID) ([]models.MaintenanceTask, error)
	Update(ctx context.Context, id uuid.UUID, params UpdateTaskParams) error
	Delete(ctx context.Context, id uuid.UUID) error

	// specialized
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.TaskStatus) error
	LogHours(ctx context.Context, id uuid.UUID, hours decimal.Decimal) error
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type UpdateTaskParams struct {
	Title          *string
	Description    *string
	Status         *models.TaskStatus
	Priority       *models.TaskPriority
	EstimatedHours *float64
	DueDate        *time.Time
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const taskColumns = `
	id, subscription_id, client_id,
	title, description, status, priority,
	estimated_hours, logged_hours,
	due_date, started_at, completed_at,
	created_at, updated_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type taskRepo struct {
	log *utils.Logger
}

func NewTaskRepository(log *utils.Logger) TaskRepository {
	return &taskRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

func (r *taskRepo) Create(ctx context.Context, t *models.MaintenanceTask) error {
	const sql = `
		INSERT INTO maintenance_tasks (
			subscription_id, client_id, title, description, status, priority, estimated_hours, due_date
		) VALUES (
			@subscription_id, @client_id, @title, @description, @status, @priority, @estimated_hours, @due_date
		)
		RETURNING ` + taskColumns

	args := pgx.NamedArgs{
		"subscription_id": t.SubscriptionID,
		"client_id":       t.ClientID,
		"title":           t.Title,
		"description":     t.Description,
		"status":          t.Status,
		"priority":        t.Priority,
		"estimated_hours": t.EstimatedHours,
		"due_date":        t.DueDate,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		r.log.Error("create task: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.MaintenanceTask])
	if err != nil {
		r.log.Error("create task: scan failed", err, nil)
		return utils.Internal(err)
	}

	*t = res
	return nil
}

func (r *taskRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.MaintenanceTask, error) {
	sql := `SELECT ` + taskColumns + ` FROM maintenance_tasks WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get task by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.MaintenanceTask])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("task not found")
		}
		r.log.Error("get task by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *taskRepo) ListBySubscription(ctx context.Context, subID uuid.UUID) ([]models.MaintenanceTask, error) {
	sql := `SELECT ` + taskColumns + ` FROM maintenance_tasks WHERE subscription_id = @sub_id ORDER BY created_at DESC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"sub_id": subID})
	if err != nil {
		r.log.Error("list tasks by subscription: query failed", err, map[string]any{"sub_id": subID})
		return nil, utils.Internal(err)
	}

	tasks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.MaintenanceTask])
	if err != nil {
		r.log.Error("list tasks by subscription: scan failed", err, map[string]any{"sub_id": subID})
		return nil, utils.Internal(err)
	}

	return tasks, nil
}

func (r *taskRepo) ListByClient(ctx context.Context, clientID uuid.UUID) ([]models.MaintenanceTask, error) {
	sql := `SELECT ` + taskColumns + ` FROM maintenance_tasks WHERE client_id = @client_id ORDER BY created_at DESC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"client_id": clientID})
	if err != nil {
		r.log.Error("list tasks by client: query failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	tasks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.MaintenanceTask])
	if err != nil {
		r.log.Error("list tasks by client: scan failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	return tasks, nil
}

func (r *taskRepo) Update(ctx context.Context, id uuid.UUID, params UpdateTaskParams) error {
	sql := `
		UPDATE maintenance_tasks
		SET title           = COALESCE(@title, title),
			description     = COALESCE(@description, description),
			status          = COALESCE(@status, status),
			priority        = COALESCE(@priority, priority),
			estimated_hours = COALESCE(@estimated_hours, estimated_hours),
			due_date        = COALESCE(@due_date, due_date),
			updated_at      = NOW()
		WHERE id = @id`

	args := pgx.NamedArgs{
		"id":              id,
		"title":           params.Title,
		"description":     params.Description,
		"status":          params.Status,
		"priority":        params.Priority,
		"estimated_hours": params.EstimatedHours,
		"due_date":        params.DueDate,
	}

	tag, err := db.Pool.Exec(ctx, sql, args)
	if err != nil {
		r.log.Error("update task: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("task not found")
	}

	return nil
}

func (r *taskRepo) Delete(ctx context.Context, id uuid.UUID) error {
	sql := `DELETE FROM maintenance_tasks WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("delete task: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("task not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED
// ─────────────────────────────────────────────────────────────────────────────

func (r *taskRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status models.TaskStatus) error {
	// Status transitions can trigger timestamp updates
	sql := `
		UPDATE maintenance_tasks
		SET status       = @status,
			started_at   = CASE 
				WHEN @status = 'in_progress' AND started_at IS NULL THEN NOW() 
				ELSE started_at 
			END,
			completed_at = CASE 
				WHEN @status = 'completed' THEN NOW() 
				WHEN @status != 'completed' THEN NULL 
				ELSE completed_at 
			END,
			updated_at   = NOW()
		WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "status": status})
	if err != nil {
		r.log.Error("update task status: exec failed", err, map[string]any{"id": id, "status": status})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("task not found")
	}

	return nil
}

func (r *taskRepo) LogHours(ctx context.Context, id uuid.UUID, hours decimal.Decimal) error {
	sql := `
		UPDATE maintenance_tasks
		SET logged_hours = logged_hours + @hours,
			updated_at   = NOW()
		WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "hours": hours})
	if err != nil {
		r.log.Error("log hours: exec failed", err, map[string]any{"id": id, "hours": hours})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("task not found")
	}

	return nil
}

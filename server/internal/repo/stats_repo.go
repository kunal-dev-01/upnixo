package repo

import (
	"context"
	"errors"

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

type StatsRepository interface {
	GetByClientID(ctx context.Context, clientID uuid.UUID) (*models.ClientStats, error)
	Initialize(ctx context.Context, clientID uuid.UUID) error

	// Atomic Updates
	UpdateProjectCounters(ctx context.Context, clientID uuid.UUID, activeDelta, completedDelta int32) error
	UpdateTaskCounters(ctx context.Context, clientID uuid.UUID, openDelta, completedDelta int32) error
	UpdateSubscriptionCounter(ctx context.Context, clientID uuid.UUID, delta int32) error
	UpdateFinancials(ctx context.Context, clientID uuid.UUID, spentDelta decimal.Decimal) error
	UpdateActivity(ctx context.Context, clientID uuid.UUID, isLogin bool) error
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const statsColumns = `
	client_id, total_spent,
	active_projects_count, completed_projects_count,
	active_subscriptions_count, open_tasks_count, completed_tasks_count,
	last_login_at, last_activity_at, updated_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type statsRepo struct {
	log *utils.Logger
}

func NewStatsRepository(log *utils.Logger) StatsRepository {
	return &statsRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// READ & INIT
// ─────────────────────────────────────────────────────────────────────────────

func (r *statsRepo) GetByClientID(ctx context.Context, clientID uuid.UUID) (*models.ClientStats, error) {
	sql := `SELECT ` + statsColumns + ` FROM client_stats WHERE client_id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": clientID})
	if err != nil {
		r.log.Error("get client stats: query failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.ClientStats])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("stats not found for client")
		}
		r.log.Error("get client stats: scan failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *statsRepo) Initialize(ctx context.Context, clientID uuid.UUID) error {
	sql := `INSERT INTO client_stats (client_id) VALUES ($1) ON CONFLICT (client_id) DO NOTHING`

	_, err := db.Pool.Exec(ctx, sql, clientID)
	if err != nil {
		r.log.Error("initialize client stats: exec failed", err, map[string]any{"client_id": clientID})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMIC UPDATES
// ─────────────────────────────────────────────────────────────────────────────

func (r *statsRepo) UpdateProjectCounters(ctx context.Context, clientID uuid.UUID, activeDelta, completedDelta int32) error {
	sql := `
		UPDATE client_stats
		SET active_projects_count    = active_projects_count + @active,
			completed_projects_count = completed_projects_count + @completed,
			last_activity_at         = NOW(),
			updated_at               = NOW()
		WHERE client_id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":        clientID,
		"active":    activeDelta,
		"completed": completedDelta,
	})
	if err != nil {
		r.log.Error("update project counters: exec failed", err, map[string]any{"client_id": clientID})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("stats not found")
	}

	return nil
}

func (r *statsRepo) UpdateTaskCounters(ctx context.Context, clientID uuid.UUID, openDelta, completedDelta int32) error {
	sql := `
		UPDATE client_stats
		SET open_tasks_count      = open_tasks_count + @open,
			completed_tasks_count = completed_tasks_count + @completed,
			last_activity_at      = NOW(),
			updated_at            = NOW()
		WHERE client_id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":        clientID,
		"open":      openDelta,
		"completed": completedDelta,
	})
	if err != nil {
		r.log.Error("update task counters: exec failed", err, map[string]any{"client_id": clientID})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("stats not found")
	}

	return nil
}

func (r *statsRepo) UpdateSubscriptionCounter(ctx context.Context, clientID uuid.UUID, delta int32) error {
	sql := `
		UPDATE client_stats
		SET active_subscriptions_count = active_subscriptions_count + @delta,
			last_activity_at           = NOW(),
			updated_at                 = NOW()
		WHERE client_id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":    clientID,
		"delta": delta,
	})
	if err != nil {
		r.log.Error("update subscription counter: exec failed", err, map[string]any{"client_id": clientID})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("stats not found")
	}

	return nil
}

func (r *statsRepo) UpdateFinancials(ctx context.Context, clientID uuid.UUID, spentDelta decimal.Decimal) error {
	sql := `
		UPDATE client_stats
		SET total_spent      = total_spent + @spent,
			last_activity_at = NOW(),
			updated_at       = NOW()
		WHERE client_id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":    clientID,
		"spent": spentDelta,
	})
	if err != nil {
		r.log.Error("update financial stats: exec failed", err, map[string]any{"client_id": clientID})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("stats not found")
	}

	return nil
}

func (r *statsRepo) UpdateActivity(ctx context.Context, clientID uuid.UUID, isLogin bool) error {
	sql := `
		UPDATE client_stats
		SET last_activity_at = NOW(),
			last_login_at    = CASE WHEN @is_login THEN NOW() ELSE last_login_at END,
			updated_at       = NOW()
		WHERE client_id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":       clientID,
		"is_login": isLogin,
	})
	if err != nil {
		r.log.Error("update client activity: exec failed", err, map[string]any{"client_id": clientID})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("stats not found")
	}

	return nil
}

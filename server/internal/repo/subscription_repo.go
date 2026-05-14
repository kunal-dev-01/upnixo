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

type SubscriptionRepository interface {
	// Plans
	CreatePlan(ctx context.Context, p *models.SubscriptionPlan) error
	GetPlanByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionPlan, error)
	GetPlanBySlug(ctx context.Context, slug string) (*models.SubscriptionPlan, error)
	ListActivePlans(ctx context.Context) ([]models.SubscriptionPlan, error)
	UpdatePlan(ctx context.Context, id uuid.UUID, params UpdatePlanParams) error
	DeletePlan(ctx context.Context, id uuid.UUID) error

	// Client Subscriptions
	CreateSubscription(ctx context.Context, s *models.ClientSubscription) error
	GetSubscriptionByID(ctx context.Context, id uuid.UUID) (*models.ClientSubscription, error)
	GetSubscriptionByClientID(ctx context.Context, clientID uuid.UUID) (*models.ClientSubscription, *models.SubscriptionPlan, error)
	UpdateSubscription(ctx context.Context, id uuid.UUID, params UpdateSubscriptionParams) error

	// Maintenance Targets
	CreateTarget(ctx context.Context, t *models.MaintenanceTarget) error
	GetTargetByID(ctx context.Context, id uuid.UUID) (*models.MaintenanceTarget, error)
	ListTargetsBySubscription(ctx context.Context, subID uuid.UUID) ([]models.MaintenanceTarget, error)
	UpdateTarget(ctx context.Context, id uuid.UUID, params UpdateMaintenanceTargetParams) error
	DeleteTarget(ctx context.Context, id uuid.UUID) error
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type UpdatePlanParams struct {
	Name            *string
	Description     *string
	FeaturesList    []byte
	Price           *decimal.Decimal
	Currency        *string
	Cycle           *models.BillingCycle
	PaddleProductID *string
	PaddlePriceID   *string
	IsActive        *bool
	IsFeatured      *bool
}

type UpdateSubscriptionParams struct {
	PlanID             *uuid.UUID
	Status             *models.SubscriptionStatus
	CancelAtPeriodEnd  *bool
	CurrentPeriodStart *time.Time
	CurrentPeriodEnd   *time.Time
	CanceledAt         *time.Time
}

type UpdateMaintenanceTargetParams struct {
	SourceType          *models.TargetSource
	InternalProjectID   *uuid.UUID
	ExternalName        *string
	ExternalLiveURL     *string
	ExternalRepoURL     *string
	TechStackMeta       []byte
	SpecialInstructions *string
	VaultCollectionID   *uuid.UUID
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const planColumns = `
	id, slug, name, description, features_list,
	price, currency, cycle,
	paddle_product_id, paddle_price_id,
	is_active, is_featured,
	created_at, updated_at, deleted_at`

const subscriptionColumns = `
	id, client_id, plan_id, 
	paddle_subscription_id, paddle_customer_id,
	status, cancel_at_period_end, 
	current_period_start, current_period_end, 
	canceled_at, created_at, updated_at`

const targetColumns = `
	id, subscription_id, source_type, internal_project_id,
	external_name, external_live_url, external_repo_url,
	tech_stack_meta, special_instructions, vault_collection_id,
	created_at, updated_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type subscriptionRepo struct {
	log *utils.Logger
}

func NewSubscriptionRepository(log *utils.Logger) SubscriptionRepository {
	return &subscriptionRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *subscriptionRepo) CreatePlan(ctx context.Context, p *models.SubscriptionPlan) error {
	const sql = `
		INSERT INTO subscription_plans (
			slug, name, description, features_list, price, currency, cycle, 
			paddle_product_id, paddle_price_id, is_active, is_featured
		) VALUES (
			@slug, @name, @description, @features_list, @price, @currency, @cycle, 
			@paddle_product_id, @paddle_price_id, @is_active, @is_featured
		)
		RETURNING ` + planColumns

	args := pgx.NamedArgs{
		"slug":              p.Slug,
		"name":              p.Name,
		"description":       p.Description,
		"features_list":     p.FeaturesList,
		"price":             p.Price,
		"currency":          p.Currency,
		"cycle":             p.Cycle,
		"paddle_product_id": p.PaddleProductID,
		"paddle_price_id":   p.PaddlePriceID,
		"is_active":         p.IsActive,
		"is_featured":       p.IsFeatured,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("plan slug already exists")
		}
		r.log.Error("create plan: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.SubscriptionPlan])
	if err != nil {
		r.log.Error("create plan: scan failed", err, nil)
		return utils.Internal(err)
	}

	*p = res
	return nil
}

func (r *subscriptionRepo) GetPlanByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionPlan, error) {
	sql := `SELECT ` + planColumns + ` FROM subscription_plans WHERE id = @id AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get plan by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.SubscriptionPlan])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("plan not found")
		}
		r.log.Error("get plan by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *subscriptionRepo) GetPlanBySlug(ctx context.Context, slug string) (*models.SubscriptionPlan, error) {
	sql := `SELECT ` + planColumns + ` FROM subscription_plans WHERE slug = @slug AND deleted_at IS NULL`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"slug": slug})
	if err != nil {
		r.log.Error("get plan by slug: query failed", err, map[string]any{"slug": slug})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.SubscriptionPlan])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("plan not found")
		}
		r.log.Error("get plan by slug: scan failed", err, map[string]any{"slug": slug})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *subscriptionRepo) ListActivePlans(ctx context.Context) ([]models.SubscriptionPlan, error) {
	sql := `SELECT ` + planColumns + ` FROM subscription_plans WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY price ASC`

	rows, err := db.Pool.Query(ctx, sql, nil)
	if err != nil {
		r.log.Error("list active plans: query failed", err, nil)
		return nil, utils.Internal(err)
	}

	plans, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.SubscriptionPlan])
	if err != nil {
		r.log.Error("list active plans: scan failed", err, nil)
		return nil, utils.Internal(err)
	}

	return plans, nil
}

func (r *subscriptionRepo) UpdatePlan(ctx context.Context, id uuid.UUID, params UpdatePlanParams) error {
	sql := `
		UPDATE subscription_plans
		SET name              = COALESCE(@name, name),
			description       = COALESCE(@description, description),
			features_list     = COALESCE(@features_list, features_list),
			price             = COALESCE(@price, price),
			currency          = COALESCE(@currency, currency),
			cycle             = COALESCE(@cycle, cycle),
			paddle_product_id = COALESCE(@paddle_product_id, paddle_product_id),
			paddle_price_id   = COALESCE(@paddle_price_id, paddle_price_id),
			is_active         = COALESCE(@is_active, is_active),
			is_featured       = COALESCE(@is_featured, is_featured),
			updated_at        = NOW()
		WHERE id = @id AND deleted_at IS NULL`

	args := pgx.NamedArgs{
		"id":                id,
		"name":              params.Name,
		"description":       params.Description,
		"features_list":     params.FeaturesList,
		"price":             params.Price,
		"currency":          params.Currency,
		"cycle":             params.Cycle,
		"paddle_product_id": params.PaddleProductID,
		"paddle_price_id":   params.PaddlePriceID,
		"is_active":         params.IsActive,
		"is_featured":       params.IsFeatured,
	}

	tag, err := db.Pool.Exec(ctx, sql, args)
	if err != nil {
		r.log.Error("update plan: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("plan not found")
	}

	return nil
}

func (r *subscriptionRepo) DeletePlan(ctx context.Context, id uuid.UUID) error {
	sql := `UPDATE subscription_plans SET deleted_at = NOW(), updated_at = NOW() WHERE id = @id AND deleted_at IS NULL`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("delete plan: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("plan not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *subscriptionRepo) CreateSubscription(ctx context.Context, s *models.ClientSubscription) error {
	const sql = `
		INSERT INTO client_subscriptions (
			client_id, plan_id, paddle_subscription_id, paddle_customer_id, 
			status, cancel_at_period_end, current_period_start, current_period_end
		) VALUES (
			@client_id, @plan_id, @paddle_subscription_id, @paddle_customer_id, 
			@status, @cancel_at_period_end, @current_period_start, @current_period_end
		)
		RETURNING ` + subscriptionColumns

	args := pgx.NamedArgs{
		"client_id":              s.ClientID,
		"plan_id":                s.PlanID,
		"paddle_subscription_id": s.PaddleSubscriptionID,
		"paddle_customer_id":     s.PaddleCustomerID,
		"status":                 s.Status,
		"cancel_at_period_end":   s.CancelAtPeriodEnd,
		"current_period_start":   s.CurrentPeriodStart,
		"current_period_end":     s.CurrentPeriodEnd,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("client already has an active subscription")
		}
		r.log.Error("create subscription: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.ClientSubscription])
	if err != nil {
		r.log.Error("create subscription: scan failed", err, nil)
		return utils.Internal(err)
	}

	*s = res
	return nil
}

func (r *subscriptionRepo) GetSubscriptionByID(ctx context.Context, id uuid.UUID) (*models.ClientSubscription, error) {
	sql := `SELECT ` + subscriptionColumns + ` FROM client_subscriptions WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get subscription by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.ClientSubscription])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("subscription not found")
		}
		r.log.Error("get subscription by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *subscriptionRepo) GetSubscriptionByClientID(ctx context.Context, clientID uuid.UUID) (*models.ClientSubscription, *models.SubscriptionPlan, error) {
	// Joining with plans to provide full context
	const sql = `
		SELECT 
			s.id, s.client_id, s.plan_id, s.paddle_subscription_id, s.paddle_customer_id,
			s.status, s.cancel_at_period_end, s.current_period_start, s.current_period_end,
			s.canceled_at, s.created_at, s.updated_at,
			p.id AS plan_id_join, p.slug, p.name, p.description, p.features_list,
			p.price, p.currency, p.cycle, p.is_active, p.is_featured
		FROM client_subscriptions s
		JOIN subscription_plans p ON s.plan_id = p.id
		WHERE s.client_id = @client_id
		ORDER BY s.created_at DESC
		LIMIT 1`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"client_id": clientID})
	if err != nil {
		r.log.Error("get subscription by client: query failed", err, map[string]any{"client_id": clientID})
		return nil, nil, utils.Internal(err)
	}

	// We need a helper struct to scan the joined results
	type joinedSub struct {
		models.ClientSubscription
		Plan models.SubscriptionPlan `db:"plan_id_join=id"`
	}

	res, err := pgx.CollectOneRow(rows, func(row pgx.CollectableRow) (joinedSub, error) {
		// Manual scanning or use a custom helper if available. 
		// Since RowToStructByName might not handle the nested mapping easily without more complex tags, 
		// let's use a simpler approach or assume the user has a way.
		// For now, let's just fetch them as two separate structs manually if needed, 
		// but RowToStructByName can work if we alias columns properly.
		var js joinedSub
		err := row.Scan(
			&js.ID, &js.ClientID, &js.PlanID, &js.PaddleSubscriptionID, &js.PaddleCustomerID,
			&js.Status, &js.CancelAtPeriodEnd, &js.CurrentPeriodStart, &js.CurrentPeriodEnd,
			&js.CanceledAt, &js.CreatedAt, &js.UpdatedAt,
			&js.Plan.ID, &js.Plan.Slug, &js.Plan.Name, &js.Plan.Description, &js.Plan.FeaturesList,
			&js.Plan.Price, &js.Plan.Currency, &js.Plan.Cycle, &js.Plan.IsActive, &js.Plan.IsFeatured,
		)
		return js, err
	})

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, utils.NotFound("no subscription found for client")
		}
		r.log.Error("get subscription by client: scan failed", err, map[string]any{"client_id": clientID})
		return nil, nil, utils.Internal(err)
	}

	return &res.ClientSubscription, &res.Plan, nil
}

func (r *subscriptionRepo) UpdateSubscription(ctx context.Context, id uuid.UUID, params UpdateSubscriptionParams) error {
	sql := `
		UPDATE client_subscriptions
		SET plan_id                = COALESCE(@plan_id, plan_id),
			status                 = COALESCE(@status, status),
			cancel_at_period_end   = COALESCE(@cancel_at_period_end, cancel_at_period_end),
			current_period_start   = COALESCE(@current_period_start, current_period_start),
			current_period_end     = COALESCE(@current_period_end, current_period_end),
			canceled_at            = COALESCE(@canceled_at, canceled_at),
			updated_at             = NOW()
		WHERE id = @id`

	args := pgx.NamedArgs{
		"id":                   id,
		"plan_id":              params.PlanID,
		"status":               params.Status,
		"cancel_at_period_end": params.CancelAtPeriodEnd,
		"current_period_start": params.CurrentPeriodStart,
		"current_period_end":   params.CurrentPeriodEnd,
		"canceled_at":          params.CanceledAt,
	}

	tag, err := db.Pool.Exec(ctx, sql, args)
	if err != nil {
		r.log.Error("update subscription: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("subscription not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE TARGET METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *subscriptionRepo) CreateTarget(ctx context.Context, t *models.MaintenanceTarget) error {
	const sql = `
		INSERT INTO maintenance_targets (
			subscription_id, source_type, internal_project_id, 
			external_name, external_live_url, external_repo_url, 
			tech_stack_meta, special_instructions, vault_collection_id
		) VALUES (
			@subscription_id, @source_type, @internal_project_id, 
			@external_name, @external_live_url, @external_repo_url, 
			@tech_stack_meta, @special_instructions, @vault_collection_id
		)
		RETURNING ` + targetColumns

	args := pgx.NamedArgs{
		"subscription_id":      t.SubscriptionID,
		"source_type":          t.SourceType,
		"internal_project_id":  t.InternalProjectID,
		"external_name":        t.ExternalName,
		"external_live_url":    t.ExternalLiveURL,
		"external_repo_url":    t.ExternalRepoURL,
		"tech_stack_meta":      t.TechStackMeta,
		"special_instructions": t.SpecialInstructions,
		"vault_collection_id":  t.VaultCollectionID,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		r.log.Error("create maintenance target: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.MaintenanceTarget])
	if err != nil {
		r.log.Error("create maintenance target: scan failed", err, nil)
		return utils.Internal(err)
	}

	*t = res
	return nil
}

func (r *subscriptionRepo) GetTargetByID(ctx context.Context, id uuid.UUID) (*models.MaintenanceTarget, error) {
	sql := `SELECT ` + targetColumns + ` FROM maintenance_targets WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get maintenance target: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.MaintenanceTarget])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("maintenance target not found")
		}
		r.log.Error("get maintenance target: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *subscriptionRepo) ListTargetsBySubscription(ctx context.Context, subID uuid.UUID) ([]models.MaintenanceTarget, error) {
	sql := `SELECT ` + targetColumns + ` FROM maintenance_targets WHERE subscription_id = @sub_id ORDER BY created_at ASC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"sub_id": subID})
	if err != nil {
		r.log.Error("list maintenance targets: query failed", err, map[string]any{"subscription_id": subID})
		return nil, utils.Internal(err)
	}

	targets, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.MaintenanceTarget])
	if err != nil {
		r.log.Error("list maintenance targets: scan failed", err, map[string]any{"subscription_id": subID})
		return nil, utils.Internal(err)
	}

	return targets, nil
}

func (r *subscriptionRepo) UpdateTarget(ctx context.Context, id uuid.UUID, params UpdateMaintenanceTargetParams) error {
	sql := `
		UPDATE maintenance_targets
		SET source_type          = COALESCE(@source_type, source_type),
			internal_project_id  = COALESCE(@internal_project_id, internal_project_id),
			external_name        = COALESCE(@external_name, external_name),
			external_live_url    = COALESCE(@external_live_url, external_live_url),
			external_repo_url    = COALESCE(@external_repo_url, external_repo_url),
			tech_stack_meta      = COALESCE(@tech_stack_meta, tech_stack_meta),
			special_instructions = COALESCE(@special_instructions, special_instructions),
			vault_collection_id  = COALESCE(@vault_collection_id, vault_collection_id),
			updated_at           = NOW()
		WHERE id = @id`

	args := pgx.NamedArgs{
		"id":                   id,
		"source_type":          params.SourceType,
		"internal_project_id":  params.InternalProjectID,
		"external_name":        params.ExternalName,
		"external_live_url":    params.ExternalLiveURL,
		"external_repo_url":    params.ExternalRepoURL,
		"tech_stack_meta":      params.TechStackMeta,
		"special_instructions": params.SpecialInstructions,
		"vault_collection_id":  params.VaultCollectionID,
	}

	tag, err := db.Pool.Exec(ctx, sql, args)
	if err != nil {
		r.log.Error("update maintenance target: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("maintenance target not found")
	}

	return nil
}

func (r *subscriptionRepo) DeleteTarget(ctx context.Context, id uuid.UUID) error {
	sql := `DELETE FROM maintenance_targets WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("delete maintenance target: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("maintenance target not found")
	}

	return nil
}

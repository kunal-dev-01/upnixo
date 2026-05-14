package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PLAN ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type BillingCycle string

const (
	BillingCycleWeekly    BillingCycle = "weekly"
	BillingCycleMonthly   BillingCycle = "monthly"
	BillingCycleQuarterly BillingCycle = "quarterly"
	BillingCycleYearly    BillingCycle = "yearly"
)

func (c BillingCycle) IsValid() bool {
	switch c {
	case BillingCycleWeekly, BillingCycleMonthly, BillingCycleQuarterly, BillingCycleYearly:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PLAN
// ─────────────────────────────────────────────────────────────────────────────

type SubscriptionPlan struct {
	ID   uuid.UUID `db:"id"   json:"id"`
	Slug string    `db:"slug" json:"slug"`

	Name         string      `db:"name"          json:"name"`
	Description  pgtype.Text `db:"description"   json:"description"`
	FeaturesList []byte      `db:"features_list" json:"features_list"`

	Price    decimal.Decimal `db:"price"    json:"price"`
	Currency string          `db:"currency" json:"currency"`
	Cycle    BillingCycle    `db:"cycle"    json:"cycle"`

	PaddleProductID pgtype.Text `db:"paddle_product_id" json:"paddle_product_id"`
	PaddlePriceID   pgtype.Text `db:"paddle_price_id"   json:"paddle_price_id"`

	IsActive   bool `db:"is_active"   json:"is_active"`
	IsFeatured bool `db:"is_featured" json:"is_featured"`

	CreatedAt time.Time          `db:"created_at" json:"created_at"`
	UpdatedAt time.Time          `db:"updated_at" json:"updated_at"`
	DeletedAt pgtype.Timestamptz `db:"deleted_at" json:"-"`
}

func (p *SubscriptionPlan) IsDeleted() bool { return p.DeletedAt.Valid }

type SafeSubscriptionPlan struct {
	ID           uuid.UUID       `json:"id"`
	Slug         string          `json:"slug"`
	Name         string          `json:"name"`
	Description  *string         `json:"description,omitempty"`
	FeaturesList []string        `json:"features_list"`
	Price        decimal.Decimal `json:"price"`
	Currency     string          `json:"currency"`
	Cycle        BillingCycle    `json:"cycle"`
	IsFeatured   bool            `json:"is_featured"`
}

func (p *SubscriptionPlan) ToSafe() SafeSubscriptionPlan {
	s := SafeSubscriptionPlan{
		ID:         p.ID,
		Slug:       p.Slug,
		Name:       p.Name,
		Price:      p.Price,
		Currency:   p.Currency,
		Cycle:      p.Cycle,
		IsFeatured: p.IsFeatured,
	}

	if p.Description.Valid {
		s.Description = &p.Description.String
	}

	if len(p.FeaturesList) > 0 {
		_ = json.Unmarshal(p.FeaturesList, &s.FeaturesList)
	}

	return s
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT SUBSCRIPTION ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "active"
	SubscriptionStatusPastDue  SubscriptionStatus = "past_due"
	SubscriptionStatusPaused   SubscriptionStatus = "paused"
	SubscriptionStatusCanceled SubscriptionStatus = "canceled"
)

func (s SubscriptionStatus) IsValid() bool {
	switch s {
	case SubscriptionStatusActive, SubscriptionStatusPastDue,
		SubscriptionStatusPaused, SubscriptionStatusCanceled:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

type ClientSubscription struct {
	ID       uuid.UUID `db:"id"        json:"id"`
	ClientID uuid.UUID `db:"client_id" json:"client_id"`
	PlanID   uuid.UUID `db:"plan_id"   json:"plan_id"`

	PaddleSubscriptionID string `db:"paddle_subscription_id" json:"paddle_subscription_id"`
	PaddleCustomerID     string `db:"paddle_customer_id"     json:"paddle_customer_id"`

	Status             SubscriptionStatus `db:"status"               json:"status"`
	CancelAtPeriodEnd  bool               `db:"cancel_at_period_end" json:"cancel_at_period_end"`
	CurrentPeriodStart time.Time          `db:"current_period_start" json:"current_period_start"`
	CurrentPeriodEnd   time.Time          `db:"current_period_end"   json:"current_period_end"`

	CanceledAt pgtype.Timestamptz `db:"canceled_at" json:"canceled_at"`
	CreatedAt  time.Time          `db:"created_at"  json:"created_at"`
	UpdatedAt  time.Time          `db:"updated_at"  json:"updated_at"`
}

type SafeClientSubscription struct {
	ID                 uuid.UUID          `json:"id"`
	Status             SubscriptionStatus `json:"status"`
	CurrentPeriodEnd   time.Time          `json:"current_period_end"`
	CancelAtPeriodEnd  bool               `json:"cancel_at_period_end"`
	Plan               *SafeSubscriptionPlan `json:"plan,omitempty"`
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE TARGET ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type TargetSource string

const (
	TargetSourceInternalProject TargetSource = "internal_project"
	TargetSourceExternalSystem  TargetSource = "external_system"
)

func (s TargetSource) IsValid() bool {
	switch s {
	case TargetSourceInternalProject, TargetSourceExternalSystem:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE TARGET
// ─────────────────────────────────────────────────────────────────────────────

type MaintenanceTarget struct {
	ID             uuid.UUID `db:"id"              json:"id"`
	SubscriptionID uuid.UUID `db:"subscription_id" json:"subscription_id"`

	SourceType TargetSource `db:"source_type" json:"source_type"`

	InternalProjectID pgtype.UUID `db:"internal_project_id" json:"internal_project_id"`

	ExternalName    pgtype.Text `db:"external_name"     json:"external_name"`
	ExternalLiveURL pgtype.Text `db:"external_live_url" json:"external_live_url"`
	ExternalRepoURL pgtype.Text `db:"external_repo_url" json:"external_repo_url"`

	TechStackMeta      []byte      `db:"tech_stack_meta"      json:"tech_stack_meta"`
	SpecialInstructions pgtype.Text `db:"special_instructions" json:"special_instructions"`

	VaultCollectionID pgtype.UUID `db:"vault_collection_id" json:"vault_collection_id"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

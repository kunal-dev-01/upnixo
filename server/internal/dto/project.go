package dto

import (
	"server/internal/models"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

type CreateProjectRequest struct {
	FreelancerID uuid.UUID       `json:"freelancer_id" validate:"required"`
	Title        string          `json:"title"         validate:"required,min=3,max=200"`
	Description  string          `json:"description"   validate:"required,min=10"`
	Budget       decimal.Decimal `json:"budget"        validate:"required,d_gt_zero"`
	Currency     string          `json:"currency"      validate:"required,len=3"`
	Priority     int16           `json:"priority"      validate:"i_gte=0,i_lte=2"`
	DeadlineAt   *time.Time      `json:"deadline_at"   validate:"omitempty"`
}

type UpdateProjectRequest struct {
	Title         *string               `json:"title"          validate:"omitempty,min=3,max=200"`
	Description   *string               `json:"description"    validate:"omitempty,min=10"`
	Budget        *decimal.Decimal      `json:"budget"         validate:"omitempty,d_gt_zero"`
	Currency      *string               `json:"currency"       validate:"omitempty,len=3"`
	Status        *models.ProjectStatus `json:"status"         validate:"omitempty"`
	Priority      *int16                `json:"priority"       validate:"omitempty,i_gte=0,i_lte=2"`
	RepositoryURL *string               `json:"repository_url" validate:"omitempty,url"`
	DeadlineAt    *time.Time            `json:"deadline_at"    validate:"omitempty"`
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

type ProjectResponse struct {
	models.SafeProject
	FreelancerID uuid.UUID `json:"freelancer_id"`
	ClientID     uuid.UUID `json:"client_id"`
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY & FILTER
// ─────────────────────────────────────────────────────────────────────────────

type ProjectFilter struct {
	Status   *models.ProjectStatus `query:"status"`
	Priority *int16                `query:"priority"`
	Currency *string               `query:"currency"`
}

type PaginationQuery struct {
	Page int `query:"page" validate:"omitempty,min=1"`
	Size int `query:"size" validate:"omitempty,min=1,max=100"`
}

func (p *PaginationQuery) GetLimit() int {
	if p.Size <= 0 {
		return 20
	}
	return p.Size
}

func (p *PaginationQuery) GetOffset() int {
	if p.Page <= 1 {
		return 0
	}
	return (p.Page - 1) * p.GetLimit()
}

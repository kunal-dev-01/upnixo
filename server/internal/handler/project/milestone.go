package handler

import (
	"server/internal/dto"
	"server/internal/middleware"
	"server/internal/models"
	"server/internal/service/project"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MilestoneHandler struct {
	svc *service.MilestoneService
}

func NewMilestoneHandler(svc *service.MilestoneService) *MilestoneHandler {
	return &MilestoneHandler{svc: svc}
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

func (h *MilestoneHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateMilestoneRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	milestone, err := h.svc.Create(c.Context(), req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "milestone created successfully",
		"data":    milestone,
	})
}

func (h *MilestoneHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.BadRequest("invalid milestone id")
	}

	var req dto.UpdateMilestoneRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	if err := h.svc.Update(c.Context(), id, req); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "milestone updated successfully",
	})
}

func (h *MilestoneHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.BadRequest("invalid milestone id")
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "milestone deleted successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

func (h *MilestoneHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.BadRequest("invalid milestone id")
	}

	userID, _ := middleware.GetUserID(c) // Use internal helper to get UUID
	isAdmin := middleware.IsAdmin(c)

	milestone, err := h.svc.GetByID(c.Context(), id, userID, isAdmin)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    milestone.ToSafe(),
	})
}

func (h *MilestoneHandler) ListByProject(c *fiber.Ctx) error {
	projectIDStr := c.Params("project_id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		return utils.BadRequest("invalid project id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	milestones, err := h.svc.ListByProject(c.Context(), projectID, userID, isAdmin)
	if err != nil {
		return err
	}

	safeMilestones := make([]models.SafeMilestone, 0, len(milestones))
	for _, m := range milestones {
		safeMilestones = append(safeMilestones, m.ToSafe())
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    safeMilestones,
	})
}

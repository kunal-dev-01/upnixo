package handler

import (
	"server/internal/dto"
	"server/internal/middleware"
	"server/internal/service/project"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ProjectHandler struct {
	svc *service.ProjectService
}

func NewProjectHandler(svc *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{svc: svc}
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

func (h *ProjectHandler) Create(c *fiber.Ctx) error {
	clientID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var req dto.CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}

	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	project, err := h.svc.Create(c.Context(), clientID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "project created successfully",
		"data":    project,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

func (h *ProjectHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.BadRequest("invalid project id")
	}

	project, err := h.svc.GetByID(c.Context(), id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    project.ToSafe(),
	})
}

func (h *ProjectHandler) GetBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return utils.BadRequest("slug is required")
	}

	project, err := h.svc.GetBySlug(c.Context(), slug)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    project.ToSafe(),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

func (h *ProjectHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.BadRequest("invalid project id")
	}

	var req dto.UpdateProjectRequest
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
		"message": "project updated successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

func (h *ProjectHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.BadRequest("invalid project id")
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "project deleted successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTING
// ─────────────────────────────────────────────────────────────────────────────

func (h *ProjectHandler) ListByClient(c *fiber.Ctx) error {
	clientID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var filter dto.ProjectFilter
	var pag dto.PaginationQuery

	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequest("invalid filter parameters")
	}
	if err := c.QueryParser(&pag); err != nil {
		return utils.BadRequest("invalid pagination parameters")
	}

	if err := utils.ValidateStructToAppError(&pag); err != nil {
		return err
	}

	projects, err := h.svc.ListByClient(c.Context(), clientID, filter, pag)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    projects,
	})
}

func (h *ProjectHandler) ListByFreelancer(c *fiber.Ctx) error {
	freelancerID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var filter dto.ProjectFilter
	var pag dto.PaginationQuery

	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequest("invalid filter parameters")
	}
	if err := c.QueryParser(&pag); err != nil {
		return utils.BadRequest("invalid pagination parameters")
	}

	if err := utils.ValidateStructToAppError(&pag); err != nil {
		return err
	}

	projects, err := h.svc.ListByFreelancer(c.Context(), freelancerID, filter, pag)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    projects,
	})
}

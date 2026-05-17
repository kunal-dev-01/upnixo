package vault

import (
	"server/internal/dto"
	"server/internal/middleware"
	vaultSvc "server/internal/service/vault"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type VaultHandler struct {
	svc *vaultSvc.VaultService
}

func NewVaultHandler(svc *vaultSvc.VaultService) *VaultHandler {
	return &VaultHandler{svc: svc}
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// ─────────────────────────────────────────────────────────────────────────────

func (h *VaultHandler) CreateCollection(c *fiber.Ctx) error {
	var req dto.CreateVaultCollectionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}
	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	res, err := h.svc.CreateCollection(c.Context(), userID, req, isAdmin)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "vault collection created",
		"data":    res,
	})
}

func (h *VaultHandler) GetCollection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequest("invalid collection id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	res, err := h.svc.GetCollectionByID(c.Context(), id, userID, isAdmin)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    res,
	})
}

func (h *VaultHandler) ListCollectionsByProject(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("project_id"))
	if err != nil {
		return utils.BadRequest("invalid project id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	res, err := h.svc.ListCollectionsByProject(c.Context(), projectID, userID, isAdmin)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    res,
	})
}

func (h *VaultHandler) UpdateCollection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequest("invalid collection id")
	}

	var req dto.UpdateVaultCollectionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}
	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	if err := h.svc.UpdateCollection(c.Context(), id, userID, req, isAdmin); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    nil,
	})
}

func (h *VaultHandler) DeleteCollection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequest("invalid collection id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	if err := h.svc.DeleteCollection(c.Context(), id, userID, isAdmin); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    nil,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────────────────────────────────────

func (h *VaultHandler) CreateItem(c *fiber.Ctx) error {
	var req dto.CreateVaultItemRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}
	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	res, err := h.svc.CreateItem(c.Context(), userID, req, isAdmin)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "vault item created",
		"data":    res,
	})
}

func (h *VaultHandler) GetItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequest("invalid item id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	res, err := h.svc.GetItemByID(c.Context(), id, userID, isAdmin)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    res,
	})
}

func (h *VaultHandler) ListItemsByCollection(c *fiber.Ctx) error {
	collectionID, err := uuid.Parse(c.Params("collection_id"))
	if err != nil {
		return utils.BadRequest("invalid collection id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	res, err := h.svc.ListItemsByCollection(c.Context(), collectionID, userID, isAdmin)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    res,
	})
}

func (h *VaultHandler) UpdateItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequest("invalid item id")
	}

	var req dto.UpdateVaultItemRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}
	if err := utils.ValidateStructToAppError(&req); err != nil {
		return err
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	if err := h.svc.UpdateItem(c.Context(), id, userID, req, isAdmin); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    nil,
	})
}

func (h *VaultHandler) DeleteItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequest("invalid item id")
	}

	userID, _ := middleware.GetUserID(c)
	isAdmin := middleware.IsAdmin(c)

	if err := h.svc.DeleteItem(c.Context(), id, userID, isAdmin); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    nil,
	})
}

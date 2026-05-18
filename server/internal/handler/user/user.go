package handler

import (
	"server/internal/dto"
	"server/internal/middleware"
	"server/internal/repo"
	"server/internal/service/user"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserHandler struct {
	userSvc *service.UserService
}

func NewUserHandler(userSvc *service.UserService) *UserHandler {
	return &UserHandler{
		userSvc: userSvc,
	}
}

// GetMe returns the authenticated user's own profile
// GET /api/v1/auth/user/me
func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	user, err := h.userSvc.GetMe(c.Context(), userID)
	if err != nil {
		return err
	}

	return c.JSON(user)
}

// GetByID returns a user profile by UUID
// GET /api/v1/auth/user/:id
func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.BadRequest("invalid user id format")
	}

	user, err := h.userSvc.GetByID(c.Context(), id)
	if err != nil {
		return err
	}

	return c.JSON(user)
}

// GetByEmail returns a user profile by email address
// GET /api/v1/auth/user/email/:email
func (h *UserHandler) GetByEmail(c *fiber.Ctx) error {
	email := c.Params("email")
	if email == "" {
		return utils.BadRequest("email is required")
	}

	user, err := h.userSvc.GetByEmail(c.Context(), email)
	if err != nil {
		return err
	}

	return c.JSON(user)
}

// ListUsers returns a paginated and filtered list of all clients/users (admin only).
// GET /api/v1/auth/admin/users
func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	var query dto.ListUsersQuery
	if err := c.QueryParser(&query); err != nil {
		return utils.BadRequest("invalid query parameters")
	}

	// Set default pagination values
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.Limit <= 0 {
		query.Limit = 10
	} else if query.Limit > 100 {
		query.Limit = 100
	}

	offset := (query.Page - 1) * query.Limit

	params := repo.ListUsersParams{
		Search:        query.Search,
		Status:        query.Status,
		IsActive:      query.IsActive,
		IsBlocked:     query.IsBlocked,
		EmailVerified: query.EmailVerified,
		Limit:         query.Limit,
		Offset:        offset,
	}

	users, total, err := h.userSvc.ListUsers(c.Context(), params)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"users":   users,
		"total":   total,
		"page":    query.Page,
		"limit":   query.Limit,
	})
}

// BlockUser blocks a user with a reason and revokes all active sessions (admin only).
// POST /api/v1/auth/admin/users/:id/block
func (h *UserHandler) BlockUser(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.BadRequest("invalid user id format")
	}

	var req dto.BlockUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}

	err = h.userSvc.BlockUser(c.Context(), id, true, req.Reason)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "user successfully blocked and all active sessions revoked",
	})
}

// UnblockUser unblocks a user (admin only).
// POST /api/v1/auth/admin/users/:id/unblock
func (h *UserHandler) UnblockUser(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.BadRequest("invalid user id format")
	}

	err = h.userSvc.BlockUser(c.Context(), id, false, nil)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "user successfully unblocked",
	})
}


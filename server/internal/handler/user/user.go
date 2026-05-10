package handler

import (
	"server/internal/middleware"
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

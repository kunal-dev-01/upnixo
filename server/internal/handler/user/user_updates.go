package handler

import (
	"server/internal/dto"
	"server/internal/middleware"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// UpdateProfile handles updating the user's basic profile
// PATCH /api/v1/auth/user/profile
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}

	// Validation can be added here if needed

	data, err := h.userSvc.UpdateProfile(c.Context(), userID, req)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "profile updated successfully",
		"data":    data,
	})
}

// UpdatePreferences handles updating the user's application preferences
// PATCH /api/v1/auth/user/preferences
func (h *UserHandler) UpdatePreferences(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	var req dto.UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest("invalid request body")
	}

	data, err := h.userSvc.UpdatePreferences(c.Context(), userID, req)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "preferences updated successfully",
		"data":    data,
	})
}

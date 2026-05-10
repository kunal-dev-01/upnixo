package handler

import (
	"server/internal/middleware"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// UpdateAvatar handles user avatar upload
// POST /api/v1/auth/user/avatar
func (h *UserHandler) UpdateAvatar(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.Unauthorized("authentication required")
	}

	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		return utils.BadRequest("avatar file is required")
	}

	// Max 5MB
	if fileHeader.Size > 5*1024*1024 {
		return utils.BadRequest("file size too large (max 5MB)")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return utils.Internal(err)
	}
	defer file.Close()

	if err := h.userSvc.UpdateAvatar(c.Context(), userID, file, fileHeader.Filename); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "avatar is being processed",
	})
}

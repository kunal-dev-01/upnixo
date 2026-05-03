package middleware

import (
	"errors"
	"net/http"

	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// FiberErrorHandler is the centralized error handler for all Fiber routes.
// Register via: app.Config.ErrorHandler = middleware.FiberErrorHandler
func FiberErrorHandler(c *fiber.Ctx, err error) error {
	code, message, fields := parseError(err)

	logError(c, err, code)

	return c.Status(code).JSON(buildResponse(code, message, fields))
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// parseError extracts status code, message, and validation fields from any error type.
func parseError(err error) (code int, message string, fields map[string]string) {
	var appErr *utils.AppError
	if errors.As(err, &appErr) {
		return appErr.Code, appErr.Message, appErr.Fields
	}

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return fiberErr.Code, fiberErr.Message, nil
	}

	return http.StatusInternalServerError, "something went wrong", nil
}

// logError logs at the appropriate level based on status code.
func logError(c *fiber.Ctx, err error, code int) {
	log := utils.Get().WithFiberCtx(c)

	var appErr *utils.AppError
	if errors.As(err, &appErr) {
		if code >= 500 {
			// 5xx — log internal cause for server-side debugging
			log.Error().Err(appErr.Err).Msg("internal app error")
		} else {
			// 4xx — client error, log message only (Err is usually nil here)
			log.Warn().Str("error", appErr.Message).Msg("client request error")
		}
		return
	}

	// Unhandled error type — always log at error level
	log.Error().Err(err).Msg("unhandled server error")
}

// buildResponse constructs the standard JSON error response.
func buildResponse(code int, message string, fields map[string]string) fiber.Map {
	errBody := fiber.Map{
		"code":    code,
		"message": message,
	}

	if len(fields) > 0 {
		errBody["fields"] = fields
	}

	return fiber.Map{
		"success": false,
		"error":   errBody,
	}
}

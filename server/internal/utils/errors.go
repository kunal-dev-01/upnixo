package utils

import (
	"fmt"
	"net/http"
)

// ─────────────────────────────────────────────────────────────────────────────
// APP ERROR
// ─────────────────────────────────────────────────────────────────────────────

type AppError struct {
	Code    int               `json:"code"`
	Message string            `json:"message"`
	Err     error             `json:"-"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTORS
// ─────────────────────────────────────────────────────────────────────────────

// New creates a client-safe error with no internal cause.
func New(code int, message string) *AppError {
	return &AppError{Code: code, Message: message}
}

// Wrap creates an error that hides the internal cause from the client.
func Wrap(err error, code int, message string) *AppError {
	return &AppError{Code: code, Message: message, Err: err}
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTCUTS
// ─────────────────────────────────────────────────────────────────────────────

func BadRequest(message string) *AppError {
	return New(http.StatusBadRequest, message)
}

func Validation(message string, fields map[string]string) *AppError {
	return &AppError{
		Code:    http.StatusBadRequest,
		Message: message,
		Fields:  fields,
	}
}

func Unauthorized(message string) *AppError {
	return New(http.StatusUnauthorized, message)
}

func Forbidden(message string) *AppError {
	return New(http.StatusForbidden, message)
}

func NotFound(message string) *AppError {
	return New(http.StatusNotFound, message)
}

func Conflict(message string) *AppError {
	return New(http.StatusConflict, message)
}

func Unprocessable(message string) *AppError {
	return New(http.StatusUnprocessableEntity, message)
}

func TooManyRequests(message string) *AppError {
	return New(http.StatusTooManyRequests, message)
}

// Internal wraps a server-side error. Message is generic — real cause is
// only logged server-side, never sent to the client.
func Internal(err error) *AppError {
	return Wrap(err, http.StatusInternalServerError, "something went wrong, please try again later")
}
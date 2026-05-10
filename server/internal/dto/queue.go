package dto

import "github.com/google/uuid"

type AvatarProcessingJob struct {
	UserID   uuid.UUID `json:"user_id"`
	FilePath string    `json:"file_path"` // Path to temporary file
	OldURL   *string   `json:"old_url"`   // To delete after successful update
}

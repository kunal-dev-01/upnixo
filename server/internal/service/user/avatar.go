package service

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"server/internal/dto"
	"server/internal/utils"
	"strings"
	"time"

	"github.com/google/uuid"
)

// UpdateAvatar handles the initial upload and queues the processing
func (s *UserService) UpdateAvatar(ctx context.Context, userID uuid.UUID, file io.Reader, filename string) error {
	// 1. Validate format
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return utils.BadRequest("only jpg, png and webp formats are supported")
	}

	// 2. Create temporary file
	tempDir := s.cfg.App.TempStoragePath
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return utils.Internal(err)
	}

	tempFileName := fmt.Sprintf("avatar_%s_%d%s", userID.String(), time.Now().Unix(), ext)
	tempPath := filepath.Join(tempDir, tempFileName)

	out, err := os.Create(tempPath)
	if err != nil {
		return utils.Internal(err)
	}
	
	keepFile := false
	defer func() {
		out.Close()
		if !keepFile {
			os.Remove(tempPath)
		}
	}()

	if _, err := io.Copy(out, file); err != nil {
		return utils.Internal(err)
	}

	// 3. Get old avatar URL to delete later
	user, _, err := s.authRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// 4. Publish to RabbitMQ
	var oldURL *string
	if user.AvatarURL.Valid {
		oldURL = &user.AvatarURL.String
	}

	job := dto.AvatarProcessingJob{
		UserID:   userID,
		FilePath: tempPath,
		OldURL:   oldURL,
	}

	if err := s.queue.Publish(s.cfg.RabbitMQ.AvatarQueue, job); err != nil {
		return err
	}

	keepFile = true
	return nil
}

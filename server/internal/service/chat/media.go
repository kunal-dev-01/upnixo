package service

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"server/internal/config"
	"server/internal/queue"
	"server/internal/service/storage"
	"server/internal/utils"
	"strings"

	"github.com/disintegration/imaging"
)

type MediaService struct {
	cfg   *config.Config
	r2    *storage.R2Service
	queue *queue.Manager
	log   *utils.Logger
}

func NewMediaService(cfg *config.Config, r2 *storage.R2Service, q *queue.Manager, log *utils.Logger) *MediaService {
	return &MediaService{cfg: cfg, r2: r2, queue: q, log: log}
}

// MediaTask represents the payload for the media processing queue
type MediaTask struct {
	Key      string `json:"key"`
	RoomID   string `json:"room_id"`
	MsgID    string `json:"msg_id"`
	Ext      string `json:"ext"`
	MimeType string `json:"mime_type"`
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD & DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

// UploadAndProcess handles the initial upload and decides if background optimization is needed.
func (s *MediaService) UploadAndProcess(ctx context.Context, roomID, msgID string, filename string, body io.ReadSeeker, contentType string) (string, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	key := fmt.Sprintf("chats/%s/%s%s", roomID, msgID, ext)

	// 1. Initial Upload to R2
	url, err := s.r2.Upload(ctx, key, body, contentType)
	if err != nil {
		return "", err
	}

	// 2. Check if optimization is needed (JPG/PNG only)
	if s.isOptimizationRequired(ext) {
		if err := s.dispatchOptimizationTask(ctx, MediaTask{
			Key:      key,
			RoomID:   roomID,
			MsgID:    msgID,
			Ext:      ext,
			MimeType: contentType,
		}); err != nil {
			// Log error but don't fail the upload — the original is already in R2
			s.log.Warn("failed to dispatch media optimization task", map[string]any{
				"msg_id": msgID,
				"error":  err.Error(),
			})
		}
	}

	return url, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMIZATION LOGIC (Called by Worker)
// ─────────────────────────────────────────────────────────────────────────────

// OptimizeImage performs the actual compression.
func (s *MediaService) OptimizeImage(ctx context.Context, task MediaTask) error {
	// 1. Create temporary directory if not exists
	tempDir := s.cfg.App.TempStoragePath
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}

	// 2. Download original from R2
	reader, err := s.r2.Download(ctx, task.Key)
	if err != nil {
		return err
	}
	defer reader.Close()

	localOriginal := filepath.Join(tempDir, task.MsgID+"_orig"+task.Ext)
	outOriginal, err := os.Create(localOriginal)
	if err != nil {
		return err
	}
	defer os.Remove(localOriginal)

	if _, err := io.Copy(outOriginal, reader); err != nil {
		outOriginal.Close()
		return err
	}
	outOriginal.Close()

	// 3. Compress using imaging
	src, err := imaging.Open(localOriginal)
	if err != nil {
		return fmt.Errorf("failed to open image for processing: %w", err)
	}

	localOptimized := filepath.Join(tempDir, task.MsgID+"_opt"+task.Ext)

	// Set compression options based on format
	var opts []imaging.EncodeOption
	switch task.Ext {
	case ".jpg", ".jpeg":
		opts = append(opts, imaging.JPEGQuality(75))
	case ".png":
		opts = append(opts, imaging.PNGCompressionLevel(3)) // Default is 0 (Fastest) to 9 (Best)
	}

	err = imaging.Save(src, localOptimized, opts...)
	if err != nil {
		return fmt.Errorf("failed to save optimized image: %w", err)
	}
	defer os.Remove(localOptimized)

	// 4. Upload optimized version back to R2 (overwriting original or using new key)
	// User said "compress nahi karenge" for webp/avif but for jpg/png we replace original or keep original?
	// Usually, replacing original is better for chat to keep URLs consistent, or use a suffix.
	// Let's replace the original key to keep the message URL valid.
	optFile, err := os.Open(localOptimized)
	if err != nil {
		return err
	}
	defer optFile.Close()

	_, err = s.r2.Upload(ctx, task.Key, optFile, task.MimeType)
	if err != nil {
		return fmt.Errorf("failed to upload optimized image: %w", err)
	}

	s.log.Info("media optimization complete", map[string]any{
		"msg_id": task.MsgID,
		"key":    task.Key,
	})

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

func (s *MediaService) isOptimizationRequired(ext string) bool {
	ext = strings.ToLower(ext)
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png"
}

func (s *MediaService) dispatchOptimizationTask(ctx context.Context, task MediaTask) error {
	return s.queue.Publish(s.cfg.RabbitMQ.MediaQueue, task)
}

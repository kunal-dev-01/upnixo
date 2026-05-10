package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"server/internal/config"
	"server/internal/dto"
	"server/internal/repo"
	"server/internal/service/storage"
	"server/internal/utils"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/rabbitmq/amqp091-go"
)

type AvatarWorker struct {
	cfg      *config.Config
	authRepo repo.AuthRepository
	r2       *storage.R2Service
	ch       *amqp091.Channel
}

func NewAvatarWorker(cfg *config.Config, authRepo repo.AuthRepository, r2 *storage.R2Service, ch *amqp091.Channel) *AvatarWorker {
	return &AvatarWorker{
		cfg:      cfg,
		authRepo: authRepo,
		r2:       r2,
		ch:       ch,
	}
}

func (w *AvatarWorker) Start(ctx context.Context) error {
	msgs, err := w.ch.Consume(
		w.cfg.RabbitMQ.AvatarQueue,
		"avatar_worker",
		false, // auto-ack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	utils.Info("avatar worker started", nil)

	for {
		select {
		case <-ctx.Done():
			return nil
		case d, ok := <-msgs:
			if !ok {
				return nil
			}
			w.process(ctx, d)
		}
	}
}

func (w *AvatarWorker) process(ctx context.Context, d amqp091.Delivery) {
	defer d.Ack(false)

	var job dto.AvatarProcessingJob
	if err := json.Unmarshal(d.Body, &job); err != nil {
		utils.Error("avatar worker: unmarshal failed", err, nil)
		return
	}

	// Always cleanup original temp file
	defer os.Remove(job.FilePath)

	// 1. Delete old avatar if exists
	if job.OldURL != nil && *job.OldURL != "" {
		// Extract key from URL (assuming PublicURL + "/" + key format)
		key := strings.TrimPrefix(*job.OldURL, w.cfg.R2.PublicURL+"/")
		if key != *job.OldURL {
			_ = w.r2.Delete(ctx, key)
		}
	}

	// 2. Compress image
	src, err := imaging.Open(job.FilePath)
	if err != nil {
		utils.Error("avatar worker: open failed", err, map[string]any{"path": job.FilePath})
		return
	}

	// Resize to 400x400 (standard for avatars)
	dst := imaging.Fill(src, 400, 400, imaging.Center, imaging.Lanczos)

	// Save to a compressed temp file
	compressedPath := job.FilePath + ".compressed.jpg"
	err = imaging.Save(dst, compressedPath, imaging.JPEGQuality(80))
	if err != nil {
		utils.Error("avatar worker: compress failed", err, nil)
		return
	}
	defer os.Remove(compressedPath)

	// 3. Upload to R2
	file, err := os.Open(compressedPath)
	if err != nil {
		utils.Error("avatar worker: open compressed failed", err, nil)
		return
	}
	defer file.Close()

	r2Key := fmt.Sprintf("avatars/%s/avatar_%d.jpg", job.UserID.String(), time.Now().Unix())
	publicURL, err := w.r2.Upload(ctx, r2Key, file, "image/jpeg")
	if err != nil {
		return
	}

	// 4. Update Database
	params := repo.UpdateUserParams{
		AvatarURL: &publicURL,
	}
	if err := w.authRepo.UpdateUser(ctx, job.UserID, params); err != nil {
		utils.Error("avatar worker: db update failed", err, map[string]any{"user_id": job.UserID})
		return
	}

	utils.Info("avatar processed successfully", map[string]any{"user_id": job.UserID, "url": publicURL})
}

package worker

import (
	"context"
	"server/internal/app"
	"server/internal/utils"
)

// StartAllWorkers initializes and starts all background workers
func StartAllWorkers(ctx context.Context, deps *app.Dependencies) {
	// Avatar Worker
	ch, err := deps.Broker.Channel()
	if err != nil {
		utils.Fatal("failed to open channel for avatar worker", err, nil)
	}

	avatarWorker := NewAvatarWorker(deps.Config, deps.AuthRepo, deps.R2, ch)
	
	go func() {
		if err := avatarWorker.Start(ctx); err != nil {
			utils.Error("avatar worker stopped with error", err, nil)
		}
	}()
}

package service

import (
	"context"
	"server/internal/config"
	"server/internal/models"
	"server/internal/queue"
	"server/internal/repo"

	"github.com/google/uuid"
)

type UserService struct {
	cfg      *config.Config
	authRepo repo.AuthRepository
	queue    *queue.Manager
}

func NewUserService(cfg *config.Config, authRepo repo.AuthRepository, q *queue.Manager) *UserService {
	return &UserService{
		cfg:      cfg,
		authRepo: authRepo,
		queue:    q,
	}
}

// GetMe returns the current authenticated user's profile
func (s *UserService) GetMe(ctx context.Context, userID uuid.UUID) (*models.SafeUser, error) {
	user, prefs, err := s.authRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	safe := user.ToSafe(prefs)
	return &safe, nil
}

// GetByID returns a safe user profile by ID
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*models.SafeUser, error) {
	user, prefs, err := s.authRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	safe := user.ToSafe(prefs)
	return &safe, nil
}

// GetByEmail returns a safe user profile by email
func (s *UserService) GetByEmail(ctx context.Context, email string) (*models.SafeUser, error) {
	user, prefs, err := s.authRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	safe := user.ToSafe(prefs)
	return &safe, nil
}

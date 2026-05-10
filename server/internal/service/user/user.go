package service

import (
	"context"
	"server/internal/models"
	"server/internal/repo"

	"github.com/google/uuid"
)

type UserService struct {
	authRepo repo.AuthRepository
}

func NewUserService(authRepo repo.AuthRepository) *UserService {
	return &UserService{
		authRepo: authRepo,
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

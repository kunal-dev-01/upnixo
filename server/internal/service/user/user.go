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
	cfg         *config.Config
	authRepo    repo.AuthRepository
	sessionRepo *repo.SessionRepository
	queue       *queue.Manager
}

func NewUserService(cfg *config.Config, authRepo repo.AuthRepository, sessionRepo *repo.SessionRepository, q *queue.Manager) *UserService {
	return &UserService{
		cfg:         cfg,
		authRepo:    authRepo,
		sessionRepo: sessionRepo,
		queue:       q,
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

// ListUsers returns a filtered, paginated list of all users as SafeUser profiles (admin only)
func (s *UserService) ListUsers(ctx context.Context, params repo.ListUsersParams) ([]models.SafeUser, int64, error) {
	users, total, err := s.authRepo.ListUsers(ctx, params)
	if err != nil {
		return nil, 0, err
	}

	safeUsers := make([]models.SafeUser, len(users))
	for i, u := range users {
		safeUsers[i] = u.User.ToSafe(&u.UserPreferences)
	}

	return safeUsers, total, nil
}

// BlockUser blocks or unblocks a user and immediately revokes all their active sessions if blocked (admin only)
func (s *UserService) BlockUser(ctx context.Context, id uuid.UUID, blocked bool, reason *string) error {
	err := s.authRepo.BlockUser(ctx, id, blocked, reason)
	if err != nil {
		return err
	}

	if blocked {
		// Instantly terminate all active sessions of this blocked user so they are booted from the platform
		_ = s.sessionRepo.RevokeAllSessions(ctx, "user", id.String())
	}

	return nil
}


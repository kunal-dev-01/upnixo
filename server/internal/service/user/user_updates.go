package service

import (
	"context"
	"encoding/json"
	"server/internal/dto"
	"server/internal/repo"

	"github.com/google/uuid"
)

// UpdateProfile updates the user's basic profile information
func (s *UserService) UpdateProfile(ctx context.Context, userID uuid.UUID, req dto.UpdateUserRequest) (*dto.UpdateUserRequest, error) {
	params := repo.UpdateUserParams{
		FullName: req.FullName,
		Timezone: req.Timezone,
		Locale:   req.Locale,
	}

	if err := s.authRepo.UpdateUser(ctx, userID, params); err != nil {
		return nil, err
	}

	return &req, nil
}

// UpdatePreferences updates the user's application preferences
func (s *UserService) UpdatePreferences(ctx context.Context, userID uuid.UUID, req dto.UpdatePreferencesRequest) (*dto.UpdatePreferencesRequest, error) {
	var notifJSON []byte
	var err error

	if req.Notifications != nil {
		notifJSON, err = json.Marshal(req.Notifications)
		if err != nil {
			return nil, err
		}
	}

	params := repo.UpdatePreferencesParams{
		Theme:            req.Theme,
		SidebarCollapsed: req.SidebarCollapsed,
		CompactView:      req.CompactView,
		Notifications:    notifJSON,
		DefaultCurrency:  req.DefaultCurrency,
		Language:         req.Language,
	}

	if err := s.authRepo.UpdatePreferences(ctx, userID, params); err != nil {
		return nil, err
	}

	return &req, nil
}

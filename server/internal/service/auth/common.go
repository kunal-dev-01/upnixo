package service

import (
	"context"
	"time"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/security"
)

// baseService provides shared functionality for authentication services.
type baseService struct {
	cfg         *config.Config
	sessionRepo *repo.SessionRepository
	jwt         *security.JWTManager
}

// createSession builds JWT pair + stores session in Redis.
func (s *baseService) createSession(
	ctx context.Context,
	user *models.User,
	prefs *models.UserPreferences,
	info dto.ClientInfo,
) (*dto.AuthResult, error) {

	sessionID, err := security.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	pair, err := s.jwt.GenerateTokenPair(user, sessionID)
	if err != nil {
		return nil, err
	}

	ttl := s.cfg.JWT.RefreshTokenDuration
	expiresAt := time.Now().Add(ttl)

	meta := &dto.SessionMetadata{
		ID:           sessionID,
		UserID:       user.ID.String(),
		RefreshToken: pair.RefreshToken,
		IPAddress:    info.IP,
		Browser:      info.Browser,
		OS:           info.OS,
		DeviceName:   info.DeviceName,
		City:         info.City,
		Country:      info.Country,
		CreatedAt:    time.Now(),
		ExpiresAt:    expiresAt,
	}

	if err = s.sessionRepo.StoreSession(ctx, meta, ttl); err != nil {
		return nil, err
	}

	safe := user.ToSafe(prefs)

	return &dto.AuthResult{
		User:        &safe,
		AccessToken: pair.AccessToken,
		SessionID:   sessionID,
	}, nil
}

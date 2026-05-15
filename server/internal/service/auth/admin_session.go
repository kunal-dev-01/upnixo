package service

import (
	"context"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/dto"
)

type AdminSessionService struct {
	sessionRepo *repo.SessionRepository
}

func NewAdminSessionService(sessionRepo *repo.SessionRepository) *AdminSessionService {
	return &AdminSessionService{sessionRepo: sessionRepo}
}

func (s *AdminSessionService) GetSessions(ctx context.Context, adminID string) ([]dto.SafeSession, error) {
	sessions, err := s.sessionRepo.GetActiveSessions(ctx, string(security.RoleAdmin), adminID)
	if err != nil {
		return nil, err
	}

	safeSessions := make([]dto.SafeSession, len(sessions))
	for i, sess := range sessions {
		// Note: IsCurrent will be handled in handler if needed, or we can pass it here
		safeSessions[i] = sess.ToSafe("") 
	}

	return safeSessions, nil
}

func (s *AdminSessionService) RevokeSession(ctx context.Context, adminID, sessionID string) error {
	return s.sessionRepo.RevokeSession(ctx, string(security.RoleAdmin), adminID, sessionID)
}

func (s *AdminSessionService) RevokeAllSessions(ctx context.Context, adminID string) error {
	return s.sessionRepo.RevokeAllSessions(ctx, string(security.RoleAdmin), adminID)
}

func (s *AdminSessionService) Logout(ctx context.Context, sessionID string) error {
	return s.sessionRepo.DeleteSession(ctx, sessionID)
}

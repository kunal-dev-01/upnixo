package service

import (
	"context"

	"server/internal/dto"
	"server/internal/repo"
	"server/internal/utils"
)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type SessionService struct {
	sessionRepo *repo.SessionRepository
}

func NewSessionService(
	sessionRepo *repo.SessionRepository,
) *SessionService {
	return &SessionService{
		sessionRepo: sessionRepo,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ACTIVE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionService) GetActiveSessions(
	ctx context.Context,
	userID string,
	currentSessionID string,
) ([]dto.SafeSession, error) {

	if userID == "" {
		return nil, utils.Unauthorized("missing user id")
	}

	sessions, err := s.sessionRepo.GetActiveSessions(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.SafeSession, 0, len(sessions))

	for _, session := range sessions {
		result = append(
			result,
			session.ToSafe(currentSessionID),
		)
	}

	return result, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT CURRENT SESSION
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionService) Logout(
	ctx context.Context,
	userID string,
	sessionID string,
) error {

	if userID == "" || sessionID == "" {
		return utils.BadRequest("invalid session")
	}

	err := s.sessionRepo.RevokeSession(
		ctx,
		userID,
		sessionID,
	)
	if err != nil {
		return err
	}

	utils.Info("session revoked", map[string]any{
		"user_id":    userID,
		"session_id": sessionID,
	})

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE SESSION BY ID
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionService) RevokeSession(
	ctx context.Context,
	userID string,
	currentSessionID string,
	targetSessionID string,
) error {

	if targetSessionID == "" {
		return utils.BadRequest("session id is required")
	}

	if currentSessionID == targetSessionID {
		return utils.BadRequest(
			"cannot revoke current session using this endpoint",
		)
	}

	// verify session belongs to user
	session, err := s.sessionRepo.GetSession(
		ctx,
		targetSessionID,
	)
	if err != nil {
		return err
	}

	if session.UserID != userID {
		return utils.Forbidden("you cannot revoke this session")
	}

	err = s.sessionRepo.RevokeSession(
		ctx,
		userID,
		targetSessionID,
	)
	if err != nil {
		return err
	}

	utils.Warn("session revoked by user", map[string]any{
		"user_id":         userID,
		"target_session":  targetSessionID,
		"current_session": currentSessionID,
	})

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE ALL OTHER SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionService) RevokeAllSessions(
	ctx context.Context,
	userID string,
	currentSessionID string,
) error {

	sessions, err := s.sessionRepo.GetActiveSessions(
		ctx,
		userID,
	)
	if err != nil {
		return err
	}

	for _, session := range sessions {

		// keep current session alive
		if session.ID == currentSessionID {
			continue
		}

		err = s.sessionRepo.RevokeSession(
			ctx,
			userID,
			session.ID,
		)
		if err != nil {
			utils.Error("revoke session failed", err, map[string]any{
				"user_id":    userID,
				"session_id": session.ID,
			})
		}
	}

	utils.Warn("all other sessions revoked", map[string]any{
		"user_id":         userID,
		"current_session": currentSessionID,
	})

	return nil
}

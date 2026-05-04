package repo

import (
	"context"
	"encoding/json"
	"time"

	"server/internal/config"
	"server/internal/dto"
	rds "server/internal/redis"
	"server/internal/utils"
)

// ─────────────────────────────────────────────────────────────────────────────
// KEY PREFIXES
// ─────────────────────────────────────────────────────────────────────────────

const (
	prefixSession      = "session:"
	prefixUserSessions = "user_sessions:"
)

// ─────────────────────────────────────────────────────────────────────────────
// SESSION REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

type SessionRepository struct {
	r   *rds.Redis
	cfg *config.Config
}

func NewSessionRepository(r *rds.Redis, cfg *config.Config) *SessionRepository {
	return &SessionRepository{r: r, cfg: cfg}
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionRepository) StoreSession(ctx context.Context, meta *dto.SessionMetadata, ttl time.Duration) error {
	if meta == nil {
		return utils.Internal(nil)
	}

	// Check active session count before storing — stale-safe
	count, err := s.CountActiveSessions(ctx, meta.UserID)
	if err != nil {
		return err
	}
	if count >= s.cfg.Security.MaxSessions {
		return utils.Forbidden("maximum active sessions reached — logout from another device first")
	}

	data, err := json.Marshal(meta)
	if err != nil {
		return utils.Internal(err)
	}

	client, err := s.r.Client()
	if err != nil {
		return utils.Internal(err)
	}

	sessionKey := prefixSession + meta.ID
	userKey := prefixUserSessions + meta.UserID
	userSetTTL := s.cfg.JWT.RefreshTokenDuration * 3

	pipe := client.Pipeline()
	pipe.Set(ctx, sessionKey, data, ttl)
	pipe.SAdd(ctx, userKey, meta.ID)
	pipe.Expire(ctx, userKey, userSetTTL)

	if _, err = pipe.Exec(ctx); err != nil {
		utils.Error("store session pipeline failed", err, map[string]any{"user_id": meta.UserID})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionRepository) GetSession(ctx context.Context, sessionID string) (*dto.SessionMetadata, error) {
	raw, err := s.r.Get(ctx, prefixSession+sessionID)
	if err != nil {
		return nil, utils.Internal(err)
	}
	if raw == "" {
		return nil, utils.Unauthorized("session expired or invalidated")
	}

	var meta dto.SessionMetadata
	if err = json.Unmarshal([]byte(raw), &meta); err != nil {
		return nil, utils.Internal(err)
	}

	return &meta, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE
// ─────────────────────────────────────────────────────────────────────────────

func (s *SessionRepository) RevokeSession(ctx context.Context, userID, sessionID string) error {
	client, err := s.r.Client()
	if err != nil {
		return utils.Internal(err)
	}

	pipe := client.Pipeline()
	pipe.Del(ctx, prefixSession+sessionID)
	pipe.SRem(ctx, prefixUserSessions+userID, sessionID)

	if _, err = pipe.Exec(ctx); err != nil {
		utils.Error("revoke session failed", err, map[string]any{
			"user_id":    userID,
			"session_id": sessionID,
		})
		return utils.Internal(err)
	}

	return nil
}

func (s *SessionRepository) RevokeAllSessions(ctx context.Context, userID string) error {
	client, err := s.r.Client()
	if err != nil {
		return utils.Internal(err)
	}

	userKey := prefixUserSessions + userID

	sessionIDs, err := client.SMembers(ctx, userKey).Result()
	if err != nil {
		return utils.Internal(err)
	}
	if len(sessionIDs) == 0 {
		return nil
	}

	pipe := client.Pipeline()
	for _, id := range sessionIDs {
		pipe.Del(ctx, prefixSession+id)
	}
	pipe.Del(ctx, userKey)

	if _, err = pipe.Exec(ctx); err != nil {
		utils.Error("revoke all sessions failed", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST + COUNT
// ─────────────────────────────────────────────────────────────────────────────

// GetActiveSessions returns live sessions, pruning stale entries in one shot.
func (s *SessionRepository) GetActiveSessions(ctx context.Context, userID string) ([]*dto.SessionMetadata, error) {
	client, err := s.r.Client()
	if err != nil {
		return nil, utils.Internal(err)
	}

	userKey := prefixUserSessions + userID

	sessionIDs, err := client.SMembers(ctx, userKey).Result()
	if err != nil {
		return nil, utils.Internal(err)
	}
	if len(sessionIDs) == 0 {
		return []*dto.SessionMetadata{}, nil
	}

	keys := make([]string, len(sessionIDs))
	for i, id := range sessionIDs {
		keys[i] = prefixSession + id
	}

	results, err := client.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, utils.Internal(err)
	}

	sessions := make([]*dto.SessionMetadata, 0, len(sessionIDs))
	var staleIDs []any

	for i, res := range results {
		if res == nil {
			staleIDs = append(staleIDs, sessionIDs[i])
			continue
		}

		raw, ok := res.(string)
		if !ok {
			staleIDs = append(staleIDs, sessionIDs[i])
			continue
		}

		var meta dto.SessionMetadata
		if err = json.Unmarshal([]byte(raw), &meta); err != nil {
			utils.Error("corrupted session entry — pruning", err, map[string]any{
				"session_id": sessionIDs[i],
				"user_id":    userID,
			})
			staleIDs = append(staleIDs, sessionIDs[i])
			continue
		}

		sessions = append(sessions, &meta)
	}

	// Prune stale IDs — non-fatal
	if len(staleIDs) > 0 {
		if sremErr := client.SRem(ctx, userKey, staleIDs...).Err(); sremErr != nil {
			utils.Error("prune stale sessions failed", sremErr, map[string]any{"user_id": userID})
		}
	}

	return sessions, nil
}

// CountActiveSessions returns the number of live sessions.
// Reuses GetActiveSessions so stale entries are pruned automatically.
func (s *SessionRepository) CountActiveSessions(ctx context.Context, userID string) (int, error) {
	sessions, err := s.GetActiveSessions(ctx, userID)
	if err != nil {
		return 0, err
	}
	return len(sessions), nil
}

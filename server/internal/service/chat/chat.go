package service

import (
	"context"
	"fmt"
	"server/internal/repo"
	"server/internal/schemas"
	"server/internal/utils"

	"github.com/google/uuid"
)

type ChatService struct {
	repo        repo.ChatRepository
	projectRepo repo.ProjectRepository
	log         *utils.Logger
}

func NewChatService(chatRepo repo.ChatRepository, projectRepo repo.ProjectRepository, log *utils.Logger) *ChatService {
	return &ChatService{
		repo:        chatRepo,
		projectRepo: projectRepo,
		log:         log,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// InitProjectChat ensures a chat room exists for a project and the user has access.
func (s *ChatService) InitProjectChat(ctx context.Context, projectID uuid.UUID, userID uuid.UUID) (*schemas.ChatRoom, error) {
	// 1. Get Project & Verify Access
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}

	if project.ClientID != userID && (project.FreelancerID == nil || *project.FreelancerID != userID) {
		return nil, utils.Forbidden("you are not a participant of this project")
	}

	// 2. If room already exists in Postgres, return from Mongo
	if project.ChatRoomID.Valid && project.ChatRoomID.String != "" {
		return s.repo.GetRoomByID(ctx, project.ChatRoomID.String)
	}

	// 3. Create New Room
	roomID := fmt.Sprintf("room_%s", uuid.New().String())
	participants := []schemas.Participant{
		{UserID: project.ClientID.String(), Role: schemas.ParticipantRoleClient},
	}
	if project.FreelancerID != nil {
		participants = append(participants, schemas.Participant{
			UserID: project.FreelancerID.String(),
			Role:   schemas.ParticipantRoleFreelancer,
		})
	}

	room := schemas.ChatRoom{
		ID:           roomID,
		ProjectID:    project.ID.String(),
		Participants: participants,
	}

	createdRoom, err := s.repo.FindOrCreateRoom(ctx, room)
	if err != nil {
		return nil, err
	}

	// 4. Update Postgres Project with Room ID
	err = s.projectRepo.Update(ctx, project.ID, repo.UpdateProjectParams{
		ChatRoomID: &roomID,
	})
	if err != nil {
		// Non-fatal for chat, but log it
		s.log.Error("failed to sync chat_room_id to postgres", err, map[string]any{"project_id": project.ID})
	}

	return createdRoom, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

func (s *ChatService) SendMessage(ctx context.Context, msg schemas.ChatMessage) (*schemas.ChatMessage, error) {
	return s.repo.SendMessage(ctx, msg)
}

func (s *ChatService) GetMessages(ctx context.Context, roomID string, limit, offset int64) ([]schemas.ChatMessage, error) {
	return s.repo.GetMessages(ctx, roomID, limit, offset)
}

func (s *ChatService) MarkAsRead(ctx context.Context, roomID string, userID string) error {
	return s.repo.MarkAsRead(ctx, roomID, userID)
}

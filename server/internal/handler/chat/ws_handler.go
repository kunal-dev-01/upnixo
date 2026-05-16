package handler

import (
	"context"
	"encoding/json"
	"server/internal/schemas"
	chatService "server/internal/service/chat"
	"server/internal/utils"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

type WSHandler struct {
	chatSvc *chatService.ChatService
	wsMgr   *chatService.WSManager
	log     *utils.Logger
}

func NewWSHandler(chatSvc *chatService.ChatService, wsMgr *chatService.WSManager, log *utils.Logger) *WSHandler {
	return &WSHandler{
		chatSvc: chatSvc,
		wsMgr:   wsMgr,
		log:     log,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET HANDLER
// ─────────────────────────────────────────────────────────────────────────────

func (h *WSHandler) Handle(c *websocket.Conn) {
	// 1. Authenticate & Extract Metadata (from locals set by middleware)
	userIDStr := c.Locals("user_id").(string)
	projectIDStr := c.Params("id") // Project UUID

	userID, _ := uuid.Parse(userIDStr)
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		h.log.Error("invalid project id in ws", err, map[string]any{"id": projectIDStr})
		c.Close()
		return
	}

	// 2. Initialize/Join Room
	room, err := h.chatSvc.InitProjectChat(context.Background(), projectID, userID)
	if err != nil {
		h.log.Error("failed to init chat room", err, map[string]any{"project_id": projectID})
		c.Close()
		return
	}

	roomID := room.ID
	h.wsMgr.Register(roomID, userIDStr, c)
	defer h.wsMgr.Unregister(roomID, userIDStr)

	h.log.Info("user joined chat room", map[string]any{"user_id": userIDStr, "room_id": roomID})

	// 3. Read Loop
	for {
		messageType, payload, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				h.log.Error("ws read error", err, map[string]any{"user_id": userIDStr})
			}
			break
		}

		if messageType != websocket.TextMessage {
			continue
		}

		// Handle Incoming Message
		var req schemas.ChatMessage
		if err := json.Unmarshal(payload, &req); err != nil {
			h.log.Warn("failed to unmarshal ws message", map[string]any{"user_id": userIDStr, "payload": string(payload)})
			continue
		}

		// Enforce Metadata
		req.RoomID = roomID
		req.SenderID = userIDStr

		// Save to DB
		savedMsg, err := h.chatSvc.SendMessage(context.Background(), req)
		if err != nil {
			h.log.Error("failed to save chat message", err, map[string]any{"room_id": roomID})
			continue
		}

		// Broadcast to room
		h.wsMgr.Broadcast(roomID, savedMsg)
	}
}

package service

import (
	"encoding/json"
	"server/internal/utils"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

type WSManager struct {
	// rooms[roomID][userID] = *websocket.Conn
	rooms map[string]map[string]*websocket.Conn
	mu    sync.RWMutex
	log   *utils.Logger
}

func NewWSManager(log *utils.Logger) *WSManager {
	return &WSManager{
		rooms: make(map[string]map[string]*websocket.Conn),
		log:   log,
	}
}

// Register adds a connection to a room.
func (m *WSManager) Register(roomID, userID string, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.rooms[roomID] == nil {
		m.rooms[roomID] = make(map[string]*websocket.Conn)
	}
	m.rooms[roomID][userID] = conn
}

// Unregister removes a connection from a room.
func (m *WSManager) Unregister(roomID, userID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.rooms[roomID] != nil {
		delete(m.rooms[roomID], userID)
		if len(m.rooms[roomID]) == 0 {
			delete(m.rooms, roomID)
		}
	}
}

// Broadcast sends a message to all active participants in a room.
func (m *WSManager) Broadcast(roomID string, msg any) {
	m.mu.RLock()
	conns, ok := m.rooms[roomID]
	if !ok {
		m.mu.RUnlock()
		return
	}
	m.mu.RUnlock()

	payload, err := json.Marshal(msg)
	if err != nil {
		m.log.Error("failed to marshal broadcast message", err, nil)
		return
	}

	for userID, conn := range conns {
		if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			m.log.Warn("failed to send message to user", map[string]any{
				"user_id": userID,
				"room_id": roomID,
				"error":   err.Error(),
			})
			// Connection might be closed, but we let the read loop handle Unregister
		}
	}
}

// BroadcastToOthers sends a message to everyone in the room EXCEPT the sender.
func (m *WSManager) BroadcastToOthers(roomID, senderID string, msg any) {
	m.mu.RLock()
	conns, ok := m.rooms[roomID]
	if !ok {
		m.mu.RUnlock()
		return
	}
	m.mu.RUnlock()

	payload, err := json.Marshal(msg)
	if err != nil {
		m.log.Error("failed to marshal broadcast message", err, nil)
		return
	}

	for userID, conn := range conns {
		if userID == senderID {
			continue
		}
		if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			m.log.Warn("failed to send message to user", map[string]any{
				"user_id": userID,
				"room_id": roomID,
				"error":   err.Error(),
			})
		}
	}
}

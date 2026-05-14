package repo

import (
	"context"
	"time"

	"server/internal/db"
	"server/internal/schemas"
	"server/internal/utils"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

type ChatRepository interface {
	// Room Management
	FindOrCreateRoom(ctx context.Context, room schemas.ChatRoom) (*schemas.ChatRoom, error)
	GetRoomByID(ctx context.Context, roomID string) (*schemas.ChatRoom, error)
	GetRoomsForUser(ctx context.Context, userID string) ([]schemas.ChatRoom, error)

	// Message Operations
	SendMessage(ctx context.Context, msg schemas.ChatMessage) (*schemas.ChatMessage, error)
	GetMessages(ctx context.Context, roomID string, limit int64, offset int64) ([]schemas.ChatMessage, error)
	MarkAsRead(ctx context.Context, roomID string, userID string) error

	// Updates
	UpdateLastMessage(ctx context.Context, roomID string, snippet schemas.LastMessageSnippet) error
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type chatRepo struct {
	log *utils.Logger
	col *mongo.Collection // rooms
	msg *mongo.Collection // messages
}

func NewChatRepository(log *utils.Logger) ChatRepository {
	return &chatRepo{
		log: log,
		col: db.MongoDatabase.Collection("rooms"),
		msg: db.MongoDatabase.Collection("messages"),
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// FindOrCreateRoom inserts a new room only if it doesn't exist.
// If it already exists, the existing document is returned untouched.
// BUG FIX: Previously used FindOneAndReplace with Upsert=true which would
// overwrite an existing room's participants/metadata on every call.
func (r *chatRepo) FindOrCreateRoom(ctx context.Context, room schemas.ChatRoom) (*schemas.ChatRoom, error) {
	now := time.Now()
	if room.CreatedAt.IsZero() {
		room.CreatedAt = now
	}
	room.UpdatedAt = now
	room.IsActive = true

	// $setOnInsert — only writes these fields if this is a new document.
	// If the room already exists, MongoDB returns it as-is without any modification.
	filter := bson.M{"_id": room.ID}
	update := bson.M{
		"$setOnInsert": room,
	}
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var result schemas.ChatRoom
	err := r.col.FindOneAndUpdate(ctx, filter, update, opts).Decode(&result)
	if err != nil {
		r.log.Error("failed to find/create chat room", err, map[string]any{"room_id": room.ID})
		return nil, utils.Internal(err)
	}

	return &result, nil
}

func (r *chatRepo) GetRoomByID(ctx context.Context, roomID string) (*schemas.ChatRoom, error) {
	var room schemas.ChatRoom
	err := r.col.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, utils.NotFound("chat room not found")
		}
		r.log.Error("failed to get chat room by id", err, map[string]any{"room_id": roomID})
		return nil, utils.Internal(err)
	}
	return &room, nil
}

func (r *chatRepo) GetRoomsForUser(ctx context.Context, userID string) ([]schemas.ChatRoom, error) {
	filter := bson.M{"participants.user_id": userID, "is_active": true}
	opts := options.Find().SetSort(bson.M{"updated_at": -1})

	cursor, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		r.log.Error("failed to get rooms for user", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}
	defer cursor.Close(ctx)

	// Initialise as empty slice — caller gets [] not null in JSON response.
	rooms := make([]schemas.ChatRoom, 0)
	if err = cursor.All(ctx, &rooms); err != nil {
		r.log.Error("failed to decode rooms cursor", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}

	return rooms, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// SendMessage inserts a message and updates room metadata.
// The room update failure is non-fatal and only logged — the message itself
// is already durably stored, and room metadata can be rebuilt from messages.
func (r *chatRepo) SendMessage(ctx context.Context, msg schemas.ChatMessage) (*schemas.ChatMessage, error) {
	if msg.CreatedAt.IsZero() {
		msg.CreatedAt = time.Now()
	}
	msg.ID = bson.NewObjectID()

	_, err := r.msg.InsertOne(ctx, msg)
	if err != nil {
		r.log.Error("failed to insert chat message", err, map[string]any{"room_id": msg.RoomID})
		return nil, utils.Internal(err)
	}

	snippet := schemas.LastMessageSnippet{
		MessageID: msg.ID,
		SenderID:  msg.SenderID,
		Text:      msg.Content,
		Type:      msg.Type,
		SentAt:    msg.CreatedAt,
	}

	roomUpdate := bson.M{
		"$set": bson.M{
			"last_message": snippet,
			"updated_at":   msg.CreatedAt,
		},
		"$inc": bson.M{
			// Increment unread_count only for participants who are NOT the sender.
			"participants.$[other].unread_count": 1,
		},
	}

	updateOpts := options.UpdateOne().SetArrayFilters(
		[]any{bson.M{"other.user_id": bson.M{"$ne": msg.SenderID}}},
	)

	_, err = r.col.UpdateOne(ctx, bson.M{"_id": msg.RoomID}, roomUpdate, updateOpts)
	if err != nil {
		// Non-fatal: message is already saved. Log and continue.
		r.log.Warn("failed to update room metadata after message", map[string]any{
			"error":   err.Error(),
			"room_id": msg.RoomID,
		})
	}

	return &msg, nil
}

// GetMessages returns messages for a room, newest first, with cursor-based pagination.
// BUG FIX: `bson.M{"deleted_at": nil}` matches documents where the field is
// explicitly set to null but NOT documents where the field is absent entirely.
// Use $in with both nil and missing-field semantics via $exists to be safe,
// or — simpler — only fetch where deleted_at does not exist OR is null.
func (r *chatRepo) GetMessages(ctx context.Context, roomID string, limit int64, offset int64) ([]schemas.ChatMessage, error) {
	filter := bson.M{
		"room_id": roomID,
		"deleted_at": bson.M{
			// Match documents where deleted_at is absent OR explicitly null.
			"$in": bson.A{nil},
		},
	}

	opts := options.Find().
		SetSort(bson.M{"created_at": -1}).
		SetLimit(limit).
		SetSkip(offset)

	cursor, err := r.msg.Find(ctx, filter, opts)
	if err != nil {
		r.log.Error("failed to get messages", err, map[string]any{"room_id": roomID})
		return nil, utils.Internal(err)
	}
	defer cursor.Close(ctx)

	messages := make([]schemas.ChatMessage, 0)
	if err = cursor.All(ctx, &messages); err != nil {
		r.log.Error("failed to decode messages cursor", err, map[string]any{"room_id": roomID})
		return nil, utils.Internal(err)
	}

	return messages, nil
}

func (r *chatRepo) MarkAsRead(ctx context.Context, roomID string, userID string) error {
	filter := bson.M{
		"_id":                  roomID,
		"participants.user_id": userID,
	}

	update := bson.M{
		"$set": bson.M{
			"participants.$.unread_count": 0,
			"participants.$.last_read_at": time.Now(),
		},
	}

	result, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		r.log.Error("failed to mark messages as read", err, map[string]any{
			"room_id": roomID,
			"user_id": userID,
		})
		return utils.Internal(err)
	}

	// If nothing was matched, the room or participant doesn't exist.
	if result.MatchedCount == 0 {
		return utils.NotFound("room or participant not found")
	}

	return nil
}

func (r *chatRepo) UpdateLastMessage(ctx context.Context, roomID string, snippet schemas.LastMessageSnippet) error {
	update := bson.M{
		"$set": bson.M{
			"last_message": snippet,
			"updated_at":   snippet.SentAt,
		},
	}

	_, err := r.col.UpdateOne(ctx, bson.M{"_id": roomID}, update)
	if err != nil {
		r.log.Error("failed to update last message", err, map[string]any{"room_id": roomID})
		return utils.Internal(err)
	}

	return nil
}

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

type NotificationRepository interface {
	// Write
	Create(ctx context.Context, n schemas.Notification) (*schemas.Notification, error)
	CreateBulk(ctx context.Context, notifications []schemas.Notification) error

	// Read
	GetByID(ctx context.Context, id bson.ObjectID) (*schemas.Notification, error)
	GetForUser(ctx context.Context, userID string, filter NotificationFilter) ([]schemas.Notification, error)
	GetUnseenCount(ctx context.Context, userID string) (int64, error)

	// State Mutations
	MarkAsRead(ctx context.Context, id bson.ObjectID, userID string) error
	MarkAllAsRead(ctx context.Context, userID string) error
	MarkAllAsSeen(ctx context.Context, userID string) error

	// Delete
	Delete(ctx context.Context, id bson.ObjectID, userID string) error
	DeleteAllForUser(ctx context.Context, userID string) error

	// Settings
	GetSettings(ctx context.Context, userID string) (*schemas.UserNotificationSettings, error)
	UpsertSettings(ctx context.Context, settings schemas.UserNotificationSettings) (*schemas.UserNotificationSettings, error)
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER DTO
// Used by service layer to query notifications with optional constraints.
// ─────────────────────────────────────────────────────────────────────────────

type NotificationFilter struct {
	OnlyUnread bool
	OnlyUnseen bool
	Types      []schemas.NotificationType // empty = all types
	Limit      int64
	Offset     int64
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type notifRepo struct {
	log      *utils.Logger
	col      *mongo.Collection // notifications
	settings *mongo.Collection // notification_settings
}

func NewNotificationRepository(log *utils.Logger) NotificationRepository {
	return &notifRepo{
		log:      log,
		col:      db.MongoDatabase.Collection("notifications"),
		settings: db.MongoDatabase.Collection("notification_settings"),
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

func (r *notifRepo) Create(ctx context.Context, n schemas.Notification) (*schemas.Notification, error) {
	n.ID = bson.NewObjectID()
	if n.CreatedAt.IsZero() {
		n.CreatedAt = time.Now()
	}
	// Explicit defaults — avoids zero-value ambiguity on reads.
	n.IsRead = false
	n.IsSeen = false

	_, err := r.col.InsertOne(ctx, n)
	if err != nil {
		r.log.Error("failed to insert notification", err, map[string]any{
			"user_id": n.UserID,
			"type":    n.Type,
		})
		return nil, utils.Internal(err)
	}

	return &n, nil
}

// CreateBulk inserts multiple notifications in a single round-trip.
// Partial failures are not retried — caller should log and handle.
func (r *notifRepo) CreateBulk(ctx context.Context, notifications []schemas.Notification) error {
	if len(notifications) == 0 {
		return nil
	}

	now := time.Now()
	docs := make([]any, len(notifications))
	for i, n := range notifications {
		n.ID = bson.NewObjectID()
		if n.CreatedAt.IsZero() {
			n.CreatedAt = now
		}
		n.IsRead = false
		n.IsSeen = false
		docs[i] = n
	}

	_, err := r.col.InsertMany(ctx, docs)
	if err != nil {
		r.log.Error("failed to bulk insert notifications", err, map[string]any{
			"count": len(notifications),
		})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

func (r *notifRepo) GetByID(ctx context.Context, id bson.ObjectID) (*schemas.Notification, error) {
	var n schemas.Notification
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&n)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, utils.NotFound("notification not found")
		}
		r.log.Error("failed to get notification by id", err, map[string]any{"id": id.Hex()})
		return nil, utils.Internal(err)
	}
	return &n, nil
}

// GetForUser returns notifications for a user with optional filtering.
// Results are sorted newest first.
func (r *notifRepo) GetForUser(ctx context.Context, userID string, f NotificationFilter) ([]schemas.Notification, error) {
	filter := bson.M{"user_id": userID}

	if f.OnlyUnread {
		filter["is_read"] = false
	}
	if f.OnlyUnseen {
		filter["is_seen"] = false
	}
	if len(f.Types) > 0 {
		filter["type"] = bson.M{"$in": f.Types}
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 20 // safe default
	}

	opts := options.Find().
		SetSort(bson.M{"created_at": -1}).
		SetLimit(limit).
		SetSkip(f.Offset)

	cursor, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		r.log.Error("failed to get notifications for user", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}
	defer cursor.Close(ctx)

	notifications := make([]schemas.Notification, 0)
	if err = cursor.All(ctx, &notifications); err != nil {
		r.log.Error("failed to decode notifications cursor", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}

	return notifications, nil
}

// GetUnseenCount returns the count of notifications the user hasn't seen yet.
// Used for the badge counter in the UI.
func (r *notifRepo) GetUnseenCount(ctx context.Context, userID string) (int64, error) {
	count, err := r.col.CountDocuments(ctx, bson.M{
		"user_id": userID,
		"is_seen": false,
	})
	if err != nil {
		r.log.Error("failed to count unseen notifications", err, map[string]any{"user_id": userID})
		return 0, utils.Internal(err)
	}
	return count, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

// MarkAsRead marks a single notification as both seen and read.
// userID is required to prevent one user from marking another's notification.
func (r *notifRepo) MarkAsRead(ctx context.Context, id bson.ObjectID, userID string) error {
	now := time.Now()
	filter := bson.M{"_id": id, "user_id": userID}
	update := bson.M{
		"$set": bson.M{
			"is_read": true,
			"is_seen": true,
			"read_at": now,
		},
	}

	result, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		r.log.Error("failed to mark notification as read", err, map[string]any{
			"id":      id.Hex(),
			"user_id": userID,
		})
		return utils.Internal(err)
	}
	if result.MatchedCount == 0 {
		return utils.NotFound("notification not found")
	}

	return nil
}

// MarkAllAsRead marks every unread notification for a user as read.
// Also sets is_seen to true since read implies seen.
func (r *notifRepo) MarkAllAsRead(ctx context.Context, userID string) error {
	now := time.Now()
	filter := bson.M{"user_id": userID, "is_read": false}
	update := bson.M{
		"$set": bson.M{
			"is_read": true,
			"is_seen": true,
			"read_at": now,
		},
	}

	_, err := r.col.UpdateMany(ctx, filter, update)
	if err != nil {
		r.log.Error("failed to mark all notifications as read", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}

	return nil
}

// MarkAllAsSeen marks all unseen notifications as seen (dropdown was opened).
// Does NOT set is_read — the user saw them exist but didn't necessarily click.
func (r *notifRepo) MarkAllAsSeen(ctx context.Context, userID string) error {
	filter := bson.M{"user_id": userID, "is_seen": false}
	update := bson.M{
		"$set": bson.M{"is_seen": true},
	}

	_, err := r.col.UpdateMany(ctx, filter, update)
	if err != nil {
		r.log.Error("failed to mark all notifications as seen", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

// Delete removes a single notification.
// userID is scoped in the filter to prevent cross-user deletion.
func (r *notifRepo) Delete(ctx context.Context, id bson.ObjectID, userID string) error {
	result, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "user_id": userID})
	if err != nil {
		r.log.Error("failed to delete notification", err, map[string]any{
			"id":      id.Hex(),
			"user_id": userID,
		})
		return utils.Internal(err)
	}
	if result.DeletedCount == 0 {
		return utils.NotFound("notification not found")
	}

	return nil
}

// DeleteAllForUser is used for account cleanup / GDPR erasure.
func (r *notifRepo) DeleteAllForUser(ctx context.Context, userID string) error {
	_, err := r.col.DeleteMany(ctx, bson.M{"user_id": userID})
	if err != nil {
		r.log.Error("failed to delete all notifications for user", err, map[string]any{"user_id": userID})
		return utils.Internal(err)
	}
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

func (r *notifRepo) GetSettings(ctx context.Context, userID string) (*schemas.UserNotificationSettings, error) {
	var s schemas.UserNotificationSettings
	err := r.settings.FindOne(ctx, bson.M{"user_id": userID}).Decode(&s)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return safe defaults — user hasn't customised yet.
			return defaultSettings(userID), nil
		}
		r.log.Error("failed to get notification settings", err, map[string]any{"user_id": userID})
		return nil, utils.Internal(err)
	}
	return &s, nil
}

// UpsertSettings creates or fully replaces a user's notification settings.
func (r *notifRepo) UpsertSettings(ctx context.Context, s schemas.UserNotificationSettings) (*schemas.UserNotificationSettings, error) {
	filter := bson.M{"user_id": s.UserID}
	update := bson.M{"$set": s}
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var result schemas.UserNotificationSettings
	err := r.settings.FindOneAndUpdate(ctx, filter, update, opts).Decode(&result)
	if err != nil {
		r.log.Error("failed to upsert notification settings", err, map[string]any{"user_id": s.UserID})
		return nil, utils.Internal(err)
	}

	return &result, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// defaultSettings returns sane defaults when no settings document exists yet.
// All channels on, no types disabled.
func defaultSettings(userID string) *schemas.UserNotificationSettings {
	return &schemas.UserNotificationSettings{
		UserID:        userID,
		InAppEnabled:  true,
		EmailEnabled:  true,
		PushEnabled:   false, // off until push infra is ready
		DisabledTypes: []schemas.NotificationType{},
	}
}

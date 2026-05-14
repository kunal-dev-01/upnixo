package db

import (
	"context"
	"fmt"
	"time"

	"server/internal/config"
	"server/internal/utils"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

// MongoClient is the globally accessible MongoDB client.
var MongoClient *mongo.Client

// MongoDatabase is the globally accessible MongoDB database.
var MongoDatabase *mongo.Database

// ConnectMongo initializes the MongoDB connection with retries.
func ConnectMongo(ctx context.Context, cfg *config.Config) error {
	clientOptions := options.Client().ApplyURI(cfg.MongoDB.GetURI())

	client, err := connectMongoWithRetry(ctx, cfg, clientOptions)
	if err != nil {
		utils.Error("failed to connect to mongodb after maximum retries", err, nil)
		return fmt.Errorf("mongodb connection failed: %w", err)
	}

	MongoClient = client
	MongoDatabase = client.Database(cfg.MongoDB.DBName)

	utils.Info("mongodb connected", map[string]any{
		"host": cfg.MongoDB.Host,
		"port": cfg.MongoDB.Port,
		"db":   cfg.MongoDB.DBName,
	})

	return nil
}

// CloseMongo gracefully shuts down the MongoDB connection.
func CloseMongo(ctx context.Context) {
	if MongoClient == nil {
		return
	}
	if err := MongoClient.Disconnect(ctx); err != nil {
		utils.Error("failed to close mongodb connection", err, nil)
	}
	utils.Info("mongodb connection closed", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func connectMongoWithRetry(ctx context.Context, cfg *config.Config, clientOptions *options.ClientOptions) (*mongo.Client, error) {
	var (
		client *mongo.Client
		err    error
	)

	for attempt := 1; attempt <= cfg.MongoDB.RetryAttempts; attempt++ {
		client, err = tryConnectMongo(ctx, cfg, clientOptions)
		if err == nil {
			return client, nil
		}

		utils.Warn(fmt.Sprintf("mongodb connection attempt %d/%d failed", attempt, cfg.MongoDB.RetryAttempts), map[string]any{
			"error": err.Error(),
		})

		if attempt < cfg.MongoDB.RetryAttempts {
			select {
			case <-ctx.Done():
				return nil, fmt.Errorf("mongodb: connect cancelled: %w", ctx.Err())
			case <-time.After(cfg.MongoDB.RetryDelay):
			}
		}
	}

	return nil, err
}

func tryConnectMongo(ctx context.Context, cfg *config.Config, clientOptions *options.ClientOptions) (*mongo.Client, error) {
	connectCtx, cancel := context.WithTimeout(ctx, cfg.MongoDB.ConnectTimeout)
	defer cancel()

	client, err := mongo.Connect(clientOptions)
	if err != nil {
		return nil, err
	}

	if err = client.Ping(connectCtx, readpref.Primary()); err != nil {
		_ = client.Disconnect(connectCtx)
		return nil, err
	}

	return client, nil
}

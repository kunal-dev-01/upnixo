package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"server/internal/app"
	"server/internal/broker"
	"server/internal/config"
	"server/internal/db"
	"server/internal/email"
	"server/internal/middleware"
	rds "server/internal/redis"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

func main() {
	// ── Config ────────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "config load failed: %v\n", err)
		os.Exit(1)
	}

	// ── Logger ────────────────────────────────────────────────────────────────
	utils.Init(cfg)
	log := utils.Get()

	// ── Startup Context ───────────────────────────────────────────────────────
	startCtx, startCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer startCancel()

	// ── Database ──────────────────────────────────────────────────────────────
	if err = db.Connect(startCtx, cfg); err != nil {
		log.Fatal("database connection failed", err, nil)
	}
	defer db.Close()

	// ── Redis ─────────────────────────────────────────────────────────────────
	redisClient := rds.New(cfg)
	if err = redisClient.Connect(startCtx); err != nil {
		log.Fatal("redis connection failed", err, nil)
	}
	defer redisClient.Close()

	// ── RabbitMQ ──────────────────────────────────────────────────────────────
	rabbitBroker := broker.New(cfg)
	if err = rabbitBroker.Connect(startCtx); err != nil {
		log.Fatal("rabbitmq connection failed", err, nil)
	}
	defer rabbitBroker.Close()

	// ── Email ─────────────────────────────────────────────────────────────────
	emailSvc := email.NewEmailService(cfg, rabbitBroker)
	if err = emailSvc.DeclareQueue(); err != nil {
		log.Fatal("email queue declare failed", err, nil)
	}
	if err = email.StartEmailConsumer(cfg, rabbitBroker); err != nil {
		log.Fatal("email consumer start failed", err, nil)
	}

	// ── Wire Dependencies ─────────────────────────────────────────────────────
	deps := app.Wire(cfg, log, redisClient, rabbitBroker, emailSvc)

	// ── Fiber ─────────────────────────────────────────────────────────────────
	fiberApp := fiber.New(fiber.Config{
		AppName:           "Upnixo API",
		ErrorHandler:      middleware.FiberErrorHandler,
		BodyLimit:         cfg.App.RequestBodyLimit,
		ReadTimeout:       cfg.App.ReadTimeout,
		WriteTimeout:      cfg.App.WriteTimeout,
		IdleTimeout:       cfg.App.IdleTimeout,
		EnablePrintRoutes: cfg.App.IsDevelopment(),
	})

	fiberApp.Use(requestid.New())
	fiberApp.Use(compress.New())
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins:     joinStrings(cfg.App.AllowedOrigins),
		AllowMethods:     joinStrings(cfg.App.AllowedMethods),
		AllowHeaders:     joinStrings(cfg.App.AllowedHeaders),
		ExposeHeaders:    joinStrings(cfg.App.ExposedHeaders),
		AllowCredentials: cfg.App.AllowCredentials,
	}))

	app.RegisterRoutes(fiberApp, deps)

	// ── Start + Graceful Shutdown ─────────────────────────────────────────────
	addr := fmt.Sprintf(":%d", cfg.App.Port)

	serverErr := make(chan error, 1)
	go func() {
		log.Info("server starting", map[string]any{"addr": addr, "env": cfg.App.Env})
		serverErr <- fiberApp.Listen(addr)
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err = <-serverErr:
		log.Error("server error", err, nil)
	case sig := <-quit:
		log.Info("shutdown signal received", map[string]any{"signal": sig.String()})
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err = fiberApp.ShutdownWithContext(shutdownCtx); err != nil {
		log.Error("graceful shutdown failed", err, nil)
	}

	log.Info("server stopped", nil)
}

func joinStrings(s []string) string {
	result := ""
	for i, v := range s {
		if i > 0 {
			result += ","
		}
		result += v
	}
	return result
}

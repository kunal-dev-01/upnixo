# ==============================================================================
# Docker Compose Files
# ==============================================================================

DB_COMPOSE     = docker compose -f db/docker/docker-compose.dev.yml
MONGO_COMPOSE  = docker compose -f mongodb/docker/docker-compose.dev.yml
SERVER_COMPOSE = docker compose -f server/docker-compose.dev.yml

# ==============================================================================
# PHONY Targets
# ==============================================================================
.PHONY: db db-down migrate reset admin-create \
        mongo mongo-down \
        redis redis-down rabbitmq rabbitmq-down \
        server-up server-down \
        dev full-up full-down logs \
		app-up

# ==============================================================================
# 🗄️ DATABASE (DB COMPOSE)
# ==============================================================================

db:
	$(DB_COMPOSE) up -d db

db-down:
	$(DB_COMPOSE) down

migrate:
	$(DB_COMPOSE) --profile migrate up migrate

reset:
	$(DB_COMPOSE) down -v
	$(DB_COMPOSE) up -d db
	sleep 3
	$(DB_COMPOSE) --profile migrate up migrate

admin-create:
	@chmod +x db/scripts/admin-create.sh
	@./db/scripts/admin-create.sh

# ==============================================================================
# 🍃 MONGODB (MONGO COMPOSE)
# ==============================================================================

mongo:
	$(MONGO_COMPOSE) up -d mongodb

mongo-down:
	$(MONGO_COMPOSE) down

# ==============================================================================
# ⚡ REDIS + 🐰 RABBITMQ (SERVER COMPOSE)
# ==============================================================================

redis:
	$(SERVER_COMPOSE) up -d redis

redis-down:
	$(SERVER_COMPOSE) stop redis

rabbitmq:
	$(SERVER_COMPOSE) up -d rabbitmq

rabbitmq-down:
	$(SERVER_COMPOSE) stop rabbitmq

# Start both (Redis + RabbitMQ)
server-up:
	$(SERVER_COMPOSE) up -d redis rabbitmq

# Stop both
server-down:
	$(SERVER_COMPOSE) down

# ==============================================================================
# 🚀 FULL DEV SETUP
# ==============================================================================

dev:
	$(DB_COMPOSE) up -d db
	$(MONGO_COMPOSE) up -d mongodb
	$(SERVER_COMPOSE) up -d redis rabbitmq
	sleep 3
	$(DB_COMPOSE) --profile migrate up migrate

full-up:
	$(DB_COMPOSE) up -d db
	$(MONGO_COMPOSE) up -d mongodb
	$(SERVER_COMPOSE) up -d redis rabbitmq

full-down:
	$(DB_COMPOSE) down
	$(MONGO_COMPOSE) down
	$(SERVER_COMPOSE) down

# ==============================================================================
# App
# ==============================================================================
app-up:
	go run server/cmd/main.go


# ==============================================================================
# 📜 LOGS
# ==============================================================================

logs:
	$(DB_COMPOSE) logs -f
	$(MONGO_COMPOSE) logs -f
	$(SERVER_COMPOSE) logs -f
COMPOSE = docker compose -f db/docker/docker-compose.dev.yml

# Start only DB

db:
$(COMPOSE) up -d db

# Run migrations

migrate:
$(COMPOSE) --profile migrate up migrate

# Stop all containers

down:
$(COMPOSE) down

# View logs

logs:
$(COMPOSE) logs -f

# Full dev setup (DB + migrate)

dev:
$(COMPOSE) up -d db
sleep 3
$(COMPOSE) --profile migrate up migrate

# Reset DB (⚠️ deletes all data)

reset:
$(COMPOSE) down -v
$(COMPOSE) up -d db
sleep 3
$(COMPOSE) --profile migrate up migrate

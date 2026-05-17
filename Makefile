.PHONY: help dev-up dev-down logs clean migrate db-shell

help:
	@echo "JobOps Tracker commands:"
	@echo "  make dev-up          Start local development stack"
	@echo "  make dev-down        Stop local development stack"
	@echo "  make logs            Show Docker Compose logs"
	@echo "  make migrate         Apply database migrations"
	@echo "  make db-shell        Open PostgreSQL shell"
	@echo "  make clean           Remove local containers and volumes"

dev-up:
	docker compose -f infra/docker/docker-compose.yml up -d --build

dev-down:
	docker compose -f infra/docker/docker-compose.yml down

logs:
	docker compose -f infra/docker/docker-compose.yml logs -f

migrate:
	@echo "Applying database migrations..."
	@for file in apps/backend/migrations/*.sql; do \
		echo "Applying $$file"; \
		docker exec -i jobops-postgres psql -v ON_ERROR_STOP=1 -U jobops -d jobops < $$file; \
	done
	@echo "Migrations applied successfully."

db-shell:
	docker exec -it jobops-postgres psql -U jobops -d jobops

clean:
	docker compose -f infra/docker/docker-compose.yml down -v --remove-orphans

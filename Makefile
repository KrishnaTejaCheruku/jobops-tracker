.PHONY: help dev-up dev-down logs backend-shell frontend-shell clean

help:
	@echo "JobOps Tracker commands:"
	@echo "  make dev-up          Start local development stack"
	@echo "  make dev-down        Stop local development stack"
	@echo "  make logs            Show Docker Compose logs"
	@echo "  make clean           Remove local containers and volumes"

dev-up:
	docker compose -f infra/docker/docker-compose.yml up -d --build

dev-down:
	docker compose -f infra/docker/docker-compose.yml down

logs:
	docker compose -f infra/docker/docker-compose.yml logs -f

clean:
	docker compose -f infra/docker/docker-compose.yml down -v --remove-orphans

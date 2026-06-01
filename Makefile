.PHONY: help dev-up dev-down logs clean migrate seed seed-dev-test db-shell

help:
	@echo "JobOps Tracker commands:"
	@echo "  make dev-up          Start local development stack"
	@echo "  make dev-down        Stop local development stack"
	@echo "  make logs            Show Docker Compose logs"
	@echo "  make migrate         Apply database migrations"
	@echo "  make seed            Reset and insert demo job application data"
	@echo "  make seed-dev-test   Generate guarded dev/test data: 100 users x 100 applications"
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

seed:
	@echo "Resetting and seeding demo data..."
	docker exec -i jobops-postgres psql -v ON_ERROR_STOP=1 -U jobops -d jobops < apps/backend/seeds/001_demo_applications.sql
	@echo "Demo data seeded successfully."

seed-dev-test:
	@test "$$CONFIRM_DEV_TEST_SEED" = "yes" || (echo "Refusing to seed bulk dev/test data. Run CONFIRM_DEV_TEST_SEED=yes make seed-dev-test"; exit 1)
	@echo "Generating dev/test data: 100 users x 100 applications..."
	docker exec -e PGOPTIONS="-c jobops.allow_dev_test_seed=on" -i jobops-postgres psql -v ON_ERROR_STOP=1 -U jobops -d jobops < apps/backend/seeds/002_dev_test_bulk_data.sql
	@echo "Dev/test data generated successfully."

db-shell:
	docker exec -it jobops-postgres psql -U jobops -d jobops

clean:
	docker compose -f infra/docker/docker-compose.yml down -v --remove-orphans

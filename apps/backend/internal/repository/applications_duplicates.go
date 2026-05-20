package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/jackc/pgx/v5"
)

func (r *ApplicationRepository) FindDuplicateForImport(
	ctx context.Context,
	req models.CreateApplicationRequest,
) (*models.Application, error) {
	jobURL := strings.TrimSpace(req.JobURL)

	if jobURL != "" {
		app, err := scanApplication(r.DB.QueryRow(ctx, `
			SELECT `+applicationSelectColumns+`
			FROM applications
			WHERE LOWER(job_url) = LOWER($1)
			ORDER BY updated_at DESC, id DESC
			LIMIT 1
		`, jobURL))

		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		if err != nil {
			return nil, err
		}

		return app, nil
	}

	companyName := strings.TrimSpace(req.CompanyName)
	jobTitle := strings.TrimSpace(req.JobTitle)

	if companyName == "" || jobTitle == "" {
		return nil, nil
	}

	app, err := scanApplication(r.DB.QueryRow(ctx, `
		SELECT `+applicationSelectColumns+`
		FROM applications
		WHERE LOWER(company_name) = LOWER($1)
		AND LOWER(job_title) = LOWER($2)
		ORDER BY updated_at DESC, id DESC
		LIMIT 1
	`, companyName, jobTitle))

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return app, nil
}

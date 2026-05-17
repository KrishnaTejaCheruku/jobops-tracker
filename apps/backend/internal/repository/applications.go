package repository

import (
	"context"
	"errors"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicationRepository struct {
	DB *pgxpool.Pool
}

func NewApplicationRepository(db *pgxpool.Pool) *ApplicationRepository {
	return &ApplicationRepository{DB: db}
}

func (r *ApplicationRepository) List(ctx context.Context) ([]models.Application, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT
			id,
			job_title,
			company_name,
			source,
			job_url,
			location,
			work_mode,
			status,
			cv_version,
			notes,
			COALESCE(TO_CHAR(applied_date, 'YYYY-MM-DD'), '') AS applied_date,
			created_at,
			updated_at
		FROM applications
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applications := []models.Application{}

	for rows.Next() {
		var app models.Application

		if err := rows.Scan(
			&app.ID,
			&app.JobTitle,
			&app.CompanyName,
			&app.Source,
			&app.JobURL,
			&app.Location,
			&app.WorkMode,
			&app.Status,
			&app.CVVersion,
			&app.Notes,
			&app.AppliedDate,
			&app.CreatedAt,
			&app.UpdatedAt,
		); err != nil {
			return nil, err
		}

		applications = append(applications, app)
	}

	return applications, rows.Err()
}

func (r *ApplicationRepository) GetByID(ctx context.Context, id int64) (*models.Application, error) {
	var app models.Application

	err := r.DB.QueryRow(ctx, `
		SELECT
			id,
			job_title,
			company_name,
			source,
			job_url,
			location,
			work_mode,
			status,
			cv_version,
			notes,
			COALESCE(TO_CHAR(applied_date, 'YYYY-MM-DD'), '') AS applied_date,
			created_at,
			updated_at
		FROM applications
		WHERE id = $1
	`, id).Scan(
		&app.ID,
		&app.JobTitle,
		&app.CompanyName,
		&app.Source,
		&app.JobURL,
		&app.Location,
		&app.WorkMode,
		&app.Status,
		&app.CVVersion,
		&app.Notes,
		&app.AppliedDate,
		&app.CreatedAt,
		&app.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &app, nil
}

func (r *ApplicationRepository) Create(ctx context.Context, req models.CreateApplicationRequest) (*models.Application, error) {
	if req.Source == "" {
		req.Source = "LinkedIn"
	}
	if req.Status == "" {
		req.Status = "Saved"
	}

	var app models.Application

	err := r.DB.QueryRow(ctx, `
		INSERT INTO applications (
			job_title,
			company_name,
			source,
			job_url,
			location,
			work_mode,
			status,
			cv_version,
			notes,
			applied_date
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULLIF($10, '')::date)
		RETURNING
			id,
			job_title,
			company_name,
			source,
			job_url,
			location,
			work_mode,
			status,
			cv_version,
			notes,
			COALESCE(TO_CHAR(applied_date, 'YYYY-MM-DD'), '') AS applied_date,
			created_at,
			updated_at
	`,
		req.JobTitle,
		req.CompanyName,
		req.Source,
		req.JobURL,
		req.Location,
		req.WorkMode,
		req.Status,
		req.CVVersion,
		req.Notes,
		req.AppliedDate,
	).Scan(
		&app.ID,
		&app.JobTitle,
		&app.CompanyName,
		&app.Source,
		&app.JobURL,
		&app.Location,
		&app.WorkMode,
		&app.Status,
		&app.CVVersion,
		&app.Notes,
		&app.AppliedDate,
		&app.CreatedAt,
		&app.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &app, nil
}

func (r *ApplicationRepository) Update(ctx context.Context, id int64, req models.UpdateApplicationRequest) (*models.Application, error) {
	if req.Source == "" {
		req.Source = "LinkedIn"
	}
	if req.Status == "" {
		req.Status = "Saved"
	}

	var app models.Application

	err := r.DB.QueryRow(ctx, `
		UPDATE applications
		SET
			job_title = $1,
			company_name = $2,
			source = $3,
			job_url = $4,
			location = $5,
			work_mode = $6,
			status = $7,
			cv_version = $8,
			notes = $9,
			applied_date = NULLIF($10, '')::date,
			updated_at = NOW()
		WHERE id = $11
		RETURNING
			id,
			job_title,
			company_name,
			source,
			job_url,
			location,
			work_mode,
			status,
			cv_version,
			notes,
			COALESCE(TO_CHAR(applied_date, 'YYYY-MM-DD'), '') AS applied_date,
			created_at,
			updated_at
	`,
		req.JobTitle,
		req.CompanyName,
		req.Source,
		req.JobURL,
		req.Location,
		req.WorkMode,
		req.Status,
		req.CVVersion,
		req.Notes,
		req.AppliedDate,
		id,
	).Scan(
		&app.ID,
		&app.JobTitle,
		&app.CompanyName,
		&app.Source,
		&app.JobURL,
		&app.Location,
		&app.WorkMode,
		&app.Status,
		&app.CVVersion,
		&app.Notes,
		&app.AppliedDate,
		&app.CreatedAt,
		&app.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &app, nil
}

func (r *ApplicationRepository) Delete(ctx context.Context, id int64) (bool, error) {
	result, err := r.DB.Exec(ctx, `DELETE FROM applications WHERE id = $1`, id)
	if err != nil {
		return false, err
	}

	return result.RowsAffected() > 0, nil
}

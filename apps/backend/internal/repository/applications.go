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

type applicationScanner interface {
	Scan(dest ...any) error
}

func NewApplicationRepository(db *pgxpool.Pool) *ApplicationRepository {
	return &ApplicationRepository{DB: db}
}

func scanApplication(scanner applicationScanner) (*models.Application, error) {
	var app models.Application

	err := scanner.Scan(
		&app.ID,
		&app.JobTitle,
		&app.CompanyName,
		&app.Source,
		&app.JobURL,
		&app.Location,
		&app.WorkMode,
		&app.Status,
		&app.CVVersion,
		&app.CVVersionID,
		&app.SalaryRange,
		&app.FollowUpDate,
		&app.RecruiterName,
		&app.RecruiterEmail,
		&app.JobDescription,
		&app.Priority,
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

const applicationSelectColumns = `
	id,
	job_title,
	company_name,
	source,
	job_url,
	location,
	work_mode,
	status,
	cv_version,
	COALESCE(cv_version_id, 0) AS cv_version_id,
	salary_range,
	COALESCE(TO_CHAR(follow_up_date, 'YYYY-MM-DD'), '') AS follow_up_date,
	recruiter_name,
	recruiter_email,
	job_description,
	priority,
	notes,
	COALESCE(TO_CHAR(applied_date, 'YYYY-MM-DD'), '') AS applied_date,
	created_at,
	updated_at
`

func (r *ApplicationRepository) List(ctx context.Context, filters models.ApplicationFilters) ([]models.Application, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT `+applicationSelectColumns+`
		FROM applications
		WHERE
			(
				$1 = ''
				OR job_title ILIKE '%' || $1 || '%'
				OR company_name ILIKE '%' || $1 || '%'
				OR source ILIKE '%' || $1 || '%'
				OR job_url ILIKE '%' || $1 || '%'
				OR location ILIKE '%' || $1 || '%'
				OR work_mode ILIKE '%' || $1 || '%'
				OR status ILIKE '%' || $1 || '%'
				OR cv_version ILIKE '%' || $1 || '%'
				OR salary_range ILIKE '%' || $1 || '%'
				OR recruiter_name ILIKE '%' || $1 || '%'
				OR recruiter_email ILIKE '%' || $1 || '%'
				OR job_description ILIKE '%' || $1 || '%'
				OR priority ILIKE '%' || $1 || '%'
				OR notes ILIKE '%' || $1 || '%'
			)
			AND ($2 = '' OR status = $2)
			AND ($3 = '' OR priority = $3)
			AND ($4 = '' OR source = $4)
			AND ($5 = '' OR work_mode = $5)
		ORDER BY created_at DESC
	`,
		filters.Search,
		filters.Status,
		filters.Priority,
		filters.Source,
		filters.WorkMode,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applications := []models.Application{}

	for rows.Next() {
		app, err := scanApplication(rows)
		if err != nil {
			return nil, err
		}

		applications = append(applications, *app)
	}

	return applications, rows.Err()
}

func (r *ApplicationRepository) GetByID(ctx context.Context, id int64) (*models.Application, error) {
	app, err := scanApplication(r.DB.QueryRow(ctx, `
		SELECT `+applicationSelectColumns+`
		FROM applications
		WHERE id = $1
	`, id))

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return app, nil
}

func (r *ApplicationRepository) Create(ctx context.Context, req models.CreateApplicationRequest) (*models.Application, error) {
	setApplicationDefaults(&req.Source, &req.Status, &req.Priority)

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	app, err := scanApplication(tx.QueryRow(ctx, `
		INSERT INTO applications (
			job_title,
			company_name,
			source,
			job_url,
			location,
			work_mode,
			status,
			cv_version,
			cv_version_id,
			salary_range,
			follow_up_date,
			recruiter_name,
			recruiter_email,
			job_description,
			priority,
			notes,
			applied_date
		)
		VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8,
			NULLIF($9, 0),
			$10, NULLIF($11, '')::date,
			$12, $13, $14, $15,
			$16, NULLIF($17, '')::date
		)
		RETURNING `+applicationSelectColumns,
		req.JobTitle,
		req.CompanyName,
		req.Source,
		req.JobURL,
		req.Location,
		req.WorkMode,
		req.Status,
		req.CVVersion,
		req.CVVersionID,
		req.SalaryRange,
		req.FollowUpDate,
		req.RecruiterName,
		req.RecruiterEmail,
		req.JobDescription,
		req.Priority,
		req.Notes,
		req.AppliedDate,
	))
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO application_status_history (
			application_id,
			old_status,
			new_status,
			note
		)
		VALUES ($1, $2, $3, $4)
	`, app.ID, "", app.Status, "Application created"); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return app, nil
}

func (r *ApplicationRepository) Update(ctx context.Context, id int64, req models.UpdateApplicationRequest) (*models.Application, error) {
	setApplicationDefaults(&req.Source, &req.Status, &req.Priority)

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var currentStatus string
	if err := tx.QueryRow(ctx, `
		SELECT status
		FROM applications
		WHERE id = $1
	`, id).Scan(&currentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	app, err := scanApplication(tx.QueryRow(ctx, `
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
			cv_version_id = NULLIF($9, 0),
			salary_range = $10,
			follow_up_date = NULLIF($11, '')::date,
			recruiter_name = $12,
			recruiter_email = $13,
			job_description = $14,
			priority = $15,
			notes = $16,
			applied_date = NULLIF($17, '')::date,
			updated_at = NOW()
		WHERE id = $18
		RETURNING `+applicationSelectColumns,
		req.JobTitle,
		req.CompanyName,
		req.Source,
		req.JobURL,
		req.Location,
		req.WorkMode,
		req.Status,
		req.CVVersion,
		req.CVVersionID,
		req.SalaryRange,
		req.FollowUpDate,
		req.RecruiterName,
		req.RecruiterEmail,
		req.JobDescription,
		req.Priority,
		req.Notes,
		req.AppliedDate,
		id,
	))
	if err != nil {
		return nil, err
	}

	if currentStatus != app.Status {
		if _, err := tx.Exec(ctx, `
			INSERT INTO application_status_history (
				application_id,
				old_status,
				new_status,
				note
			)
			VALUES ($1, $2, $3, $4)
		`, app.ID, currentStatus, app.Status, "Status updated"); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return app, nil
}

func (r *ApplicationRepository) Delete(ctx context.Context, id int64) (bool, error) {
	result, err := r.DB.Exec(ctx, `DELETE FROM applications WHERE id = $1`, id)
	if err != nil {
		return false, err
	}

	return result.RowsAffected() > 0, nil
}

func (r *ApplicationRepository) ListStatusHistory(ctx context.Context, applicationID int64) ([]models.ApplicationStatusHistory, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT
			id,
			application_id,
			old_status,
			new_status,
			note,
			changed_at
		FROM application_status_history
		WHERE application_id = $1
		ORDER BY changed_at DESC, id DESC
	`, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	history := []models.ApplicationStatusHistory{}

	for rows.Next() {
		var item models.ApplicationStatusHistory

		if err := rows.Scan(
			&item.ID,
			&item.ApplicationID,
			&item.OldStatus,
			&item.NewStatus,
			&item.Note,
			&item.ChangedAt,
		); err != nil {
			return nil, err
		}

		history = append(history, item)
	}

	return history, rows.Err()
}

func setApplicationDefaults(source *string, status *string, priority *string) {
	if *source == "" {
		*source = "LinkedIn"
	}

	if *status == "" {
		*status = "Saved"
	}

	if *priority == "" {
		*priority = "Medium"
	}
}

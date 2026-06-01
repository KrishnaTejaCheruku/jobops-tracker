package repository

import (
	"context"
	"errors"
	"math"
	"strings"

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

const applicationFilterWhereClause = `
	WHERE user_id = $1
		AND (
			$2 = ''
			OR job_title ILIKE '%' || $2 || '%'
			OR company_name ILIKE '%' || $2 || '%'
			OR source ILIKE '%' || $2 || '%'
			OR job_url ILIKE '%' || $2 || '%'
			OR location ILIKE '%' || $2 || '%'
			OR work_mode ILIKE '%' || $2 || '%'
			OR status ILIKE '%' || $2 || '%'
			OR cv_version ILIKE '%' || $2 || '%'
			OR salary_range ILIKE '%' || $2 || '%'
			OR recruiter_name ILIKE '%' || $2 || '%'
			OR recruiter_email ILIKE '%' || $2 || '%'
			OR job_description ILIKE '%' || $2 || '%'
			OR priority ILIKE '%' || $2 || '%'
			OR notes ILIKE '%' || $2 || '%'
		)
		AND ($3 = '' OR status = $3)
		AND ($4 = '' OR priority = $4)
		AND ($5 = '' OR source = $5)
		AND ($6 = '' OR work_mode = $6)
`

func (r *ApplicationRepository) List(ctx context.Context, userID int64, filters models.ApplicationFilters) ([]models.Application, error) {
	orderBy, _, _ := buildApplicationOrderBy(models.ApplicationSort{})

	rows, err := r.DB.Query(ctx, `
		SELECT `+applicationSelectColumns+`
		FROM applications
		`+applicationFilterWhereClause+`
		`+orderBy,
		userID,
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

	return scanApplicationRows(rows)
}

func (r *ApplicationRepository) ListPaginated(
	ctx context.Context,
	userID int64,
	filters models.ApplicationFilters,
	pagination models.ApplicationPagination,
	sort models.ApplicationSort,
) (*models.PaginatedApplicationsResponse, error) {
	page := pagination.Page
	pageSize := pagination.PageSize

	if page < 1 {
		page = 1
	}

	if pageSize < 1 {
		pageSize = 10
	}

	if pageSize > 100 {
		pageSize = 100
	}

	orderBy, normalizedSortBy, normalizedSortOrder := buildApplicationOrderBy(sort)

	totalItems, err := r.Count(ctx, userID, filters)
	if err != nil {
		return nil, err
	}

	offset := (page - 1) * pageSize

	rows, err := r.DB.Query(ctx, `
		SELECT `+applicationSelectColumns+`
		FROM applications
		`+applicationFilterWhereClause+`
		`+orderBy+`
		LIMIT $7 OFFSET $8
	`,
		userID,
		filters.Search,
		filters.Status,
		filters.Priority,
		filters.Source,
		filters.WorkMode,
		pageSize,
		offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applications, err := scanApplicationRows(rows)
	if err != nil {
		return nil, err
	}

	totalPages := 0
	if totalItems > 0 {
		totalPages = int(math.Ceil(float64(totalItems) / float64(pageSize)))
	}

	return &models.PaginatedApplicationsResponse{
		Items:      applications,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
		SortBy:     normalizedSortBy,
		SortOrder:  normalizedSortOrder,
	}, nil
}

func (r *ApplicationRepository) Count(ctx context.Context, userID int64, filters models.ApplicationFilters) (int64, error) {
	var total int64

	err := r.DB.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM applications
		`+applicationFilterWhereClause,
		userID,
		filters.Search,
		filters.Status,
		filters.Priority,
		filters.Source,
		filters.WorkMode,
	).Scan(&total)

	return total, err
}

func scanApplicationRows(rows pgx.Rows) ([]models.Application, error) {
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

func buildApplicationOrderBy(sort models.ApplicationSort) (string, string, string) {
	sortBy := strings.TrimSpace(strings.ToLower(sort.SortBy))
	sortOrder := strings.TrimSpace(strings.ToLower(sort.SortOrder))

	column := "created_at"
	normalizedSortBy := "created_at"

	switch sortBy {
	case "id":
		column = "id"
		normalizedSortBy = "id"
	case "job_title":
		column = "LOWER(job_title)"
		normalizedSortBy = "job_title"
	case "company_name":
		column = "LOWER(company_name)"
		normalizedSortBy = "company_name"
	case "source":
		column = "LOWER(source)"
		normalizedSortBy = "source"
	case "location":
		column = "LOWER(location)"
		normalizedSortBy = "location"
	case "work_mode":
		column = "LOWER(work_mode)"
		normalizedSortBy = "work_mode"
	case "status":
		column = "LOWER(status)"
		normalizedSortBy = "status"
	case "priority":
		column = prioritySortExpression()
		normalizedSortBy = "priority"
	case "salary_range":
		column = "LOWER(salary_range)"
		normalizedSortBy = "salary_range"
	case "follow_up_date":
		column = "follow_up_date"
		normalizedSortBy = "follow_up_date"
	case "applied_date":
		column = "applied_date"
		normalizedSortBy = "applied_date"
	case "recruiter_name":
		column = "LOWER(recruiter_name)"
		normalizedSortBy = "recruiter_name"
	case "cv_version":
		column = "LOWER(cv_version)"
		normalizedSortBy = "cv_version"
	case "updated_at":
		column = "updated_at"
		normalizedSortBy = "updated_at"
	case "created_at", "":
		column = "created_at"
		normalizedSortBy = "created_at"
	}

	normalizedSortOrder := "desc"
	if sortOrder == "asc" {
		normalizedSortOrder = "asc"
	}

	return "ORDER BY " + column + " " + normalizedSortOrder + " NULLS LAST, id DESC", normalizedSortBy, normalizedSortOrder
}

func prioritySortExpression() string {
	return `
		CASE priority
			WHEN 'High' THEN 3
			WHEN 'Medium' THEN 2
			WHEN 'Low' THEN 1
			ELSE 0
		END
	`
}

func (r *ApplicationRepository) GetByID(ctx context.Context, userID int64, id int64) (*models.Application, error) {
	app, err := scanApplication(r.DB.QueryRow(ctx, `
		SELECT `+applicationSelectColumns+`
		FROM applications
		WHERE id = $1
		  AND user_id = $2
	`, id, userID))

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return app, nil
}

func (r *ApplicationRepository) Create(ctx context.Context, userID int64, req models.CreateApplicationRequest) (*models.Application, error) {
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
			user_id,
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
			$1,
			$2, $3, $4, $5,
			$6, $7, $8, $9,
			CASE
				WHEN $10 = 0 THEN NULL
				ELSE (
					SELECT id
					FROM cv_versions
					WHERE id = $10
					  AND user_id = $1
				)
			END,
			$11, NULLIF($12, '')::date,
			$13, $14, $15, $16,
			$17, NULLIF($18, '')::date
		)
		RETURNING `+applicationSelectColumns,
		userID,
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

func (r *ApplicationRepository) Update(ctx context.Context, userID int64, id int64, req models.UpdateApplicationRequest) (*models.Application, error) {
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
		  AND user_id = $2
	`, id, userID).Scan(&currentStatus); err != nil {
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
			cv_version_id = CASE
				WHEN $9 = 0 THEN NULL
				ELSE (
					SELECT id
					FROM cv_versions
					WHERE id = $9
					  AND user_id = $19
				)
			END,
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
		  AND user_id = $19
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
		userID,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

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

func (r *ApplicationRepository) Delete(ctx context.Context, userID int64, id int64) (bool, error) {
	result, err := r.DB.Exec(ctx, `
		DELETE FROM applications
		WHERE id = $1
		  AND user_id = $2
	`, id, userID)
	if err != nil {
		return false, err
	}

	return result.RowsAffected() > 0, nil
}

func (r *ApplicationRepository) ListStatusHistory(ctx context.Context, userID int64, applicationID int64) ([]models.ApplicationStatusHistory, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT
			h.id,
			h.application_id,
			h.old_status,
			h.new_status,
			h.note,
			h.changed_at
		FROM application_status_history h
		INNER JOIN applications a ON a.id = h.application_id
		WHERE h.application_id = $1
		  AND a.user_id = $2
		ORDER BY h.changed_at DESC, h.id DESC
	`, applicationID, userID)
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
	if strings.TrimSpace(*source) == "" {
		*source = "LinkedIn"
	}

	if strings.TrimSpace(*status) == "" {
		*status = "Saved"
	}

	if strings.TrimSpace(*priority) == "" {
		*priority = "Medium"
	}
}

package repository

import (
	"context"
	"errors"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CVVersionRepository struct {
	DB *pgxpool.Pool
}

type cvVersionScanner interface {
	Scan(dest ...any) error
}

func NewCVVersionRepository(db *pgxpool.Pool) *CVVersionRepository {
	return &CVVersionRepository{DB: db}
}

func scanCVVersion(scanner cvVersionScanner) (*models.CVVersion, error) {
	var cv models.CVVersion

	err := scanner.Scan(
		&cv.ID,
		&cv.Name,
		&cv.FocusArea,
		&cv.FilePath,
		&cv.Notes,
		&cv.CreatedAt,
		&cv.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &cv, nil
}

const cvVersionSelectColumns = `
	id,
	name,
	focus_area,
	file_path,
	notes,
	created_at,
	updated_at
`

func (r *CVVersionRepository) List(ctx context.Context) ([]models.CVVersion, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT `+cvVersionSelectColumns+`
		FROM cv_versions
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cvVersions := []models.CVVersion{}

	for rows.Next() {
		cv, err := scanCVVersion(rows)
		if err != nil {
			return nil, err
		}

		cvVersions = append(cvVersions, *cv)
	}

	return cvVersions, rows.Err()
}

func (r *CVVersionRepository) GetByID(ctx context.Context, id int64) (*models.CVVersion, error) {
	cv, err := scanCVVersion(r.DB.QueryRow(ctx, `
		SELECT `+cvVersionSelectColumns+`
		FROM cv_versions
		WHERE id = $1
	`, id))

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return cv, nil
}

func (r *CVVersionRepository) Create(ctx context.Context, req models.CreateCVVersionRequest) (*models.CVVersion, error) {
	cv, err := scanCVVersion(r.DB.QueryRow(ctx, `
		INSERT INTO cv_versions (
			name,
			focus_area,
			file_path,
			notes
		)
		VALUES ($1, $2, $3, $4)
		RETURNING `+cvVersionSelectColumns,
		req.Name,
		req.FocusArea,
		req.FilePath,
		req.Notes,
	))

	if err != nil {
		return nil, err
	}

	return cv, nil
}

func (r *CVVersionRepository) Update(ctx context.Context, id int64, req models.UpdateCVVersionRequest) (*models.CVVersion, error) {
	cv, err := scanCVVersion(r.DB.QueryRow(ctx, `
		UPDATE cv_versions
		SET
			name = $1,
			focus_area = $2,
			file_path = $3,
			notes = $4,
			updated_at = NOW()
		WHERE id = $5
		RETURNING `+cvVersionSelectColumns,
		req.Name,
		req.FocusArea,
		req.FilePath,
		req.Notes,
		id,
	))

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return cv, nil
}

func (r *CVVersionRepository) Delete(ctx context.Context, id int64) (bool, error) {
	result, err := r.DB.Exec(ctx, `DELETE FROM cv_versions WHERE id = $1`, id)
	if err != nil {
		return false, err
	}

	return result.RowsAffected() > 0, nil
}

CREATE TABLE IF NOT EXISTS cv_versions (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    focus_area TEXT NOT NULL DEFAULT '',
    file_path TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS cv_version_id BIGINT REFERENCES cv_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_cv_version_id
    ON applications(cv_version_id);

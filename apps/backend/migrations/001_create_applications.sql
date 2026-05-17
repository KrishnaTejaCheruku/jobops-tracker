CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'LinkedIn',
    job_url TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    work_mode TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Saved',
    cv_version TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    applied_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

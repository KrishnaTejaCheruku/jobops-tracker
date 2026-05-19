CREATE TABLE IF NOT EXISTS application_status_history (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL DEFAULT '',
    new_status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id
    ON application_status_history(application_id);

CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_at
    ON application_status_history(changed_at);

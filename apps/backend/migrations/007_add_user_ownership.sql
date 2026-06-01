CREATE EXTENSION IF NOT EXISTS citext;

INSERT INTO users (email)
VALUES ('demo@jobops.local')
ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE cv_versions
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

UPDATE applications
SET user_id = (SELECT id FROM users WHERE email = 'demo@jobops.local')
WHERE user_id IS NULL;

UPDATE cv_versions
SET user_id = (SELECT id FROM users WHERE email = 'demo@jobops.local')
WHERE user_id IS NULL;

ALTER TABLE applications
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE cv_versions
    ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_user_id
    ON applications(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id_status
    ON applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_user_id_created_at
    ON applications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_versions_user_id
    ON cv_versions(user_id);

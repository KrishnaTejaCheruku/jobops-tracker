ALTER TABLE users
    ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE users
SET display_name = ''
WHERE display_name IS NULL;

ALTER TABLE users
    ALTER COLUMN display_name SET DEFAULT '',
    ALTER COLUMN display_name SET NOT NULL;

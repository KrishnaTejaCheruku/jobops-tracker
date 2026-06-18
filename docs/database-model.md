# Database Model

SQL migrations live in `apps/backend/migrations`.

## Migration Files

```text
001_create_applications.sql
002_add_application_details.sql
003_create_application_status_history.sql
004_create_cv_versions.sql
006_add_auth_tables.sql
007_add_user_ownership.sql
```

There is no `005` migration in the current repository.

## Tables

### `users`

Stores login identities by unique email.

### `user_otps`

Stores hashed OTP values, expiry, verification timestamp, attempts, and max attempts.

### `user_sessions`

Stores hashed session tokens, expiry, and timestamps.

### `applications`

Stores user-owned application records:

```text
job_title
company_name
source
job_url
location
work_mode
status
cv_version
cv_version_id
salary_range
follow_up_date
recruiter_name
recruiter_email
job_description
priority
notes
applied_date
user_id
timestamps
```

### `application_status_history`

Stores status changes for applications. Status history access is scoped through the owning application.

### `cv_versions`

Stores user-owned CV version metadata:

```text
name
focus_area
file_path
notes
user_id
timestamps
```

## User Ownership

Migration `007_add_user_ownership.sql` creates a demo user for existing rows, adds `user_id` to `applications` and `cv_versions`, backfills existing data, sets the columns `NOT NULL`, and adds user-scoped indexes.

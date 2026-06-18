# CSV Import/Export

CSV data portability is implemented for authenticated users.

## Export

Endpoint:

```text
GET /applications/export.csv
```

The frontend exposes an `Export CSV` link. The backend returns the authenticated user's applications as `text/csv`.

## Import

Endpoint:

```text
POST /applications/import.csv
```

Upload a CSV file in multipart form field `file`.

Import behavior:

- Applies defaults for missing source, status, priority, and applied date.
- Validates application fields with the same backend validation used by create/update.
- Detects duplicates for the authenticated user.
- Creates new rows when no duplicate exists.
- Updates duplicate rows when the CSV values differ.
- Skips duplicate rows when values are identical.
- Reports failed rows and validation messages.

## Headers

Supported export/import headers:

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
```

## Limitations

CSV import does not upload CV files. `cv_version_id` must reference an existing CV version for the user when used.

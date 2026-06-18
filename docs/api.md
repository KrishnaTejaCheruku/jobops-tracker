# API Reference

The Go backend is implemented in `apps/backend/cmd/api/main.go` and uses JSON except for CSV import/export.

## Base URLs

Local:

```text
http://localhost:8000
```

Production through Caddy:

```text
https://jobops.me/api
```

## Public Endpoints

### `GET /`

Returns API metadata.

### `GET /health`

Returns service and database health.

### `GET /metrics`

Returns Prometheus-compatible metrics.

### `POST /auth/request-otp`

Request:

```json
{ "email": "user@example.com" }
```

Response:

```json
{ "message": "OTP generated successfully." }
```

Development responses may include `debug_otp`.

### `POST /auth/verify-otp`

Request:

```json
{ "email": "user@example.com", "otp": "123456" }
```

Response sets an HttpOnly session cookie and returns:

```json
{ "user": { "id": 1, "email": "user@example.com" } }
```

### `GET /auth/me`

Returns the current user when the session cookie is valid.

### `POST /auth/logout`

Deletes the server-side session and clears the cookie.

### `POST /capture/analyze`

Accepts JSON capture data and forwards it to the OCR service when capture analysis is enabled.

Request:

```json
{
  "url": "https://company.example/jobs/123",
  "title": "DevOps Engineer",
  "selected_text": "",
  "dom_text": "Visible job text",
  "screenshot_base64": "data:image/png;base64,..."
}
```

Response:

```json
{
  "job_title": "DevOps Engineer",
  "company_name": "Example GmbH",
  "source": "Company Website",
  "job_url": "https://company.example/jobs/123",
  "location": "Hamburg, Germany",
  "work_mode": "Hybrid",
  "status": "Saved",
  "priority": "Medium",
  "salary_range": "",
  "notes": "Extracted from screenshot. Please review before saving.",
  "confidence": {
    "job_title": 0.8,
    "company_name": 0.7,
    "location": 0.6
  }
}
```

The analyze endpoint does not save applications.

## Authenticated Endpoints

These endpoints require the session cookie.

### Applications

```text
GET    /applications
POST   /applications
GET    /applications/export.csv
POST   /applications/import.csv
GET    /applications/:id
PUT    /applications/:id
DELETE /applications/:id
GET    /applications/:id/status-history
```

`GET /applications` supports:

```text
search
status
priority
source
work_mode
page
page_size
sort_by
sort_order
```

### CV Versions

```text
GET    /cv-versions
POST   /cv-versions
GET    /cv-versions/:id
PUT    /cv-versions/:id
DELETE /cv-versions/:id
```

### Dashboard

```text
GET /dashboard/analytics
```

Returns user-scoped totals and grouped analytics.

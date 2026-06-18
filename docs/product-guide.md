# Product Guide

JobOps Tracker is a private workspace for managing job-search data.

## Login

The public page uses passwordless OTP authentication:

1. Enter an email address.
2. Request a six-digit code.
3. Verify the code.
4. Continue into the dashboard.

Development mode returns a `debug_otp` in the API response and the frontend displays it. Production is expected to use SMTP delivery.

## Dashboard

The dashboard shows:

- Pipeline snapshot.
- Pipeline breakdown.
- Applications over time.
- Upcoming follow-ups.
- Recent activity.
- CV version summary.
- Analytics view.

Dashboard-wide counts come from `GET /dashboard/analytics`; the applications table uses paginated `/applications` responses.

## Applications

Applications include:

- Job title and company.
- Source and job URL.
- Location and work mode.
- Status and priority.
- CV version fields.
- Salary range.
- Follow-up date.
- Recruiter fields.
- Job description and notes.
- Applied date.

Users can create, update, delete, view details, search, filter, sort, and paginate applications.

## Pipeline Statuses

Supported statuses are:

```text
Saved
Applied
In Progress
Interview
Follow-up
Offer
Rejected
Withdrawn
```

The dashboard treats `Saved`, `Applied`, `In Progress`, `Interview`, `Follow-up`, and `Offer` as active statuses. `Rejected` and `Withdrawn` are closed statuses.

## Follow-Ups

Applications can include a follow-up date. The frontend groups follow-ups as overdue, due today, or upcoming.

## CV Versions

CV versions include a name, focus area, file path, and notes. Applications can reference a CV version through `cv_version_id`.

## Analytics

Analytics include totals, active and closed counts, status/source/work-mode/priority counts, top companies, recent applications, and applications over time.

## CSV Import/Export

The app exports user applications as CSV. CSV import creates new rows, updates detected duplicates, skips identical rows, and reports row-level errors.

See [CSV import/export](csv-import-export.md).

## Capture Workflow

Capture options:

- Paste a job URL manually and review before saving.
- Import CSV data.
- Use the browser extension to capture the visible page, selected text, visible DOM text, and screenshot.

The browser extension sends the capture to `POST /capture/analyze`. The backend forwards it to the OCR service and returns normalized fields. The frontend opens a review modal before saving.

OCR-assisted capture is not a fully automatic database write. Users must review and save.

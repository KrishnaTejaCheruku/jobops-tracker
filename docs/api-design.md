# API Design Notes

The current route reference is [API reference](api.md). This file exists to keep older documentation links from breaking.

## Design Principles In The Current Code

- JSON APIs for application, CV, dashboard, auth, and capture analyze flows.
- CSV endpoints only for application import/export.
- Authenticated resources are scoped by session user ID.
- Validation errors return structured field details for application create/update.
- Capture analyze is separate from application save, so OCR-assisted extraction remains review-before-save.

For exact routes and examples, see [api.md](api.md).

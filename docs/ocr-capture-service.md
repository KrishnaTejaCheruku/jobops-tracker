# OCR Capture Service

The OCR service lives in `apps/capture-ocr-service`.

## Runtime

The service is a FastAPI app with:

```text
GET  /health
POST /analyze
```

Local Docker Compose exposes it on `http://localhost:8090`.

## Analyze Request

```json
{
  "url": "https://company.example/jobs/123",
  "title": "DevOps Engineer",
  "selected_text": "",
  "dom_text": "Visible page text",
  "screenshot_base64": "data:image/png;base64,..."
}
```

## Extraction Behavior

The service combines selected text, DOM text, OCR text, title, and URL. It extracts:

- Job title.
- Company name.
- Source.
- Job URL.
- Location.
- Work mode.
- Salary range.
- Confidence values.

Default returned fields include:

```text
status=Saved
priority=Medium
notes=Extracted from screenshot. Please review before saving.
```

## OCR Policy

The service runs screenshot OCR only when a screenshot exists and selected text, DOM text, and title together are shorter than 200 characters.

PaddleOCR is configured with English language OCR in `apps/capture-ocr-service/app/ocr.py`.

## Security And Privacy

The service processes request data and returns extracted fields. Current repository code does not persist screenshots to disk or database.

The backend still requires review-before-save in the frontend before captured fields become an application record.

## Validation

```bash
python3 -m compileall apps/capture-ocr-service/app
```

Unit tests can be run with pytest when dependencies are installed:

```bash
python3 -m pytest apps/capture-ocr-service/app
```

## Limitations

- Extraction is heuristic.
- OCR may be skipped when enough DOM text is available.
- No full-page screenshot stitching is implemented.
- No automatic database write is performed.

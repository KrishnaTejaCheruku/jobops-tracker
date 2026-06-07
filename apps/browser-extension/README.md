# JobOps Capture Browser Extension

Chrome Manifest V3 extension for Phase 1 JobOps Capture.

## Install Locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `apps/browser-extension`.

## Production Settings

- JobOps app URL: `https://jobops.me`
- JobOps API URL: `https://jobops.me/api`

## Local Settings

- JobOps app URL: `http://localhost:5173`
- JobOps API URL: `http://localhost:8000`

## Manual Test

1. Open a visible job page, for example LinkedIn.
2. Click the JobOps Capture extension.
3. Confirm the app and API URLs.
4. Click Capture.
5. The extension opens `/capture?payload=...` in JobOps.
6. Review and save through the existing CaptureReviewModal.

The extension captures the visible tab screenshot, current URL, page title, selected text, and visible body text. It does not collect cookies, tokens, hidden inputs, or full page HTML.

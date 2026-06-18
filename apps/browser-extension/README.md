# JobOps Capture Browser Extension

Manifest V3 browser extension for JobOps Capture. It supports Chrome, Microsoft
Edge, and Firefox release packages.

The extension is user-initiated: it captures the active visible job page after
the user clicks Capture, sends the capture to the JobOps OCR endpoint, then
opens JobOps with a reviewable `/capture?payload=...` URL.

## Build and Test

```bash
npm --prefix apps/browser-extension test
npm --prefix apps/browser-extension run validate
npm --prefix apps/browser-extension run package
```

Release packages are written to:

```text
apps/browser-extension/dist/jobops-capture-0.1.0-chrome.zip
apps/browser-extension/dist/jobops-capture-0.1.0-edge.zip
apps/browser-extension/dist/jobops-capture-0.1.0-firefox.zip
```

The generated package manifests use PNG icons. The source manifest keeps a small
SVG icon for local development.

## Install Locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `apps/browser-extension/dist/chrome` after running the package command.

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

## Permissions

- `activeTab`: grants temporary access to the active page after the user clicks Capture.
- `scripting`: injects `content.js` into the active tab after the click.
- `tabs`: reads the active tab, captures the visible tab, and opens the JobOps review tab.
- `storage`: saves the JobOps app/API URL settings.
- Host permissions are limited to JobOps production and local development API origins.

The extension does not request `<all_urls>`.

## Publishing

See [Browser extension publishing](../../docs/browser-extension-publishing.md).

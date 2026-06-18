# Browser Extension

The browser extension lives in `apps/browser-extension`.

## Behavior

The extension is user-initiated:

1. User opens a job page.
2. User clicks the JobOps Capture extension.
3. Extension injects `content.js`.
4. Extension collects page URL, title, selected text, visible DOM text, and visible tab screenshot.
5. Extension posts JSON to the configured JobOps API `/capture/analyze`.
6. The API returns extracted fields.
7. Extension opens JobOps at `/capture?payload=...`.
8. User reviews and saves in the JobOps app.

The extension does not save applications directly.

## Permissions

Current source manifest permissions:

```text
activeTab
scripting
tabs
storage
```

Host permissions are limited to JobOps production and local API origins. The extension does not request `<all_urls>`.

## Build And Test

```bash
npm --prefix apps/browser-extension test
npm --prefix apps/browser-extension run validate
npm --prefix apps/browser-extension run package
```

Package output:

```text
apps/browser-extension/dist/jobops-capture-0.1.0-chrome.zip
apps/browser-extension/dist/jobops-capture-0.1.0-edge.zip
apps/browser-extension/dist/jobops-capture-0.1.0-firefox.zip
```

## Local Installation

1. Run the package command.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load `apps/browser-extension/dist/chrome`.
5. Set app URL to `https://jobops.me` or a local frontend URL.
6. Set API URL to `https://jobops.me/api` or `http://localhost:8000`.

## Privacy Notes

Captured data includes visible tab screenshot, current URL, page title, selected text, and visible page text after the user clicks Capture.

The extension code skips hidden text, scripts, styles, and form fields when collecting DOM text.

## Limitations

- Capture is visible-tab only.
- Extraction is OCR-assisted and heuristic.
- Users must review fields before saving.
- Store publishing requires external store accounts and privacy declarations.

See [Browser extension publishing](browser-extension-publishing.md).

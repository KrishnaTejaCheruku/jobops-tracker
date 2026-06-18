# Browser Extension Publishing Runbook

This runbook covers permanent store distribution for JobOps Capture. Store
publishing cannot be completed from the local repository alone because Chrome
Web Store, Microsoft Edge Add-ons, and Firefox AMO require owner accounts,
listing assets, privacy declarations, and final submit approval.

Official publishing references:

- Chrome Web Store: https://developer.chrome.com/docs/webstore/publish/
- Chrome package preparation: https://developer.chrome.com/docs/webstore/prepare/
- Chrome privacy policy requirements: https://developer.chrome.com/docs/webstore/program-policies/privacy/
- Microsoft Edge Add-ons: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- Firefox AMO: https://extensionworkshop.com/documentation/publish/submitting-an-add-on/
- Firefox MV3 browser-specific settings: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings

## Release Artifacts

Build from the repository root:

```bash
npm --prefix apps/browser-extension test
npm --prefix apps/browser-extension run validate
npm --prefix apps/browser-extension run package
```

Upload these ZIP files:

```text
Chrome Web Store:     apps/browser-extension/dist/jobops-capture-0.1.0-chrome.zip
Microsoft Edge:       apps/browser-extension/dist/jobops-capture-0.1.0-edge.zip
Firefox AMO:          apps/browser-extension/dist/jobops-capture-0.1.0-firefox.zip
```

Each ZIP has `manifest.json` at the archive root. The Firefox package includes
`browser_specific_settings.gecko.id` and required data-collection permissions.

## Pre-Submission Checklist

1. Confirm production `https://jobops.me/api/capture/analyze` is enabled and healthy.
2. Publish or update the JobOps privacy policy URL before store submission.
3. Increment `apps/browser-extension/manifest.json` and `apps/browser-extension/package.json` versions for every release.
4. Run the test, validation, and package commands above.
5. Load `dist/chrome` locally in Chrome and Edge and run a capture on a public job posting.
6. Load `dist/firefox` temporarily in Firefox and run the same capture smoke test.
7. Prepare store screenshots that show the popup, a public job posting, and the JobOps review modal.
8. Prepare reviewer instructions and, if reviewers must save a job, provide an OTP-capable test account path.

## Store Listing Draft

Name:

```text
JobOps Capture
```

Short description:

```text
Capture visible job pages and send them to JobOps for OCR-assisted review.
```

Single purpose:

```text
JobOps Capture lets a user capture the currently visible job posting and open it in JobOps Tracker for review before saving it to their application pipeline.
```

Long description:

```text
JobOps Capture is the browser companion for JobOps Tracker. Click Capture on a job posting to send the visible page screenshot, page URL, page title, selected text, and visible page text to the JobOps OCR endpoint. JobOps returns structured job fields and opens a review screen so the user can edit the result before saving.

The extension only runs after the user clicks Capture. It does not collect cookies, passwords, hidden form values, full page HTML, or background browsing history.
```

## Privacy Declaration

Data collected or transmitted by the extension:

- Website content: visible tab screenshot, selected text, and visible page text from the active page after the user clicks Capture.
- Website activity: current page URL and title for the active page after the user clicks Capture.
- User settings: JobOps app URL and API URL stored in browser sync storage.

Use of data:

```text
Captured data is sent to the configured JobOps API only to extract job application fields and open a user-reviewable capture payload. Data is not sold, used for advertising, or used for unrelated tracking.
```

Chrome Web Store privacy policy requirement:

```text
Because this extension handles user data, the Chrome listing must include an accurate privacy policy URL that discloses collection, use, sharing, and all parties that receive the data.
```

## Permission Justifications

`activeTab`:

```text
Grants temporary access to the active job page only after the user clicks Capture.
```

`scripting`:

```text
Injects the local content script into the active tab to read visible page text after the user clicks Capture.
```

`tabs`:

```text
Finds the active tab, captures the visible tab screenshot, and opens the JobOps review page.
```

`storage`:

```text
Stores the JobOps app URL and API URL settings.
```

Host permissions:

```text
Allow the extension popup to call the JobOps API on https://jobops.me and local development API origins. The extension does not request <all_urls>.
```

## Reviewer Test Instructions

```text
1. Install the submitted extension package.
2. Open a public job posting page.
3. Click the JobOps Capture extension icon.
4. Keep the default URLs:
   JobOps app URL: https://jobops.me
   JobOps API URL: https://jobops.me/api
5. Click Capture.
6. Expected result: a new JobOps tab opens at /capture?payload=... with extracted job fields ready for review.

No credentials are required to test the extension capture and handoff. Saving the reviewed job in JobOps requires passwordless OTP authentication.
```

## Store Steps

Chrome Web Store:

1. Sign in to the Chrome Web Store Developer Dashboard.
2. Add a new item and upload `jobops-capture-0.1.0-chrome.zip`.
3. Complete Store Listing, Privacy, Distribution, and Test Instructions.
4. Submit for review. Use deferred publishing if you want manual control after approval.

Microsoft Edge Add-ons:

1. Sign in to Partner Center and create a new Edge extension.
2. Upload `jobops-capture-0.1.0-edge.zip`.
3. Complete availability, properties, privacy, store listing, and certification notes.
4. Submit for certification.

Firefox AMO:

1. Sign in to addons.mozilla.org and submit a new add-on.
2. Upload `jobops-capture-0.1.0-firefox.zip`.
3. Complete listing, privacy, and review details.
4. Submit for review/signing.

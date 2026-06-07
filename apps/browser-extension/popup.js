const DEFAULT_APP_URL = "https://jobops.me";
const DEFAULT_API_URL = "https://jobops.me/api";

const appURLInput = document.getElementById("app-url");
const apiURLInput = document.getElementById("api-url");
const captureButton = document.getElementById("capture-button");
const statusEl = document.getElementById("status");

init();

async function init() {
  const settings = await chrome.storage.sync.get({
    appURL: DEFAULT_APP_URL,
    apiURL: DEFAULT_API_URL,
  });

  appURLInput.value = settings.appURL;
  apiURLInput.value = settings.apiURL;
  captureButton.addEventListener("click", captureCurrentTab);
}

async function captureCurrentTab() {
  setStatus("Capturing page...");
  captureButton.disabled = true;

  try {
    const appURL = normalizeBaseURL(appURLInput.value || DEFAULT_APP_URL);
    const apiURL = normalizeBaseURL(apiURLInput.value || DEFAULT_API_URL);

    await chrome.storage.sync.set({ appURL, apiURL });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error("No active tab found.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    const [pageDataResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.jobOpsCaptureCollectPageData(),
    });

    const screenshotBase64 = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });

    const analyzeResponse = await fetch(`${apiURL}/capture/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        ...pageDataResult.result,
        screenshot_base64: screenshotBase64,
      }),
    });

    if (!analyzeResponse.ok) {
      throw new Error(`Analyze failed with status ${analyzeResponse.status}.`);
    }

    const payload = await analyzeResponse.json();
    const encodedPayload = encodeBase64URL(JSON.stringify(payload));
    await chrome.tabs.create({
      url: `${appURL}/capture?payload=${encodedPayload}`,
    });

    setStatus("Capture opened in JobOps.");
  } catch (error) {
    setStatus(error.message || "Capture failed.", true);
  } finally {
    captureButton.disabled = false;
  }
}

function normalizeBaseURL(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function encodeBase64URL(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

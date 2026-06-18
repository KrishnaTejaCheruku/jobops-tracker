(function (global) {
  const {
    DEFAULT_APP_URL,
    DEFAULT_API_URL,
    buildCaptureURL,
    normalizeAPIURL,
    normalizeAppURL,
  } = global.jobOpsCaptureUtils;

  function createPopupController({ documentRef, extensionAPI, fetchImpl }) {
    const appURLInput = documentRef.getElementById("app-url");
    const apiURLInput = documentRef.getElementById("api-url");
    const captureButton = documentRef.getElementById("capture-button");
    const statusEl = documentRef.getElementById("status");

    async function init() {
      const settings = await extensionAPI.storageGet({
        appURL: DEFAULT_APP_URL,
        apiURL: DEFAULT_API_URL,
      });

      appURLInput.value = settings.appURL || DEFAULT_APP_URL;
      apiURLInput.value = settings.apiURL || DEFAULT_API_URL;
      captureButton.addEventListener("click", captureCurrentTab);
    }

    async function captureCurrentTab() {
      setStatus("Capturing page...");
      captureButton.disabled = true;

      try {
        const appURL = normalizeAppURL(appURLInput.value || DEFAULT_APP_URL);
        const apiURL = normalizeAPIURL(apiURLInput.value || DEFAULT_API_URL);

        await extensionAPI.storageSet({ appURL, apiURL });

        const [tab] = await extensionAPI.tabsQuery({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          throw new Error("No active tab found.");
        }

        await extensionAPI.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });

        const [pageDataResult] = await extensionAPI.executeScript({
          target: { tabId: tab.id },
          func: () => window.jobOpsCaptureCollectPageData(),
        });

        if (!pageDataResult || !pageDataResult.result) {
          throw new Error("Could not read the current page.");
        }

        const screenshotBase64 = await extensionAPI.captureVisibleTab(tab.windowId, {
          format: "png",
        });

        const analyzeResponse = await fetchImpl(`${apiURL}/capture/analyze`, {
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
        await extensionAPI.tabsCreate({
          url: buildCaptureURL(appURL, payload),
        });

        setStatus("Capture opened in JobOps.");
      } catch (error) {
        setStatus(error.message || "Capture failed.", true);
      } finally {
        captureButton.disabled = false;
      }
    }

    function setStatus(message, isError = false) {
      statusEl.textContent = message;
      statusEl.classList.toggle("error", isError);
    }

    return {
      init,
      captureCurrentTab,
      setStatus,
    };
  }

  global.jobOpsPopup = {
    createPopupController,
  };

  if (global.document && global.jobOpsExtension && global.fetch) {
    const controller = createPopupController({
      documentRef: global.document,
      extensionAPI: global.jobOpsExtension,
      fetchImpl: global.fetch.bind(global),
    });

    controller.init().catch((error) => {
      controller.setStatus(error.message || "Failed to initialize extension.", true);
    });
  }
})(globalThis);

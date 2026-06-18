import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadPopup() {
  const sandbox = {
    URL,
    TextEncoder,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(await fs.readFile(path.join(rootDir, "capture-utils.js"), "utf8"), sandbox);
  vm.runInContext(await fs.readFile(path.join(rootDir, "popup.js"), "utf8"), sandbox);
  return sandbox;
}

function createElement(value = "") {
  return {
    value,
    disabled: false,
    textContent: "",
    listeners: new Map(),
    classList: {
      classes: new Set(),
      toggle(className, force) {
        if (force) {
          this.classes.add(className);
        } else {
          this.classes.delete(className);
        }
      },
    },
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    },
  };
}

function createDocument(elements) {
  return {
    getElementById(id) {
      return elements[id];
    },
  };
}

test("captures the current tab and opens a JobOps review URL", async () => {
  const sandbox = await loadPopup();
  const elements = {
    "app-url": createElement("https://jobops.me/"),
    "api-url": createElement("https://jobops.me/api/"),
    "capture-button": createElement(),
    status: createElement(),
  };
  const openedTabs = [];
  const fetchCalls = [];
  const extensionAPI = {
    async storageGet(defaults) {
      return defaults;
    },
    async storageSet(values) {
      assert.equal(values.appURL, "https://jobops.me");
      assert.equal(values.apiURL, "https://jobops.me/api");
    },
    async tabsQuery() {
      return [{ id: 123, windowId: 456 }];
    },
    async executeScript(details) {
      if (details.files) {
        return [];
      }

      return [{
        result: {
          title: "DevOps Engineer",
          url: "https://www.linkedin.com/jobs/view/123",
          selected_text: "",
          dom_text: "DevOps Engineer Star Finanz Hamburg",
        },
      }];
    },
    async captureVisibleTab(windowId, options) {
      assert.equal(windowId, 456);
      assert.equal(options.format, "png");
      return "data:image/png;base64,abc123";
    },
    async tabsCreate(tab) {
      openedTabs.push(tab);
    },
  };
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      async json() {
        return {
          job_title: "DevOps Engineer",
          company_name: "Star Finanz",
        };
      },
    };
  };
  const controller = sandbox.jobOpsPopup.createPopupController({
    documentRef: createDocument(elements),
    extensionAPI,
    fetchImpl,
  });

  await controller.init();
  await controller.captureCurrentTab();

  assert.equal(fetchCalls[0].url, "https://jobops.me/api/capture/analyze");
  assert.equal(JSON.parse(fetchCalls[0].options.body).screenshot_base64, "data:image/png;base64,abc123");
  assert.equal(openedTabs.length, 1);
  assert.match(openedTabs[0].url, /^https:\/\/jobops\.me\/capture\?payload=/);
  assert.equal(elements.status.textContent, "Capture opened in JobOps.");
  assert.equal(elements["capture-button"].disabled, false);
});

test("shows a validation error before sending data to an unapproved API host", async () => {
  const sandbox = await loadPopup();
  const elements = {
    "app-url": createElement("https://jobops.me"),
    "api-url": createElement("https://example.com/api"),
    "capture-button": createElement(),
    status: createElement(),
  };
  let fetchCalled = false;
  const extensionAPI = {
    async storageGet(defaults) {
      return defaults;
    },
    async storageSet() {
      throw new Error("storage should not be called for invalid settings");
    },
  };
  const controller = sandbox.jobOpsPopup.createPopupController({
    documentRef: createDocument(elements),
    extensionAPI,
    fetchImpl: async () => {
      fetchCalled = true;
    },
  });

  await controller.captureCurrentTab();

  assert.equal(fetchCalled, false);
  assert.equal(elements.status.textContent, "Enter a valid JobOps API URL.");
  assert.equal(elements.status.classList.classes.has("error"), true);
  assert.equal(elements["capture-button"].disabled, false);
});

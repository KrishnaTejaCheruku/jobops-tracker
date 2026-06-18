import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runContentScript(nodes, selection = "selected words") {
  const NodeFilter = {
    SHOW_TEXT: 4,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
  };
  const sandbox = {
    Node: {
      ELEMENT_NODE: 1,
    },
    NodeFilter,
  };
  const windowRef = {
    location: {
      href: "https://www.linkedin.com/jobs/view/123",
    },
    getSelection() {
      return selection;
    },
    getComputedStyle(element) {
      return element.style || { display: "block", visibility: "visible", opacity: "1" };
    },
  };
  const documentRef = {
    body: element("body"),
    title: "Example job",
    createTreeWalker(_root, _what, filter) {
      const acceptedNodes = nodes.filter((node) => filter.acceptNode(node) === NodeFilter.FILTER_ACCEPT);
      let index = 0;
      return {
        nextNode() {
          const node = acceptedNodes[index];
          index += 1;
          return node || null;
        },
      };
    },
  };

  sandbox.window = windowRef;
  sandbox.document = documentRef;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(await fs.readFile(path.join(rootDir, "content.js"), "utf8"), sandbox);
  return sandbox.window.jobOpsCaptureCollectPageData();
}

function element(tagName, options = {}) {
  return {
    nodeType: 1,
    tagName,
    style: options.style || { display: "block", visibility: "visible", opacity: "1" },
    getBoundingClientRect() {
      return {
        width: options.width ?? 100,
        height: options.height ?? 20,
      };
    },
  };
}

function textNode(nodeValue, parentElement = element("div")) {
  return {
    nodeValue,
    parentElement,
  };
}

test("collects visible job text and skips hidden or form content", async () => {
  const data = await runContentScript([
    textNode("DevOps Engineer"),
    textNode("Hidden salary", element("div", { style: { display: "none", visibility: "visible", opacity: "1" } })),
    textNode("secret token", element("input")),
    textNode("Star Finanz"),
    textNode("console.log('ignore')", element("script")),
  ]);

  assert.equal(data.title, "Example job");
  assert.equal(data.url, "https://www.linkedin.com/jobs/view/123");
  assert.equal(data.selected_text, "selected words");
  assert.match(data.dom_text, /DevOps Engineer/);
  assert.match(data.dom_text, /Star Finanz/);
  assert.doesNotMatch(data.dom_text, /Hidden salary/);
  assert.doesNotMatch(data.dom_text, /secret token/);
});

test("caps visible text and selected text to the extension limit", async () => {
  const longText = "A".repeat(20000);
  const data = await runContentScript([textNode(longText)], "B".repeat(20000));

  assert.equal(data.dom_text.length, 15000);
  assert.equal(data.selected_text.length, 15000);
});

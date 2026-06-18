import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadUtils() {
  const sandbox = {
    URL,
    TextEncoder,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(await fs.readFile(path.join(rootDir, "capture-utils.js"), "utf8"), sandbox);
  return sandbox.jobOpsCaptureUtils;
}

function decodePayloadFromURL(value) {
  const payload = new URL(value).searchParams.get("payload");
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

test("normalizes allowed production and local JobOps URLs", async () => {
  const utils = await loadUtils();

  assert.equal(utils.normalizeAppURL(" https://jobops.me/// "), "https://jobops.me");
  assert.equal(utils.normalizeAPIURL("http://localhost:8000/api/"), "http://localhost:8000/api");
  assert.equal(utils.normalizeAPIURL("http://127.0.0.1:8000"), "http://127.0.0.1:8000");
});

test("rejects non-JobOps and credentialed endpoints", async () => {
  const utils = await loadUtils();

  assert.throws(() => utils.normalizeAPIURL("https://example.com/api"), /valid JobOps API URL/);
  assert.throws(() => utils.normalizeAPIURL("https://user:pass@jobops.me/api"), /valid JobOps API URL/);
  assert.throws(() => utils.normalizeAPIURL("http://jobops.me/api"), /valid JobOps API URL/);
});

test("builds base64url capture URLs without losing Unicode payload content", async () => {
  const utils = await loadUtils();
  const payload = {
    job_title: "DevOps Engineer",
    company_name: "München Cloud",
    location: "Hamburg, Germany",
  };

  const captureURL = utils.buildCaptureURL("https://jobops.me", payload);

  assert.match(captureURL, /^https:\/\/jobops\.me\/capture\?payload=/);
  assert.deepEqual(decodePayloadFromURL(captureURL), payload);
  assert.doesNotMatch(new URL(captureURL).searchParams.get("payload"), /[+/=]/);
});

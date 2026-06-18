import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedHostPermissions = new Set([
  "https://jobops.me/*",
  "https://www.jobops.me/*",
  "http://localhost:8000/*",
  "http://127.0.0.1:8000/*",
]);
const requiredPermissions = new Set(["activeTab", "scripting", "tabs", "storage"]);

async function main() {
  await validateExtensionDirectory(rootDir, "source");
  await validatePackageVersion();

  const distDir = path.join(rootDir, "dist");
  for (const target of ["chrome", "edge", "firefox"]) {
    const targetDir = path.join(distDir, target);
    if (await exists(targetDir)) {
      await validateExtensionDirectory(targetDir, target);
    }
  }

  console.log("Browser extension validation passed.");
}

async function validatePackageVersion() {
  const manifest = JSON.parse(await fs.readFile(path.join(rootDir, "manifest.json"), "utf8"));
  const packageJSON = JSON.parse(await fs.readFile(path.join(rootDir, "package.json"), "utf8"));
  assert(
    manifest.version === packageJSON.version,
    `source: manifest version ${manifest.version} must match package version ${packageJSON.version}`,
  );
}

async function validateExtensionDirectory(extensionDir, target) {
  const manifestPath = path.join(extensionDir, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  assert(manifest.manifest_version === 3, `${target}: manifest_version must be 3`);
  assert(/^(\d+\.){1,3}\d+$/.test(manifest.version), `${target}: version must be Chrome-compatible dotted integers`);
  assert(manifest.description.length <= 132, `${target}: description must be 132 characters or less`);

  for (const permission of requiredPermissions) {
    assert(manifest.permissions.includes(permission), `${target}: missing ${permission} permission`);
  }

  assert(!manifest.host_permissions.includes("<all_urls>"), `${target}: <all_urls> host permission is not store-ready`);
  for (const hostPermission of manifest.host_permissions) {
    assert(allowedHostPermissions.has(hostPermission), `${target}: unexpected host permission ${hostPermission}`);
  }

  await validateReferencedFile(extensionDir, manifest.action.default_popup, `${target}: default popup`);
  for (const iconPath of Object.values(manifest.icons || {})) {
    await validateReferencedFile(extensionDir, iconPath, `${target}: icon`);
  }
  for (const iconPath of Object.values((manifest.action && manifest.action.default_icon) || {})) {
    await validateReferencedFile(extensionDir, iconPath, `${target}: action icon`);
  }

  if (target === "firefox") {
    const gecko = manifest.browser_specific_settings && manifest.browser_specific_settings.gecko;
    assert(gecko && gecko.id, "firefox: browser_specific_settings.gecko.id is required");
    assert(
      gecko.data_collection_permissions &&
        Array.isArray(gecko.data_collection_permissions.required) &&
        gecko.data_collection_permissions.required.includes("websiteContent"),
      "firefox: websiteContent data collection disclosure is required",
    );
  }

  await validatePopupHTML(extensionDir, target);
  await validateJavaScriptFiles(extensionDir, target);
}

async function validatePopupHTML(extensionDir, target) {
  const html = await fs.readFile(path.join(extensionDir, "popup.html"), "utf8");
  const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);

  assert(scriptSources.length > 0, `${target}: popup must load local scripts`);
  for (const source of scriptSources) {
    assert(!/^https?:\/\//.test(source), `${target}: popup must not load remote script ${source}`);
    await validateReferencedFile(extensionDir, source, `${target}: popup script`);
  }
}

async function validateJavaScriptFiles(extensionDir, target) {
  const entries = await fs.readdir(extensionDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const source = await fs.readFile(path.join(extensionDir, entry.name), "utf8");
    assert(!/\beval\s*\(/.test(source), `${target}: ${entry.name} must not use eval`);
    assert(!/\bnew\s+Function\b/.test(source), `${target}: ${entry.name} must not use new Function`);
    assert(!/<script/i.test(source), `${target}: ${entry.name} must not inject script tags`);
  }
}

async function validateReferencedFile(extensionDir, relativePath, label) {
  assert(Boolean(relativePath), `${label} path is missing`);
  assert(!path.isAbsolute(relativePath), `${label} path must be relative`);
  assert(!relativePath.split(/[\\/]/).includes(".."), `${label} path must not traverse directories`);
  assert(await exists(path.join(extensionDir, relativePath)), `${label} file does not exist: ${relativePath}`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

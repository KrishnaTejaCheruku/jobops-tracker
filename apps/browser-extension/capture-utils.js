(function (global) {
  const DEFAULT_APP_URL = "https://jobops.me";
  const DEFAULT_API_URL = "https://jobops.me/api";
  const ALLOWED_HOSTS = new Set(["jobops.me", "www.jobops.me", "localhost", "127.0.0.1"]);

  function normalizeBaseURL(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function parseAllowedHTTPURL(value) {
    const normalized = normalizeBaseURL(value);
    let parsed;

    try {
      parsed = new URL(normalized);
    } catch {
      return null;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    if (parsed.username || parsed.password) {
      return null;
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return null;
    }

    if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.protocol !== "http:") {
      return null;
    }

    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1" && parsed.protocol !== "https:") {
      return null;
    }

    return normalized;
  }

  function normalizeAppURL(value) {
    const allowed = parseAllowedHTTPURL(value);
    if (!allowed) {
      throw new Error("Enter a valid JobOps app URL.");
    }

    return allowed;
  }

  function normalizeAPIURL(value) {
    const allowed = parseAllowedHTTPURL(value);
    if (!allowed) {
      throw new Error("Enter a valid JobOps API URL.");
    }

    return allowed;
  }

  function encodeBase64URL(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function buildCaptureURL(appURL, payload) {
    const encodedPayload = encodeBase64URL(JSON.stringify(payload));
    return `${normalizeAppURL(appURL)}/capture?payload=${encodedPayload}`;
  }

  global.jobOpsCaptureUtils = {
    DEFAULT_APP_URL,
    DEFAULT_API_URL,
    normalizeBaseURL,
    normalizeAppURL,
    normalizeAPIURL,
    encodeBase64URL,
    buildCaptureURL,
  };
})(globalThis);

import {
  EMPTY_APPLICATION_FORM,
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from "./constants";

function decodeBase64URL(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return decodeURIComponent(escape(window.atob(padded)));
}

function encodeBase64URL(value) {
  return window
    .btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function safeString(value) {
  return String(value || "").trim();
}

function hostnameFromURL(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeSource(value, jobURL = "") {
  const source = safeString(value);

  if (SOURCE_OPTIONS.includes(source)) {
    return source;
  }

  const hostname = hostnameFromURL(jobURL).toLowerCase();
  const rawSource = source.toLowerCase();

  if (hostname.includes("linkedin") || rawSource.includes("linkedin")) {
    return "LinkedIn";
  }

  if (
    hostname.includes("indeed") ||
    hostname.includes("stepstone") ||
    hostname.includes("glassdoor") ||
    hostname.includes("xing")
  ) {
    return "Other";
  }

  if (hostname) {
    return "Company Website";
  }

  return "Other";
}

function normalizeOption(value, options, fallback) {
  const normalized = safeString(value);
  return options.includes(normalized) ? normalized : fallback;
}

export function encodeCapturePayload(payload) {
  return encodeBase64URL(JSON.stringify(payload || {}));
}

export function decodeCapturePayload(value) {
  if (!value) {
    throw new Error("Missing capture payload.");
  }

  try {
    return JSON.parse(decodeBase64URL(value));
  } catch {
    throw new Error("Capture payload could not be read.");
  }
}

export function normalizeCapturePayload(payload = {}) {
  const jobURL = safeString(payload.job_url);
  const hostname = hostnameFromURL(jobURL);
  const notes = safeString(payload.notes);
  const source = normalizeSource(payload.source || hostname, jobURL);

  let companyName = safeString(payload.company_name);

  if (
    source === "LinkedIn" &&
    ["linkedin.com", "www.linkedin.com"].includes(companyName.toLowerCase())
  ) {
    companyName = "";
  }

  return {
    ...EMPTY_APPLICATION_FORM,
    job_title: safeString(payload.job_title),
    company_name: companyName,
    source,
    job_url: jobURL,
    location: safeString(payload.location),
    work_mode: normalizeOption(payload.work_mode, WORK_MODE_OPTIONS, "Hybrid"),
    status: normalizeOption(payload.status, STATUS_OPTIONS, "Saved"),
    priority: normalizeOption(payload.priority, PRIORITY_OPTIONS, "Medium"),
    salary_range: safeString(payload.salary_range),
    follow_up_date: safeString(payload.follow_up_date),
    notes:
      notes ||
      (hostname ? `Captured from ${hostname}.` : "Captured from browser flow."),
    applied_date: safeString(payload.applied_date),
  };
}

export function parseCaptureFromLocation(location = window.location) {
  if (location.pathname !== "/capture") {
    return null;
  }

  const params = new URLSearchParams(location.search);
  const rawPayload = params.get("payload");

  return normalizeCapturePayload(decodeCapturePayload(rawPayload));
}

export function buildManualCapturePayload(jobURL) {
  const trimmedURL = safeString(jobURL);
  const hostname = hostnameFromURL(trimmedURL);

  return normalizeCapturePayload({
    job_url: trimmedURL,
    source: hostname || "Other",
    status: "Saved",
    priority: "Medium",
    notes: hostname ? `Captured manually from ${hostname}.` : "",
  });
}

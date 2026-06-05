import {
  EMPTY_APPLICATION_FORM,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
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

  if (hostname.includes("linkedin")) {
    return "LinkedIn";
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

  return {
    ...EMPTY_APPLICATION_FORM,
    job_title: safeString(payload.job_title),
    company_name: safeString(payload.company_name),
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

export function buildBookmarklet(appBaseURL) {
  const targetBase = String(appBaseURL || window.location.origin).replace(/\/$/, "");
  const script = `(()=>{const q=(s)=>document.querySelector(s);const meta=(n)=>q('meta[property="'+n+'"]')?.content||q('meta[name="'+n+'"]')?.content||"";const text=(v)=>String(v||"").trim();const host=location.hostname.replace(/^www\\./,"");let data={};for(const node of document.querySelectorAll('script[type="application/ld+json"]')){try{const parsed=JSON.parse(node.textContent);const items=Array.isArray(parsed)?parsed:[parsed];const job=items.find((item)=>item&&String(item["@type"]||"").toLowerCase().includes("jobposting"));if(job){data={job_title:text(job.title),company_name:text(job.hiringOrganization?.name),location:text(Array.isArray(job.jobLocation)?job.jobLocation[0]?.address?.addressLocality:job.jobLocation?.address?.addressLocality),salary_range:text(job.baseSalary?.value?.value||job.baseSalary?.value),notes:text(job.description).replace(/<[^>]+>/g," ").slice(0,1200)};break;}}catch{}}const payload={job_title:data.job_title||text(meta("og:title"))||text(q("h1")?.innerText)||text(document.title),company_name:data.company_name||text(meta("og:site_name"))||host,source:host,job_url:location.href,location:data.location||"",work_mode:"Hybrid",status:"Saved",priority:"Medium",salary_range:data.salary_range||"",notes:(data.notes||text(meta("description"))||text(window.getSelection?.().toString())).slice(0,1200)};const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");location.href="${targetBase}/capture?payload="+encoded;})()`;

  return `javascript:${encodeURIComponent(script)}`;
}

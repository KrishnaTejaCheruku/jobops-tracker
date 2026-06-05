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

function jobOpsCaptureBookmarkletRunner() {
  const target = "__JOBOPS_TARGET__";

  const query = (selector) => document.querySelector(selector);
  const queryAll = (selector) => Array.from(document.querySelectorAll(selector));

  const cleanText = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const readMeta = (name) =>
    cleanText(
      query(`meta[property="${name}"]`)?.content ||
        query(`meta[name="${name}"]`)?.content,
    );

  const readFirstText = (selectors) => {
    for (const selector of selectors) {
      const element = query(selector);
      const value = cleanText(
        element?.innerText || element?.textContent || element?.content,
      );

      if (value) {
        return value;
      }
    }

    return "";
  };

  const readManyText = (selectors) =>
    selectors.flatMap((selector) =>
      queryAll(selector)
        .map((element) => cleanText(element.innerText || element.textContent))
        .filter(Boolean),
    );

  const stripHTML = (value) =>
    cleanText(value)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const selectedText = () =>
    cleanText(window.getSelection && window.getSelection().toString());

  const hostname = location.hostname.replace(/^www\./, "");

  const isLinkedInHost = (host) => {
    const normalizedHost = String(host || "").toLowerCase();
    return (
      normalizedHost === "linkedin.com" ||
      normalizedHost.endsWith(".linkedin.com")
    );
  };

  const isNoise = (value) =>
    /applicant|bewerber|ago|reposted|promoted|actively|viewed|be among|connections?|followers?|full-time|part-time|contract|internship|temporary|permanent|posted|apply|easy apply|save|saved|share|linkedin/i.test(
      value,
    );

  const splitParts = (value) =>
    cleanText(value)
      .split(/\n|·|•|\||;/)
      .map(cleanText)
      .filter(Boolean);

  const cleanLinkedInTitle = (value) => {
    let title = cleanText(value)
      .replace(/\|\s*LinkedIn.*$/i, "")
      .replace(/\s+bei\s+LinkedIn.*$/i, "");

    if (title.includes(" - ")) {
      title = title.split(" - ")[0];
    }

    if (/ hiring /i.test(title)) {
      title = title.replace(/^.*? hiring /i, "").replace(/ in .*$/i, "");
    }

    return cleanText(title);
  };

  const cleanLinkedInCompanyName = (value) =>
    cleanText(value)
      .replace(/\s*\|\s*Jobs.*$/i, "")
      .replace(/\s*\|\s*LinkedIn.*$/i, "")
      .replace(/\s+jobs\s*$/i, "")
      .trim();

  const companyFromLinkedInTitle = (value) => {
    const title = cleanText(value)
      .replace(/\|\s*LinkedIn.*$/i, "")
      .replace(/\s*\|\s*Jobs.*$/i, "");

    const parts = title.split(" - ").map(cleanText).filter(Boolean);

    if (parts.length > 1) {
      return cleanLinkedInCompanyName(parts.slice(1).join(" - "));
    }

    const hiringMatch = title.match(/^(.+?) hiring .+?(?: in |$)/i);
    return cleanLinkedInCompanyName(hiringMatch && hiringMatch[1]);
  };

  const readLinkedInTopCardText = () =>
    readFirstText([
      ".job-details-jobs-unified-top-card",
      ".jobs-unified-top-card",
      ".jobs-search__job-details--container",
      ".jobs-details",
      ".top-card-layout",
      "main",
    ]);

  const normalizeLocationCandidate = (value, companyName = "") => {
    let candidate = cleanText(value);

    if (!candidate) {
      return "";
    }

    const company = cleanText(companyName);

    if (company) {
      candidate = candidate.replace(company, " ");
    }

    candidate = candidate
      .replace(/\b\d+\s+applicants?\b/gi, " ")
      .replace(/\b\d+\s+Bewerber(?:innen)?\b/gi, " ")
      .replace(/\b\d+\s+connections?\b/gi, " ")
      .replace(/\b\d+\s+followers?\b/gi, " ")
      .replace(/\bReposted\b/gi, " ")
      .replace(/\bPromoted\b/gi, " ")
      .replace(/\bActively recruiting\b/gi, " ")
      .replace(/\bBe among the first\b/gi, " ")
      .replace(/\bViewed\b/gi, " ")
      .replace(/\bPosted\b/gi, " ")
      .replace(/\bApply\b/gi, " ")
      .replace(/\bEasy Apply\b/gi, " ")
      .replace(/\bSave\b/gi, " ")
      .replace(/\bSaved\b/gi, " ")
      .replace(/\bShare\b/gi, " ")
      .replace(/\bVor\s+\d+\s+\w+\b/gi, " ")
      .replace(/\b\d+\s+\w+\s+ago\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    return candidate;
  };

  const looksLikeLocation = (value) => {
    const candidate = cleanText(value);

    if (!candidate) {
      return false;
    }

    if (
      /linkedin|applicant|bewerber|reposted|promoted|viewed|apply|save|share/i.test(
        candidate,
      )
    ) {
      return false;
    }

    return (
      candidate.includes(",") ||
      candidate.includes("/") ||
      /\bGermany\b/i.test(candidate) ||
      /\bDeutschland\b/i.test(candidate) ||
      /\bRemote\b/i.test(candidate) ||
      /\bHybrid\b/i.test(candidate) ||
      /\bOn-site\b/i.test(candidate) ||
      /\bOnsite\b/i.test(candidate) ||
      /\bArea\b/i.test(candidate) ||
      /\bRegion\b/i.test(candidate) ||
      /\bMetropolitan\b/i.test(candidate) ||
      /\bBerlin\b/i.test(candidate) ||
      /\bHamburg\b/i.test(candidate) ||
      /\bMunich\b/i.test(candidate) ||
      /\bMünchen\b/i.test(candidate) ||
      /\bFrankfurt\b/i.test(candidate) ||
      /\bCologne\b/i.test(candidate) ||
      /\bKöln\b/i.test(candidate) ||
      /\bStuttgart\b/i.test(candidate) ||
      /\bDüsseldorf\b/i.test(candidate) ||
      /\bHannover\b/i.test(candidate) ||
      /\bLeipzig\b/i.test(candidate) ||
      /\bDresden\b/i.test(candidate) ||
      /\bBremen\b/i.test(candidate) ||
      /\bNuremberg\b/i.test(candidate) ||
      /\bNürnberg\b/i.test(candidate)
    );
  };

  const readLinkedInLocation = (companyName) => {
    const directSelectors = [
      ".job-details-jobs-unified-top-card__primary-description-container .tvm__text",
      ".job-details-jobs-unified-top-card__tertiary-description-container .tvm__text",
      ".job-details-jobs-unified-top-card__primary-description-container",
      ".job-details-jobs-unified-top-card__tertiary-description-container",
      ".jobs-unified-top-card__primary-description",
      ".jobs-unified-top-card__subtitle-primary-grouping",
      ".jobs-unified-top-card__subtitle-secondary-grouping",
      ".jobs-unified-top-card__bullet",
      ".topcard__flavor-row",
      ".topcard__flavor--bullet",
    ];

    const directCandidates = readManyText(directSelectors)
      .flatMap(splitParts)
      .map((candidate) => normalizeLocationCandidate(candidate, companyName))
      .filter(Boolean);

    for (const candidate of directCandidates) {
      if (looksLikeLocation(candidate)) {
        return candidate;
      }
    }

    const topCardText = readLinkedInTopCardText();

    const topCardParts = splitParts(topCardText)
      .map((candidate) => normalizeLocationCandidate(candidate, companyName))
      .filter(Boolean);

    for (const candidate of topCardParts) {
      if (looksLikeLocation(candidate)) {
        return candidate;
      }
    }

    const commaMatch = topCardText.match(
      /([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-/ ]+,\s*[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-/ ]+(?:,\s*[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-/ ]+)?)/,
    );

    if (commaMatch) {
      return normalizeLocationCandidate(commaMatch[1], companyName);
    }

    const germanyMatch = topCardText.match(
      /([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-/ ]+\s+(?:Germany|Deutschland|Area|Region|Metropolitan Area))/i,
    );

    if (germanyMatch) {
      return normalizeLocationCandidate(germanyMatch[1], companyName);
    }

    return "";
  };

  const readJSONLocation = (locationValue) => {
    const locationObject = Array.isArray(locationValue)
      ? locationValue[0]
      : locationValue;

    if (!locationObject) {
      return "";
    }

    if (typeof locationObject === "string") {
      return cleanText(locationObject);
    }

    const address = locationObject.address || locationObject;
    const country =
      typeof address.addressCountry === "string"
        ? address.addressCountry
        : address.addressCountry?.name;

    return [address.addressLocality, address.addressRegion, country]
      .map(cleanText)
      .filter(Boolean)
      .join(", ");
  };

  const readJSONSalary = (salary) => {
    const value = salary?.value;
    const amount =
      value?.value ||
      (value?.minValue && value?.maxValue
        ? `${value.minValue} - ${value.maxValue}`
        : value);

    const currency = salary?.currency || value?.currency || "";

    return cleanText([currency, amount].filter(Boolean).join(" "));
  };

  const findJobPosting = (value) => {
    let found = null;

    const walk = (item) => {
      if (found || !item) {
        return;
      }

      if (Array.isArray(item)) {
        item.forEach(walk);
        return;
      }

      if (typeof item === "object") {
        if (String(item["@type"] || "").toLowerCase().includes("jobposting")) {
          found = item;
          return;
        }

        walk(item["@graph"]);
      }
    };

    walk(value);
    return found;
  };

  const readJSONLDJobPosting = () => {
    for (const node of queryAll('script[type="application/ld+json"]')) {
      try {
        const job = findJobPosting(JSON.parse(node.textContent));

        if (!job) {
          continue;
        }

        const hiringOrganization = Array.isArray(job.hiringOrganization)
          ? job.hiringOrganization[0]
          : job.hiringOrganization;

        return {
          job_title: cleanText(job.title),
          company_name: cleanText(hiringOrganization?.name),
          location: readJSONLocation(job.jobLocation),
          salary_range: readJSONSalary(job.baseSalary),
          notes: stripHTML(job.description).slice(0, 1200),
        };
      } catch {
        // Ignore invalid JSON-LD blocks.
      }
    }

    return {};
  };

  const readLinkedInJob = () => {
    const metaTitle = readMeta("og:title") || cleanText(document.title);

    const companyName = cleanLinkedInCompanyName(
      readFirstText([
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name a",
        ".jobs-unified-top-card__company-name",
        ".topcard__org-name-link",
        ".top-card-layout__card .topcard__flavor-row a",
      ]) || companyFromLinkedInTitle(metaTitle),
    );

    const notes =
      selectedText() ||
      readFirstText([
        ".jobs-description__content",
        ".jobs-box__html-content",
        ".jobs-description-content__text",
        "#job-details",
      ]) ||
      readMeta("description");

    const jobTitle = cleanLinkedInTitle(
      readFirstText([
        ".job-details-jobs-unified-top-card__job-title h1",
        ".job-details-jobs-unified-top-card__job-title",
        ".jobs-unified-top-card__job-title h1",
        ".jobs-unified-top-card__job-title",
        ".top-card-layout__title",
        "h1",
      ]) || metaTitle,
    );

    return {
      job_title: jobTitle,
      company_name: companyName,
      location: readLinkedInLocation(companyName),
      notes: cleanText(notes).slice(0, 1200),
    };
  };

  const readGenericLocation = () => {
    const candidates = readManyText([
      '[data-automation-id="locations"]',
      '[data-automation-id="location"]',
      '[data-testid="job-location"]',
      '[data-testid="location"]',
      '[class*="location"]',
      '[class*="Location"]',
      '[id*="location"]',
      '[id*="Location"]',
      ".posting-categories",
      ".job-location",
      ".job__location",
      ".jobsearch-JobInfoHeader-subtitle",
      ".jobsearch-DesktopStickyContainer-subtitle",
      ".jobsearch-InlineCompanyRating",
    ])
      .flatMap(splitParts)
      .map((candidate) => normalizeLocationCandidate(candidate))
      .filter(Boolean);

    for (const candidate of candidates) {
      if (looksLikeLocation(candidate)) {
        return candidate;
      }
    }

    return "";
  };

  const readGenericCompany = () =>
    readFirstText([
      '[data-automation-id="company"]',
      '[data-testid="company-name"]',
      '[class*="company"] a',
      '[class*="Company"] a',
      '[class*="company"]',
      '[class*="Company"]',
      ".posting-company",
      ".job-company",
      ".job__company",
    ]);

  const readGenericJob = () => {
    const title =
      readFirstText([
        '[data-automation-id="jobPostingHeader"]',
        '[data-testid="job-title"]',
        '[class*="job-title"]',
        '[class*="JobTitle"]',
        ".posting-headline h2",
        ".job-title",
        ".job__title",
        "h1",
      ]) ||
      readMeta("og:title") ||
      cleanText(document.title);

    const notes =
      selectedText() ||
      readFirstText([
        '[data-automation-id="jobPostingDescription"]',
        '[data-testid="job-description"]',
        '[class*="description"]',
        '[class*="Description"]',
        ".posting-requirements",
        ".posting-description",
        ".job-description",
        ".job__description",
        "main",
      ]) ||
      readMeta("description");

    return {
      job_title: title,
      company_name: readGenericCompany(),
      location: readGenericLocation(),
      notes: cleanText(notes).slice(0, 1200),
    };
  };

  const structuredData = readJSONLDJobPosting();
  const siteData = isLinkedInHost(hostname) ? readLinkedInJob() : readGenericJob();

  const fallbackTitle =
    readMeta("og:title") || readFirstText(["h1"]) || cleanText(document.title);

  const payload = {
    job_title: siteData.job_title || structuredData.job_title || fallbackTitle,
    company_name:
      siteData.company_name ||
      structuredData.company_name ||
      (isLinkedInHost(hostname) ? "" : readMeta("og:site_name") || hostname),
    source: hostname,
    job_url: location.href,
    location: siteData.location || structuredData.location || "",
    work_mode: "Hybrid",
    status: "Saved",
    priority: "Medium",
    salary_range: structuredData.salary_range || "",
    notes: (
      selectedText() ||
      siteData.notes ||
      structuredData.notes ||
      readMeta("description") ||
      (hostname ? `Captured from ${hostname}.` : "")
    ).slice(0, 1200),
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  location.href = `${target}/capture?payload=${encoded}`;
}

export function buildBookmarklet(appBaseURL) {
  const targetBase = String(appBaseURL || window.location.origin).replace(/\/$/, "");

  const runnerSource = jobOpsCaptureBookmarkletRunner
    .toString()
    .replace('"__JOBOPS_TARGET__"', JSON.stringify(targetBase));

  return `javascript:${encodeURIComponent(`(${runnerSource})()`)}`;
}

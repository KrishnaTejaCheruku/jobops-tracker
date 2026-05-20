import { API_BASE_URL } from "./constants";

function buildAPIError(message, details = []) {
  const error = new Error(message || "Request failed");
  error.details = details || [];
  return error;
}

async function parseErrorResponse(response, fallbackMessage) {
  try {
    const body = await response.json();
    return buildAPIError(body.error || fallbackMessage, body.details || []);
  } catch {
    return buildAPIError(`${response.status} ${response.statusText}`, []);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Request failed");
  }

  return response.json();
}

export function buildApplicationQuery(filters, pagination = {}, sort = {}) {
  const params = new URLSearchParams();

  if (filters.search.trim() !== "") params.set("search", filters.search.trim());
  if (filters.status !== "All") params.set("status", filters.status);
  if (filters.priority !== "All") params.set("priority", filters.priority);
  if (filters.source !== "All") params.set("source", filters.source);
  if (filters.work_mode !== "All") params.set("work_mode", filters.work_mode);

  params.set("page", String(pagination.page || 1));
  params.set("page_size", String(pagination.pageSize || 10));
  params.set("sort_by", sort.sortBy || "created_at");
  params.set("sort_order", sort.sortOrder || "desc");

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listApplications(filters, pagination, sort) {
  return request(`/applications${buildApplicationQuery(filters, pagination, sort)}`);
}

export function createApplication(payload) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateApplication(id, payload) {
  return request(`/applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteApplication(id) {
  return request(`/applications/${id}`, {
    method: "DELETE",
  });
}

export function listStatusHistory(applicationId) {
  return request(`/applications/${applicationId}/status-history`);
}

export function listCVVersions() {
  return request("/cv-versions");
}

export function createCVVersion(payload) {
  return request("/cv-versions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteCVVersion(id) {
  return request(`/cv-versions/${id}`, {
    method: "DELETE",
  });
}

export function getDashboardAnalytics() {
  return request("/dashboard/analytics");
}

export function getApplicationsExportURL() {
  return `${API_BASE_URL}/applications/export.csv`;
}

export async function importApplicationsCSV(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/applications/import.csv`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "CSV import failed");
  }

  return response.json();
}

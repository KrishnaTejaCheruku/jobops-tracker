import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const statusOptions = [
  "Saved",
  "Applied",
  "Recruiter Contacted",
  "Interview Scheduled",
  "Technical Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
];

const priorityOptions = ["Low", "Medium", "High"];

const sourceOptions = [
  "LinkedIn",
  "Company Website",
  "Recruiter",
  "Referral",
  "Other",
];

const workModeOptions = ["Remote", "Hybrid", "On-site"];

const closedStatuses = ["Offer", "Rejected", "Withdrawn"];

const emptyForm = {
  job_title: "",
  company_name: "",
  source: "LinkedIn",
  job_url: "",
  location: "",
  work_mode: "Hybrid",
  status: "Saved",
  cv_version: "",
  cv_version_id: 0,
  salary_range: "",
  follow_up_date: "",
  recruiter_name: "",
  recruiter_email: "",
  job_description: "",
  priority: "Medium",
  notes: "",
  applied_date: "",
};

const emptyFilters = {
  search: "",
  status: "All",
  priority: "All",
  source: "All",
  work_mode: "All",
};

const emptyCVVersionForm = {
  name: "",
  focus_area: "",
  file_path: "",
  notes: "",
};

function normalizeApplicationForForm(application) {
  return {
    job_title: application.job_title || "",
    company_name: application.company_name || "",
    source: application.source || "LinkedIn",
    job_url: application.job_url || "",
    location: application.location || "",
    work_mode: application.work_mode || "Hybrid",
    status: application.status || "Saved",
    cv_version: application.cv_version || "",
    cv_version_id: application.cv_version_id || 0,
    salary_range: application.salary_range || "",
    follow_up_date: application.follow_up_date || "",
    recruiter_name: application.recruiter_name || "",
    recruiter_email: application.recruiter_email || "",
    job_description: application.job_description || "",
    priority: application.priority || "Medium",
    notes: application.notes || "",
    applied_date: application.applied_date || "",
  };
}

function buildApplicationPayload(form) {
  return {
    ...form,
    cv_version_id: Number(form.cv_version_id) || 0,
  };
}

function buildApplicationQuery(filters) {
  const params = new URLSearchParams();

  if (filters.search.trim() !== "") params.set("search", filters.search.trim());
  if (filters.status !== "All") params.set("status", filters.status);
  if (filters.priority !== "All") params.set("priority", filters.priority);
  if (filters.source !== "All") params.set("source", filters.source);
  if (filters.work_mode !== "All") params.set("work_mode", filters.work_mode);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function getDateOnly(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isActiveApplication(application) {
  return !closedStatuses.includes(application.status);
}

function getFollowUpState(application) {
  if (!application.follow_up_date || !isActiveApplication(application)) {
    return "none";
  }

  const followUpDate = getDateOnly(application.follow_up_date);
  const today = getToday();

  if (!followUpDate) return "none";
  if (followUpDate < today) return "overdue";
  if (followUpDate.getTime() === today.getTime()) return "today";
  return "upcoming";
}

function App() {
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState(emptyFilters);
  const [applications, setApplications] = useState([]);
  const [cvVersions, setCVVersions] = useState([]);
  const [cvVersionForm, setCVVersionForm] = useState(emptyCVVersionForm);
  const [editingId, setEditingId] = useState(null);

  const [historyApplication, setHistoryApplication] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [cvVersionLoading, setCVVersionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = editingId !== null;

  const summary = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((app) => app.status === "Applied").length,
      interviews: applications.filter((app) =>
        ["Interview Scheduled", "Technical Interview"].includes(app.status)
      ).length,
      highPriority: applications.filter((app) => app.priority === "High").length,
    };
  }, [applications]);

  const followUps = useMemo(() => {
    const items = applications
      .filter((application) => {
        const state = getFollowUpState(application);
        return state !== "none";
      })
      .map((application) => ({
        ...application,
        follow_up_state: getFollowUpState(application),
      }))
      .sort((a, b) => {
        const aDate = getDateOnly(a.follow_up_date);
        const bDate = getDateOnly(b.follow_up_date);

        if (!aDate || !bDate) return 0;
        return aDate.getTime() - bDate.getTime();
      });

    return {
      items,
      overdue: items.filter((item) => item.follow_up_state === "overdue").length,
      today: items.filter((item) => item.follow_up_state === "today").length,
      upcoming: items.filter((item) => item.follow_up_state === "upcoming").length,
    };
  }, [applications]);

  async function fetchApplications(activeFilters = filters) {
    setListLoading(true);
    setError("");

    try {
      const query = buildApplicationQuery(activeFilters);
      const response = await fetch(`${API_BASE_URL}/applications${query}`);

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to load applications");
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setListLoading(false);
    }
  }

  async function fetchCVVersions() {
    setCvVersionLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/cv-versions`);

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to load CV versions");
      }

      const data = await response.json();
      setCVVersions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCvVersionLoading(false);
    }
  }

  async function fetchStatusHistory(application) {
    setHistoryApplication(application);
    setStatusHistory([]);
    setHistoryLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/applications/${application.id}/status-history`
      );

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to load status history");
      }

      const data = await response.json();
      setStatusHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryApplication(null);
    setStatusHistory([]);
    setHistoryLoading(false);
  }

  useEffect(() => {
    fetchApplications(filters);
  }, [filters]);

  useEffect(() => {
    fetchCVVersions();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "cv_version_id") {
      const cvVersionID = Number(value) || 0;
      const selectedCVVersion = cvVersions.find((cv) => cv.id === cvVersionID);

      setForm((current) => ({
        ...current,
        cv_version_id: cvVersionID,
        cv_version: selectedCVVersion?.name || "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCVVersionFormChange(event) {
    const { name, value } = event.target;

    setCVVersionForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    setFilters(emptyFilters);
  }

  function startEdit(application) {
    setEditingId(application.id);
    setForm(normalizeApplicationForForm(application));
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const url = isEditing
      ? `${API_BASE_URL}/applications/${editingId}`
      : `${API_BASE_URL}/applications`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildApplicationPayload(form)),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to save application");
      }

      setForm(emptyForm);
      setEditingId(null);
      setMessage(isEditing ? "Application updated successfully." : "Application saved successfully.");
      await fetchApplications(filters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createCVVersion(event) {
    event.preventDefault();
    setCvVersionLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/cv-versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cvVersionForm),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to create CV version");
      }

      setCVVersionForm(emptyCVVersionForm);
      setMessage("CV version created successfully.");
      await fetchCVVersions();
    } catch (err) {
      setError(err.message);
    } finally {
      setCvVersionLoading(false);
    }
  }

  async function deleteCVVersion(id) {
    const confirmed = window.confirm("Delete this CV version?");
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/cv-versions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to delete CV version");
      }

      setMessage("CV version deleted.");
      await fetchCVVersions();
      await fetchApplications(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteApplication(id) {
    const confirmed = window.confirm("Delete this application?");
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to delete application");
      }

      if (editingId === id) cancelEdit();
      if (historyApplication?.id === id) closeHistory();

      setMessage("Application deleted.");
      await fetchApplications(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Open-source DevOps job tracker</p>
          <h1>JobOps Tracker</h1>
          <p className="subtitle">
            Track LinkedIn and external job applications without Excel.
          </p>
        </div>
      </section>

      <section className="summary-grid">
        <SummaryCard label="Visible Applications" value={summary.total} />
        <SummaryCard label="Applied" value={summary.applied} />
        <SummaryCard label="Interviews" value={summary.interviews} />
        <SummaryCard label="High Priority" value={summary.highPriority} />
      </section>

      <section className="summary-grid followup-summary-grid">
        <SummaryCard label="Overdue Follow-ups" value={followUps.overdue} />
        <SummaryCard label="Due Today" value={followUps.today} />
        <SummaryCard label="Upcoming Follow-ups" value={followUps.upcoming} />
        <SummaryCard label="CV Versions" value={cvVersions.length} />
      </section>

      {(message || error) && (
        <section className={`notice ${error ? "notice-error" : "notice-success"}`}>
          {error || message}
        </section>
      )}

      <section className="cv-card card">
        <div className="section-header">
          <div>
            <h2>CV Versions</h2>
            <p className="muted">
              Create reusable CV versions and link them to job applications.
              {cvVersionLoading ? " Loading..." : ""}
            </p>
          </div>
          <button type="button" className="secondary" onClick={fetchCVVersions}>
            Refresh CVs
          </button>
        </div>

        <form className="cv-version-form" onSubmit={createCVVersion}>
          <label>
            CV Name *
            <input
              name="name"
              value={cvVersionForm.name}
              onChange={handleCVVersionFormChange}
              placeholder="cv_kubernetes_terraform_v1"
              required
            />
          </label>

          <label>
            Focus Area
            <input
              name="focus_area"
              value={cvVersionForm.focus_area}
              onChange={handleCVVersionFormChange}
              placeholder="Kubernetes / Terraform / AWS"
            />
          </label>

          <label>
            File Path Placeholder
            <input
              name="file_path"
              value={cvVersionForm.file_path}
              onChange={handleCVVersionFormChange}
              placeholder="future-s3-path-or-local-reference"
            />
          </label>

          <label>
            Notes
            <input
              name="notes"
              value={cvVersionForm.notes}
              onChange={handleCVVersionFormChange}
              placeholder="What this CV version is optimized for"
            />
          </label>

          <button type="submit" disabled={cvVersionLoading}>
            {cvVersionLoading ? "Saving..." : "Add CV"}
          </button>
        </form>

        {cvVersions.length === 0 ? (
          <p className="empty">No CV versions yet.</p>
        ) : (
          <div className="cv-version-list">
            {cvVersions.map((cv) => (
              <article className="cv-version-item" key={cv.id}>
                <div>
                  <strong>{cv.name}</strong>
                  <p>{cv.focus_area || "No focus area set"}</p>
                  {cv.notes && <small>{cv.notes}</small>}
                </div>
                <button
                  type="button"
                  className="danger small"
                  onClick={() => deleteCVVersion(cv.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="followup-card card">
        <div className="section-header">
          <div>
            <h2>Follow-ups</h2>
            <p className="muted">
              Active applications with follow-up dates, excluding Offer, Rejected, and Withdrawn.
            </p>
          </div>
        </div>

        {followUps.items.length === 0 ? (
          <p className="empty">No follow-ups due or scheduled.</p>
        ) : (
          <div className="followup-list">
            {followUps.items.map((application) => (
              <article
                className={`followup-item followup-${application.follow_up_state}`}
                key={`followup-${application.id}`}
              >
                <div>
                  <strong>{application.job_title}</strong>
                  <p>
                    {application.company_name} · {application.status} ·{" "}
                    {application.priority || "Medium"}
                  </p>
                </div>
                <div className="followup-meta">
                  <span>{application.follow_up_date}</span>
                  <button
                    type="button"
                    className="secondary small"
                    onClick={() => startEdit(application)}
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="layout">
        <form className="card form" onSubmit={handleSubmit}>
          <div className="form-header">
            <div>
              <h2>{isEditing ? "Edit Application" : "Add Application"}</h2>
              {isEditing && <p>Editing application ID #{editingId}</p>}
            </div>

            {isEditing && (
              <button type="button" className="secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              Job Title *
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                placeholder="DevOps Engineer"
                required
              />
            </label>

            <label>
              Company Name *
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="Example GmbH"
                required
              />
            </label>

            <label>
              Source
              <select name="source" value={form.source} onChange={handleChange}>
                {sourceOptions.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>

            <label>
              Job URL
              <input
                name="job_url"
                value={form.job_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/jobs/..."
              />
            </label>

            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Germany / Remote / Berlin"
              />
            </label>

            <label>
              Work Mode
              <select name="work_mode" value={form.work_mode} onChange={handleChange}>
                {workModeOptions.map((workMode) => (
                  <option key={workMode}>{workMode}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select name="priority" value={form.priority} onChange={handleChange}>
                {priorityOptions.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <label>
              CV Version
              <select
                name="cv_version_id"
                value={form.cv_version_id}
                onChange={handleChange}
              >
                <option value={0}>No CV selected</option>
                {cvVersions.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Salary Range
              <input
                name="salary_range"
                value={form.salary_range}
                onChange={handleChange}
                placeholder="€60k-€75k / Not listed"
              />
            </label>

            <label>
              Applied Date
              <input
                type="date"
                name="applied_date"
                value={form.applied_date}
                onChange={handleChange}
              />
            </label>

            <label>
              Follow-up Date
              <input
                type="date"
                name="follow_up_date"
                value={form.follow_up_date}
                onChange={handleChange}
              />
            </label>

            <label>
              Recruiter Name
              <input
                name="recruiter_name"
                value={form.recruiter_name}
                onChange={handleChange}
                placeholder="Jane Recruiter"
              />
            </label>

            <label>
              Recruiter Email
              <input
                type="email"
                name="recruiter_email"
                value={form.recruiter_email}
                onChange={handleChange}
                placeholder="jane@example.com"
              />
            </label>
          </div>

          {form.cv_version && (
            <p className="selected-cv">
              Selected CV: <strong>{form.cv_version}</strong>
            </p>
          )}

          <label>
            Job Description
            <textarea
              name="job_description"
              value={form.job_description}
              onChange={handleChange}
              placeholder="Paste job description or important keywords..."
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Application notes..."
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Application"
                : "Save Application"}
          </button>
        </form>

        <section className="card">
          <div className="section-header">
            <div>
              <h2>Applications</h2>
              <p className="muted">
                Showing {applications.length} result{applications.length === 1 ? "" : "s"}
                {listLoading ? "..." : ""}
              </p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => fetchApplications(filters)}
            >
              Refresh
            </button>
          </div>

          <div className="filters">
            <label>
              Search
              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search job, company, recruiter, CV, keywords..."
              />
            </label>

            <label>
              Status
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option>All</option>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
              >
                <option>All</option>
                {priorityOptions.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <label>
              Source
              <select name="source" value={filters.source} onChange={handleFilterChange}>
                <option>All</option>
                {sourceOptions.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>

            <label>
              Work Mode
              <select
                name="work_mode"
                value={filters.work_mode}
                onChange={handleFilterChange}
              >
                <option>All</option>
                {workModeOptions.map((workMode) => (
                  <option key={workMode}>{workMode}</option>
                ))}
              </select>
            </label>

            <button type="button" className="secondary clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Salary</th>
                  <th>Follow-up</th>
                  <th>Recruiter</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      {application.job_url ? (
                        <a href={application.job_url} target="_blank" rel="noreferrer">
                          {application.job_title}
                        </a>
                      ) : (
                        application.job_title
                      )}
                      <small>
                        {application.work_mode || "-"} · CV:{" "}
                        {application.cv_version || "Not selected"}
                      </small>
                    </td>
                    <td>{application.company_name}</td>
                    <td>
                      <span className="pill">{application.status}</span>
                    </td>
                    <td>
                      <span className={`priority priority-${application.priority?.toLowerCase()}`}>
                        {application.priority || "Medium"}
                      </span>
                    </td>
                    <td>{application.salary_range || "-"}</td>
                    <td>{application.follow_up_date || "-"}</td>
                    <td>
                      {application.recruiter_email ? (
                        <a href={`mailto:${application.recruiter_email}`}>
                          {application.recruiter_name || application.recruiter_email}
                        </a>
                      ) : (
                        application.recruiter_name || "-"
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          type="button"
                          className="secondary small"
                          onClick={() => startEdit(application)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="secondary small"
                          onClick={() => fetchStatusHistory(application)}
                        >
                          History
                        </button>
                        <button
                          type="button"
                          className="danger small"
                          onClick={() => deleteApplication(application.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {applications.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty">
                      No applications match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {historyApplication && (
        <section className="history-overlay" onClick={closeHistory}>
          <div className="history-panel" onClick={(event) => event.stopPropagation()}>
            <div className="section-header">
              <div>
                <h2>Status History</h2>
                <p className="muted">
                  {historyApplication.job_title} — {historyApplication.company_name}
                </p>
              </div>
              <button type="button" className="secondary" onClick={closeHistory}>
                Close
              </button>
            </div>

            {historyLoading && <p className="muted">Loading status history...</p>}

            {!historyLoading && statusHistory.length === 0 && (
              <p className="empty">No status history found.</p>
            )}

            {!historyLoading && statusHistory.length > 0 && (
              <div className="history-list">
                {statusHistory.map((item) => (
                  <article className="history-item" key={item.id}>
                    <div>
                      <strong>
                        {item.old_status || "Created"} → {item.new_status}
                      </strong>
                      <p>{item.note || "Status changed"}</p>
                    </div>
                    <span>{formatDateTime(item.changed_at)}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default App;

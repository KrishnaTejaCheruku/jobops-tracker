import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const emptyForm = {
  job_title: "",
  company_name: "",
  source: "LinkedIn",
  job_url: "",
  location: "",
  work_mode: "Hybrid",
  status: "Saved",
  cv_version: "",
  salary_range: "",
  follow_up_date: "",
  recruiter_name: "",
  recruiter_email: "",
  job_description: "",
  priority: "Medium",
  notes: "",
  applied_date: "",
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

function App() {
  const [form, setForm] = useState(emptyForm);
  const [applications, setApplications] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
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

  async function fetchApplications() {
    try {
      const response = await fetch(`${API_BASE_URL}/applications`);

      if (!response.ok) {
        throw new Error("Failed to load applications");
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to save application");
      }

      setForm(emptyForm);
      setEditingId(null);
      setMessage(isEditing ? "Application updated successfully." : "Application saved successfully.");
      await fetchApplications();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        throw new Error("Failed to delete application");
      }

      if (editingId === id) {
        cancelEdit();
      }

      setMessage("Application deleted.");
      await fetchApplications();
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
        <SummaryCard label="Total Applications" value={summary.total} />
        <SummaryCard label="Applied" value={summary.applied} />
        <SummaryCard label="Interviews" value={summary.interviews} />
        <SummaryCard label="High Priority" value={summary.highPriority} />
      </section>

      {(message || error) && (
        <section className={`notice ${error ? "notice-error" : "notice-success"}`}>
          {error || message}
        </section>
      )}

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
                <option>LinkedIn</option>
                <option>Company Website</option>
                <option>Recruiter</option>
                <option>Referral</option>
                <option>Other</option>
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
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option>Saved</option>
                <option>Applied</option>
                <option>Recruiter Contacted</option>
                <option>Interview Scheduled</option>
                <option>Technical Interview</option>
                <option>Offer</option>
                <option>Rejected</option>
                <option>Ghosted</option>
                <option>Withdrawn</option>
              </select>
            </label>

            <label>
              Priority
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
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
              CV Version
              <input
                name="cv_version"
                value={form.cv_version}
                onChange={handleChange}
                placeholder="cv_kubernetes_v1"
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
            <h2>Applications</h2>
            <button type="button" className="secondary" onClick={fetchApplications}>
              Refresh
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
                      <small>{application.work_mode || "-"}</small>
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
                      No applications yet. Add your first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
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

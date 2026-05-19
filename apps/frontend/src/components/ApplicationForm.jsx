import React from "react";
import {
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../lib/constants";

export default function ApplicationForm({
  form,
  cvVersions,
  isEditing,
  editingId,
  loading,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="card form-card" onSubmit={onSubmit}>
      <div className="card-header">
        <div>
          <p className="section-kicker">Application intake</p>
          <h2>{isEditing ? "Edit Application" : "Add Application"}</h2>
          {isEditing && <p className="muted">Editing application ID #{editingId}</p>}
        </div>

        {isEditing && (
          <button type="button" className="btn btn-soft" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="form-section">
        <h3>Role details</h3>

        <div className="form-grid">
          <label>
            Job Title *
            <input
              name="job_title"
              value={form.job_title}
              onChange={onChange}
              placeholder="DevOps Engineer"
              required
            />
          </label>

          <label>
            Company Name *
            <input
              name="company_name"
              value={form.company_name}
              onChange={onChange}
              placeholder="Example GmbH"
              required
            />
          </label>

          <label>
            Source
            <select name="source" value={form.source} onChange={onChange}>
              {SOURCE_OPTIONS.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>

          <label>
            Job URL
            <input
              name="job_url"
              value={form.job_url}
              onChange={onChange}
              placeholder="https://linkedin.com/jobs/..."
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="Germany / Remote / Berlin"
            />
          </label>

          <label>
            Work Mode
            <select name="work_mode" value={form.work_mode} onChange={onChange}>
              {WORK_MODE_OPTIONS.map((workMode) => (
                <option key={workMode}>{workMode}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Tracking</h3>

        <div className="form-grid">
          <label>
            Status
            <select name="status" value={form.status} onChange={onChange}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select name="priority" value={form.priority} onChange={onChange}>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            CV Version
            <select
              name="cv_version_id"
              value={form.cv_version_id}
              onChange={onChange}
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
              onChange={onChange}
              placeholder="€60k-€75k / Not listed"
            />
          </label>

          <label>
            Applied Date
            <input
              type="date"
              name="applied_date"
              value={form.applied_date}
              onChange={onChange}
            />
          </label>

          <label>
            Follow-up Date
            <input
              type="date"
              name="follow_up_date"
              value={form.follow_up_date}
              onChange={onChange}
            />
          </label>
        </div>

        {form.cv_version && (
          <p className="selected-cv">
            Selected CV: <strong>{form.cv_version}</strong>
          </p>
        )}
      </div>

      <div className="form-section">
        <h3>Recruiter & notes</h3>

        <div className="form-grid">
          <label>
            Recruiter Name
            <input
              name="recruiter_name"
              value={form.recruiter_name}
              onChange={onChange}
              placeholder="Jane Recruiter"
            />
          </label>

          <label>
            Recruiter Email
            <input
              type="email"
              name="recruiter_email"
              value={form.recruiter_email}
              onChange={onChange}
              placeholder="jane@example.com"
            />
          </label>
        </div>

        <label>
          Job Description
          <textarea
            name="job_description"
            value={form.job_description}
            onChange={onChange}
            placeholder="Paste job description or important keywords..."
          />
        </label>

        <label>
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Application notes..."
          />
        </label>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? "Saving..." : isEditing ? "Update Application" : "Save Application"}
      </button>
    </form>
  );
}

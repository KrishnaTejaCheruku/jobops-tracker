import React, { useEffect, useState } from "react";
import {
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../lib/constants";
import "./CaptureReviewModal.css";

export default function CaptureReviewModal({
  initialPayload,
  cvVersions,
  loading,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(initialPayload);

  useEffect(() => {
    setForm(initialPayload);
  }, [initialPayload]);

  if (!initialPayload || !form) return null;

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "cv_version_id") {
      const cvVersionID = Number(value) || 0;
      const selectedCV = cvVersions.find((cv) => cv.id === cvVersionID);

      setForm((current) => ({
        ...current,
        cv_version_id: cvVersionID,
        cv_version: selectedCV?.name || "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <section className="capture-overlay" onClick={onClose}>
      <form
        className="capture-modal"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="capture-modal-header">
          <div>
            <p className="section-kicker">Capture review</p>
            <h2>Review captured job</h2>
            <p className="muted">
              Edit the details before saving this role to your workspace.
            </p>
          </div>

          <button type="button" className="btn btn-soft btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="capture-grid">
          <label>
            Job title *
            <input
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Company name *
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Source
            <select name="source" value={form.source} onChange={handleChange}>
              {SOURCE_OPTIONS.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>

          <label>
            Job URL
            <input name="job_url" value={form.job_url} onChange={handleChange} />
          </label>

          <label>
            Location
            <input name="location" value={form.location} onChange={handleChange} />
          </label>

          <label>
            Work mode
            <select name="work_mode" value={form.work_mode} onChange={handleChange}>
              {WORK_MODE_OPTIONS.map((workMode) => (
                <option key={workMode}>{workMode}</option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            Salary range
            <input
              name="salary_range"
              value={form.salary_range}
              onChange={handleChange}
            />
          </label>

          <label>
            CV version
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
            Follow-up date
            <input
              type="date"
              name="follow_up_date"
              value={form.follow_up_date}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="capture-notes">
          Notes
          <textarea name="notes" value={form.notes} onChange={handleChange} />
        </label>

        {error && <div className="capture-error">{error}</div>}

        <div className="capture-actions">
          <button type="button" className="btn btn-soft" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save captured job"}
          </button>
        </div>
      </form>
    </section>
  );
}

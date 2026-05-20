import React from "react";
import { formatDateTime } from "../lib/date";

function DetailItem({ label, value, children }) {
  const displayValue = value || "-";

  return (
    <div className="detail-item">
      <span>{label}</span>
      {children || <strong>{displayValue}</strong>}
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="detail-block">
      <span>{label}</span>
      <p>{value || "-"}</p>
    </div>
  );
}

function priorityClass(priority) {
  return `badge priority priority-${(priority || "Medium").toLowerCase()}`;
}

function statusClass(status) {
  return `badge status status-${(status || "saved")
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}

export default function ApplicationDetailModal({
  application,
  onClose,
  onEdit,
  onHistory,
}) {
  if (!application) return null;

  return (
    <section className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="detail-header">
          <div>
            <p className="section-kicker">Application detail</p>
            <h2>{application.job_title}</h2>
            <p className="muted">
              {application.company_name} · {application.location || "No location set"}
            </p>
          </div>

          <button type="button" className="btn btn-soft" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onEdit(application)}
          >
            Edit Application
          </button>

          <button
            type="button"
            className="btn btn-soft"
            onClick={() => onHistory(application)}
          >
            View Status History
          </button>

          {application.job_url && (
            <a
              className="btn btn-soft"
              href={application.job_url}
              target="_blank"
              rel="noreferrer"
            >
              Open Job URL
            </a>
          )}
        </div>

        <div className="detail-grid">
          <DetailItem label="Status">
            <span className={statusClass(application.status)}>
              {application.status || "Saved"}
            </span>
          </DetailItem>

          <DetailItem label="Priority">
            <span className={priorityClass(application.priority)}>
              {application.priority || "Medium"}
            </span>
          </DetailItem>

          <DetailItem label="Source" value={application.source} />
          <DetailItem label="Work Mode" value={application.work_mode} />
          <DetailItem label="Salary Range" value={application.salary_range} />
          <DetailItem label="CV Version" value={application.cv_version || "Not selected"} />
          <DetailItem label="Applied Date" value={application.applied_date} />
          <DetailItem label="Follow-up Date" value={application.follow_up_date} />
          <DetailItem label="Recruiter Name" value={application.recruiter_name} />

          <DetailItem label="Recruiter Email">
            {application.recruiter_email ? (
              <a href={`mailto:${application.recruiter_email}`}>
                {application.recruiter_email}
              </a>
            ) : (
              <strong>-</strong>
            )}
          </DetailItem>

          <DetailItem label="Created At" value={formatDateTime(application.created_at)} />
          <DetailItem label="Updated At" value={formatDateTime(application.updated_at)} />
        </div>

        <div className="detail-content">
          <DetailBlock label="Job URL" value={application.job_url} />
          <DetailBlock label="Job Description" value={application.job_description} />
          <DetailBlock label="Notes" value={application.notes} />
        </div>
      </div>
    </section>
  );
}

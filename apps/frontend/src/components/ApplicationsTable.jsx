import React from "react";

function priorityClass(priority) {
  return `badge priority priority-${(priority || "Medium").toLowerCase()}`;
}

function statusClass(status) {
  return `badge status status-${(status || "saved")
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}

export default function ApplicationsTable({
  applications,
  listLoading,
  onRefresh,
  onEdit,
  onDelete,
  onHistory,
}) {
  return (
    <section className="card applications-card">
      <div className="card-header">
        <div>
          <p className="section-kicker">Pipeline</p>
          <h2>Applications</h2>
          <p className="muted">
            Showing {applications.length} result{applications.length === 1 ? "" : "s"}
            {listLoading ? "..." : ""}
          </p>
        </div>

        <button type="button" className="btn btn-soft" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Salary</th>
              <th>Follow-up</th>
              <th>Recruiter</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>
                  <div className="table-primary">
                    {application.job_url ? (
                      <a href={application.job_url} target="_blank" rel="noreferrer">
                        {application.job_title}
                      </a>
                    ) : (
                      application.job_title
                    )}
                  </div>
                  <small>
                    {application.work_mode || "-"} · CV:{" "}
                    {application.cv_version || "Not selected"}
                  </small>
                </td>

                <td>{application.company_name}</td>

                <td>
                  <span className={statusClass(application.status)}>
                    {application.status}
                  </span>
                </td>

                <td>
                  <span className={priorityClass(application.priority)}>
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
                      className="btn btn-soft btn-small"
                      onClick={() => onEdit(application)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft btn-small"
                      onClick={() => onHistory(application)}
                    >
                      History
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => onDelete(application.id)}
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
  );
}

import React from "react";

const sortableColumns = [
  { key: "job_title", label: "Role" },
  { key: "company_name", label: "Company" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "salary_range", label: "Salary" },
  { key: "follow_up_date", label: "Follow-up" },
  { key: "recruiter_name", label: "Recruiter" },
];

function priorityClass(priority) {
  return `badge priority priority-${(priority || "Medium").toLowerCase()}`;
}

function statusClass(status) {
  return `badge status status-${(status || "saved")
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}

function sortIndicator(columnKey, sort) {
  if (sort.sortBy !== columnKey) {
    return "↕";
  }

  return sort.sortOrder === "asc" ? "↑" : "↓";
}

export default function ApplicationsTable({
  applications,
  listLoading,
  pagination,
  sort,
  onRefresh,
  onView,
  onEdit,
  onDelete,
  onHistory,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}) {
  const canGoPrevious = pagination.page > 1;
  const canGoNext = pagination.totalPages > 0 && pagination.page < pagination.totalPages;

  function renderSortableHeader(columnKey, label) {
    return (
      <button
        type="button"
        className={`table-sort-button ${sort.sortBy === columnKey ? "active" : ""}`}
        onClick={() => onSortChange(columnKey)}
      >
        <span>{label}</span>
        <strong>{sortIndicator(columnKey, sort)}</strong>
      </button>
    );
  }

  return (
    <section className="card applications-card">
      <div className="card-header">
        <div>
          <p className="section-kicker">Pipeline</p>
          <h2>Applications</h2>
          <p className="muted">
            Showing {applications.length} of {pagination.totalItems} result
            {pagination.totalItems === 1 ? "" : "s"}
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
              {sortableColumns.map((column) => (
                <th key={column.key}>
                  {renderSortableHeader(column.key, column.label)}
                </th>
              ))}
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
                      onClick={() => onView(application)}
                    >
                      View
                    </button>

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
                  <div className="empty-state">
                    <div className="empty-state-icon" aria-hidden="true">
                      JO
                    </div>
                    <h3>No applications in this view</h3>
                    <p>
                      Add your first role from the form, import a CSV, or clear filters
                      if you expected existing applications here.
                    </p>
                    <div className="empty-state-steps">
                      <span>Save role details</span>
                      <span>Attach CV version</span>
                      <span>Schedule follow-up</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <div className="pagination-info">
          Page <strong>{pagination.page}</strong> of{" "}
          <strong>{pagination.totalPages || 1}</strong> ·{" "}
          <strong>{pagination.totalItems}</strong> total · Sorted by{" "}
          <strong>{sort.sortBy}</strong> <strong>{sort.sortOrder}</strong>
        </div>

        <div className="pagination-controls">
          <label>
            Page size
            <select
              value={pagination.pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <button
            type="button"
            className="btn btn-soft btn-small"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </button>

          <button
            type="button"
            className="btn btn-soft btn-small"
            disabled={!canGoNext}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

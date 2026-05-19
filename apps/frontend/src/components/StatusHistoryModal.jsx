import React from "react";
import { formatDateTime } from "../lib/date";

export default function StatusHistoryModal({
  application,
  history,
  loading,
  onClose,
}) {
  if (!application) return null;

  return (
    <section className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(event) => event.stopPropagation()}>
        <div className="card-header">
          <div>
            <p className="section-kicker">Audit trail</p>
            <h2>Status History</h2>
            <p className="muted">
              {application.job_title} — {application.company_name}
            </p>
          </div>

          <button type="button" className="btn btn-soft" onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <p className="muted">Loading status history...</p>}

        {!loading && history.length === 0 && (
          <p className="empty">No status history found.</p>
        )}

        {!loading && history.length > 0 && (
          <div className="history-list">
            {history.map((item) => (
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
  );
}

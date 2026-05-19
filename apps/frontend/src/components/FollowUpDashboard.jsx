import React from "react";

export default function FollowUpDashboard({ followUps, onEdit }) {
  return (
    <section className="card followup-card">
      <div className="card-header">
        <div>
          <p className="section-kicker">Operational queue</p>
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
                  className="btn btn-soft btn-small"
                  onClick={() => onEdit(application)}
                >
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

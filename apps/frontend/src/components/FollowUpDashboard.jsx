import React from "react";
import CollapsibleCard from "./CollapsibleCard";

export default function FollowUpDashboard({ followUps, onEdit }) {
  return (
    <CollapsibleCard
      id="follow-up-dashboard"
      className="card followup-card"
      kicker="Operational queue"
      title="Follow-ups"
      description="Active applications with follow-up dates, including interviews and offers."
    >
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
    </CollapsibleCard>
  );
}

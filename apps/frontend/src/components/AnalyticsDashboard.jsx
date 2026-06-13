import React from "react";
import CollapsibleCard from "./CollapsibleCard";

function formatPercent(value) {
  const number = Number(value) || 0;
  return `${number.toFixed(number % 1 === 0 ? 0 : 2)}%`;
}

function GroupList({ title, items }) {
  return (
    <article className="analytics-group">
      <div className="analytics-group-header">
        <h3>{title}</h3>
        <span>{items?.length || 0}</span>
      </div>

      {!items || items.length === 0 ? (
        <p className="muted">No data available.</p>
      ) : (
        <div className="analytics-bars">
          {items.map((item) => {
            const max = Math.max(...items.map((entry) => entry.count), 1);
            const width = `${Math.max((item.count / max) * 100, 8)}%`;

            return (
              <div className="analytics-bar-row" key={`${title}-${item.name}`}>
                <div className="analytics-bar-label">
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function AnalyticsDashboard({ analytics, loading, onRefresh }) {
  if (loading && !analytics) {
    return (
      <CollapsibleCard
        id="dashboard-analytics"
        className="card analytics-card"
        kicker="Analytics"
        title="Dashboard Analytics"
        description="Loading analytics from backend..."
      />
    );
  }

  if (!analytics) {
    return (
      <CollapsibleCard
        id="dashboard-analytics"
        className="card analytics-card"
        kicker="Analytics"
        title="Dashboard Analytics"
        description="Analytics are not available yet."
        action={<button type="button" className="btn btn-soft" onClick={onRefresh}>Retry</button>}
      />
    );
  }

  return (
    <CollapsibleCard
      id="dashboard-analytics"
      className="card analytics-card"
      kicker="Analytics"
      title="Dashboard Analytics"
      description={`Backend-generated metrics from PostgreSQL, including pipeline health, follow-ups, conversions, and CV usage.${loading ? " Refreshing..." : ""}`}
      action={<button type="button" className="btn btn-soft" onClick={onRefresh}>Refresh Analytics</button>}
    >
      <div className="analytics-metrics">
        <article className="analytics-metric">
          <span>Total</span>
          <strong>{analytics.total_applications}</strong>
          <p>All tracked applications</p>
        </article>

        <article className="analytics-metric">
          <span>Active</span>
          <strong>{analytics.active_applications}</strong>
          <p>Includes interviews and offers</p>
        </article>

        <article className="analytics-metric">
          <span>Closed</span>
          <strong>{analytics.closed_applications}</strong>
          <p>Not in the active status set</p>
        </article>

        <article className="analytics-metric analytics-metric-danger">
          <span>Overdue</span>
          <strong>{analytics.overdue_follow_ups}</strong>
          <p>Follow-ups past due</p>
        </article>

        <article className="analytics-metric">
          <span>Interview Rate</span>
          <strong>{formatPercent(analytics.interview_rate_percent)}</strong>
          <p>Interview-stage applications</p>
        </article>

        <article className="analytics-metric">
          <span>Offer Rate</span>
          <strong>{formatPercent(analytics.offer_rate_percent)}</strong>
          <p>Offers from total applications</p>
        </article>

        <article className="analytics-metric">
          <span>Rejection Rate</span>
          <strong>{formatPercent(analytics.rejection_rate_percent)}</strong>
          <p>Rejected from total applications</p>
        </article>

        <article className="analytics-metric analytics-metric-warning">
          <span>High Priority</span>
          <strong>{analytics.high_priority}</strong>
          <p>Important active targets</p>
        </article>
      </div>

      <div className="analytics-groups">
        <GroupList title="By Status" items={analytics.by_status} />
        <GroupList title="By Source" items={analytics.by_source} />
        <GroupList title="By Priority" items={analytics.by_priority} />
        <GroupList title="By Work Mode" items={analytics.by_work_mode} />
        <GroupList title="By CV Version" items={analytics.by_cv_version} />
      </div>
    </CollapsibleCard>
  );
}

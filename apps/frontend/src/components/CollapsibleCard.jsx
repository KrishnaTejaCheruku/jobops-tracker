import React, { useEffect, useState } from "react";

const STORAGE_KEY = "jobops-dashboard-collapsed-sections";

function readCollapsedSections() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeCollapsedSection(sectionId, collapsed) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readCollapsedSections();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      [sectionId]: collapsed,
    }),
  );
}

export default function CollapsibleCard({
  id,
  className = "card",
  kicker,
  title,
  description,
  action,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedSections = readCollapsedSections();
    setCollapsed(Boolean(savedSections[id]));
  }, [id]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      writeCollapsedSection(id, next);
      return next;
    });
  }

  return (
    <section className={`${className} collapsible-card ${collapsed ? "is-collapsed" : ""}`} id={id}>
      <div className="card-header collapsible-card-header">
        <button
          type="button"
          className="collapsible-card-toggle"
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
          onClick={toggleCollapsed}
        >
          <span>
            {kicker && <p className="section-kicker">{kicker}</p>}
            <h2>{title}</h2>
            {description && <p className="muted">{description}</p>}
          </span>
          <strong aria-hidden="true">{collapsed ? "v" : "^"}</strong>
        </button>

        {action && <div className="collapsible-card-action">{action}</div>}
      </div>

      {!collapsed && children && <div className="collapsible-card-body">{children}</div>}
    </section>
  );
}

import React from "react";
import CollapsibleCard from "./CollapsibleCard";

export default function CVVersionsPanel({
  cvVersions,
  form,
  loading,
  onChange,
  onCreate,
  onDelete,
  onRefresh,
}) {
  return (
    <CollapsibleCard
      id="cv-version-management"
      className="card cv-card"
      kicker="CV strategy"
      title="CV Versions"
      description={`Create reusable CV versions and link them to job applications.${loading ? " Loading..." : ""}`}
      action={<button type="button" className="btn btn-soft" onClick={onRefresh}>Refresh CVs</button>}
    >
      <form className="cv-version-form" onSubmit={onCreate}>
        <label>
          CV Name *
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="cv_kubernetes_terraform_v1"
            required
          />
        </label>

        <label>
          Focus Area
          <input
            name="focus_area"
            value={form.focus_area}
            onChange={onChange}
            placeholder="Kubernetes / Terraform / AWS"
          />
        </label>

        <label>
          File Path Placeholder
          <input
            name="file_path"
            value={form.file_path}
            onChange={onChange}
            placeholder="future-s3-path"
          />
        </label>

        <label>
          Notes
          <input
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="What this CV is optimized for"
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Add CV"}
        </button>
      </form>

      {cvVersions.length === 0 ? (
        <p className="empty">No CV versions yet.</p>
      ) : (
        <div className="cv-version-list">
          {cvVersions.map((cv) => (
            <article className="cv-version-item" key={cv.id}>
              <div>
                <strong>{cv.name}</strong>
                <p>{cv.focus_area || "No focus area set"}</p>
                {cv.notes && <small>{cv.notes}</small>}
              </div>

              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => onDelete(cv.id)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </CollapsibleCard>
  );
}

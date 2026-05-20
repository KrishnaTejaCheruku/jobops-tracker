import React, { useRef, useState } from "react";

export default function CSVDataPanel({
  exportUrl,
  loading,
  importResult,
  onImport,
}) {
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFileName(file?.name || "");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      return;
    }

    await onImport(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSelectedFileName("");
  }

  return (
    <section className="card cv-card">
      <div className="card-header">
        <div>
          <p className="section-kicker">Data portability</p>
          <h2>CSV Import / Export</h2>
          <p className="muted">
            Export applications for backup or spreadsheet review. Import creates new rows,
            updates duplicates, and skips identical records.
          </p>
        </div>

        <a className="btn btn-soft" href={exportUrl}>
          Export CSV
        </a>
      </div>

      <form className="cv-version-form" onSubmit={handleSubmit}>
        <label>
          CSV File
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
          />
        </label>

        <label>
          Selected File
          <input value={selectedFileName || "No file selected"} readOnly />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading || !selectedFileName}>
          {loading ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {importResult && (
        <div className="cv-version-list">
          <article className="cv-version-item">
            <div>
              <strong>
                Imported {importResult.imported || 0} · Updated{" "}
                {importResult.updated || 0} · Skipped {importResult.skipped || 0}
                {importResult.failed > 0 ? ` · Failed ${importResult.failed}` : ""}
              </strong>

              {importResult.errors?.length > 0 ? (
                <p>{importResult.errors.slice(0, 5).join(" | ")}</p>
              ) : (
                <p>No import errors.</p>
              )}

              {importResult.errors?.length > 5 && (
                <small>
                  Showing first 5 errors out of {importResult.errors.length}.
                </small>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

import React, { useRef, useState } from "react";
import CollapsibleCard from "./CollapsibleCard";

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
    <CollapsibleCard
      id="csv-import-export"
      className="card cv-card"
      kicker="Data portability"
      title="CSV Import / Export"
      description="Export applications for backup or spreadsheet review. Import creates new rows, updates duplicates, and skips identical records."
      action={<a className="btn btn-soft" href={exportUrl}>Export CSV</a>}
    >
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
    </CollapsibleCard>
  );
}

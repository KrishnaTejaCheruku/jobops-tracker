import React from "react";
import {
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../lib/constants";

export default function FiltersBar({ filters, onChange, onClear }) {
  return (
    <div className="filters">
      <label>
        Search
        <input
          name="search"
          value={filters.search}
          onChange={onChange}
          placeholder="Search job, company, recruiter, CV, keywords..."
        />
      </label>

      <label>
        Status
        <select name="status" value={filters.status} onChange={onChange}>
          <option>All</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>

      <label>
        Priority
        <select name="priority" value={filters.priority} onChange={onChange}>
          <option>All</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </label>

      <label>
        Source
        <select name="source" value={filters.source} onChange={onChange}>
          <option>All</option>
          {SOURCE_OPTIONS.map((source) => (
            <option key={source}>{source}</option>
          ))}
        </select>
      </label>

      <label>
        Work Mode
        <select name="work_mode" value={filters.work_mode} onChange={onChange}>
          <option>All</option>
          {WORK_MODE_OPTIONS.map((workMode) => (
            <option key={workMode}>{workMode}</option>
          ))}
        </select>
      </label>

      <button type="button" className="btn btn-soft clear-filters" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

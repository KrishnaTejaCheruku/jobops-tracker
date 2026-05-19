import React, { useEffect, useMemo, useState } from "react";

import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationsTable from "./components/ApplicationsTable";
import CVVersionsPanel from "./components/CVVersionsPanel";
import FiltersBar from "./components/FiltersBar";
import FollowUpDashboard from "./components/FollowUpDashboard";
import Notice from "./components/Notice";
import StatusHistoryModal from "./components/StatusHistoryModal";
import SummaryCard from "./components/SummaryCard";

import {
  EMPTY_APPLICATION_FORM,
  EMPTY_CV_VERSION_FORM,
  EMPTY_FILTERS,
} from "./lib/constants";

import {
  createApplication,
  createCVVersion,
  deleteApplication,
  deleteCVVersion,
  getDashboardAnalytics,
  listApplications,
  listCVVersions,
  listStatusHistory,
  updateApplication,
} from "./lib/api";

import { getDateOnly, getFollowUpState } from "./lib/date";

function normalizeApplicationForForm(application) {
  return {
    job_title: application.job_title || "",
    company_name: application.company_name || "",
    source: application.source || "LinkedIn",
    job_url: application.job_url || "",
    location: application.location || "",
    work_mode: application.work_mode || "Hybrid",
    status: application.status || "Saved",
    cv_version: application.cv_version || "",
    cv_version_id: application.cv_version_id || 0,
    salary_range: application.salary_range || "",
    follow_up_date: application.follow_up_date || "",
    recruiter_name: application.recruiter_name || "",
    recruiter_email: application.recruiter_email || "",
    job_description: application.job_description || "",
    priority: application.priority || "Medium",
    notes: application.notes || "",
    applied_date: application.applied_date || "",
  };
}

function buildApplicationPayload(form) {
  return {
    ...form,
    cv_version_id: Number(form.cv_version_id) || 0,
  };
}

export default function App() {
  const [form, setForm] = useState(EMPTY_APPLICATION_FORM);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applications, setApplications] = useState([]);
  const [cvVersions, setCVVersions] = useState([]);
  const [cvVersionForm, setCVVersionForm] = useState(EMPTY_CV_VERSION_FORM);
  const [analytics, setAnalytics] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [historyApplication, setHistoryApplication] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [cvVersionLoading, setCVVersionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = editingId !== null;

  const summary = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((app) => app.status === "Applied").length,
      interviews: applications.filter((app) =>
        ["Interview Scheduled", "Technical Interview"].includes(app.status)
      ).length,
      highPriority: applications.filter((app) => app.priority === "High").length,
    };
  }, [applications]);

  const followUps = useMemo(() => {
    const items = applications
      .filter((application) => getFollowUpState(application) !== "none")
      .map((application) => ({
        ...application,
        follow_up_state: getFollowUpState(application),
      }))
      .sort((a, b) => {
        const aDate = getDateOnly(a.follow_up_date);
        const bDate = getDateOnly(b.follow_up_date);

        if (!aDate || !bDate) return 0;
        return aDate.getTime() - bDate.getTime();
      });

    return {
      items,
      overdue: items.filter((item) => item.follow_up_state === "overdue").length,
      today: items.filter((item) => item.follow_up_state === "today").length,
      upcoming: items.filter((item) => item.follow_up_state === "upcoming").length,
    };
  }, [applications]);

  async function refreshApplications(activeFilters = filters) {
    setListLoading(true);
    setError("");

    try {
      const data = await listApplications(activeFilters);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setListLoading(false);
    }
  }

  async function refreshCVVersions() {
    setCvVersionLoading(true);
    setError("");

    try {
      const data = await listCVVersions();
      setCVVersions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCvVersionLoading(false);
    }
  }

  async function refreshAnalytics() {
    setAnalyticsLoading(true);
    setError("");

    try {
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function refreshDashboardData(activeFilters = filters) {
    await Promise.all([
      refreshApplications(activeFilters),
      refreshAnalytics(),
    ]);
  }

  useEffect(() => {
    refreshApplications(filters);
  }, [filters]);

  useEffect(() => {
    refreshCVVersions();
    refreshAnalytics();
  }, []);

  function handleApplicationChange(event) {
    const { name, value } = event.target;

    if (name === "cv_version_id") {
      const cvVersionID = Number(value) || 0;
      const selectedCV = cvVersions.find((cv) => cv.id === cvVersionID);

      setForm((current) => ({
        ...current,
        cv_version_id: cvVersionID,
        cv_version: selectedCV?.name || "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCVVersionFormChange(event) {
    const { name, value } = event.target;

    setCVVersionForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function startEdit(application) {
    setEditingId(application.id);
    setForm(normalizeApplicationForForm(application));
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_APPLICATION_FORM);
    setMessage("");
    setError("");
  }

  async function submitApplication(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const payload = buildApplicationPayload(form);

      if (isEditing) {
        await updateApplication(editingId, payload);
      } else {
        await createApplication(payload);
      }

      setForm(EMPTY_APPLICATION_FORM);
      setEditingId(null);
      setMessage(isEditing ? "Application updated successfully." : "Application saved successfully.");
      await refreshDashboardData(filters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitCVVersion(event) {
    event.preventDefault();

    setCvVersionLoading(true);
    setMessage("");
    setError("");

    try {
      await createCVVersion(cvVersionForm);
      setCVVersionForm(EMPTY_CV_VERSION_FORM);
      setMessage("CV version created successfully.");
      await refreshCVVersions();
      await refreshAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setCvVersionLoading(false);
    }
  }

  async function removeCVVersion(id) {
    if (!window.confirm("Delete this CV version?")) return;

    setMessage("");
    setError("");

    try {
      await deleteCVVersion(id);
      setMessage("CV version deleted.");
      await refreshCVVersions();
      await refreshDashboardData(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeApplication(id) {
    if (!window.confirm("Delete this application?")) return;

    setMessage("");
    setError("");

    try {
      await deleteApplication(id);

      if (editingId === id) cancelEdit();
      if (historyApplication?.id === id) closeHistory();

      setMessage("Application deleted.");
      await refreshDashboardData(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openHistory(application) {
    setHistoryApplication(application);
    setStatusHistory([]);
    setHistoryLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await listStatusHistory(application.id);
      setStatusHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryApplication(null);
    setStatusHistory([]);
    setHistoryLoading(false);
  }

  return (
    <main className="app-shell">
      <section className="hero hero-simple">
        <div>
          <p className="eyebrow">Open-source job application tracker</p>
          <h1>JobOps Tracker</h1>
          <p className="subtitle">
            Track job applications, CV versions, follow-ups, recruiters, and pipeline status without Excel.
          </p>
        </div>
      </section>

      <section className="summary-grid">
        <SummaryCard label="Visible Applications" value={summary.total} />
        <SummaryCard label="Applied" value={summary.applied} tone="blue" />
        <SummaryCard label="Interviews" value={summary.interviews} tone="purple" />
        <SummaryCard label="High Priority" value={summary.highPriority} tone="red" />
      </section>

      <section className="summary-grid secondary-summary-grid">
        <SummaryCard label="Overdue Follow-ups" value={followUps.overdue} tone="red" />
        <SummaryCard label="Due Today" value={followUps.today} tone="amber" />
        <SummaryCard label="Upcoming Follow-ups" value={followUps.upcoming} tone="blue" />
        <SummaryCard label="CV Versions" value={cvVersions.length} tone="green" />
      </section>

      <Notice message={message} error={error} />

      <AnalyticsDashboard
        analytics={analytics}
        loading={analyticsLoading}
        onRefresh={refreshAnalytics}
      />

      <CVVersionsPanel
        cvVersions={cvVersions}
        form={cvVersionForm}
        loading={cvVersionLoading}
        onChange={handleCVVersionFormChange}
        onCreate={submitCVVersion}
        onDelete={removeCVVersion}
        onRefresh={refreshCVVersions}
      />

      <FollowUpDashboard followUps={followUps} onEdit={startEdit} />

      <section className="workspace">
        <ApplicationForm
          form={form}
          cvVersions={cvVersions}
          isEditing={isEditing}
          editingId={editingId}
          loading={loading}
          onChange={handleApplicationChange}
          onSubmit={submitApplication}
          onCancel={cancelEdit}
        />

        <div className="right-pane">
          <section className="card filters-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">Query controls</p>
                <h2>Search & Filters</h2>
              </div>
            </div>

            <FiltersBar
              filters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
            />
          </section>

          <ApplicationsTable
            applications={applications}
            listLoading={listLoading}
            onRefresh={() => refreshApplications(filters)}
            onEdit={startEdit}
            onDelete={removeApplication}
            onHistory={openHistory}
          />
        </div>
      </section>

      <StatusHistoryModal
        application={historyApplication}
        history={statusHistory}
        loading={historyLoading}
        onClose={closeHistory}
      />
    </main>
  );
}

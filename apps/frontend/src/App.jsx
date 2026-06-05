import React, { useEffect, useMemo, useState } from "react";

import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ApplicationDetailModal from "./components/ApplicationDetailModal";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationsTable from "./components/ApplicationsTable";
import AuthGate from "./components/AuthGate";
import CaptureReviewModal from "./components/CaptureReviewModal";
import CSVDataPanel from "./components/CSVDataPanel";
import CVVersionsPanel from "./components/CVVersionsPanel";
import FiltersBar from "./components/FiltersBar";
import FollowUpDashboard from "./components/FollowUpDashboard";
import Notice from "./components/Notice";
import StatusHistoryModal from "./components/StatusHistoryModal";
import ThemeToggle from "./components/ThemeToggle";

import {
  CLOSED_STATUSES,
  EMPTY_APPLICATION_FORM,
  EMPTY_CV_VERSION_FORM,
  EMPTY_FILTERS,
} from "./lib/constants";

import {
  createApplication,
  createCVVersion,
  deleteApplication,
  deleteCVVersion,
  getApplicationsExportURL,
  getDashboardAnalytics,
  importApplicationsCSV,
  listApplications,
  listCVVersions,
  listStatusHistory,
  updateApplication,
} from "./lib/api";

import { getDateOnly, getFollowUpState } from "./lib/date";
import {
  buildManualCapturePayload,
  parseCaptureFromLocation,
} from "./lib/capture";

function getUserDisplayName(user) {
  const email = String(user?.email || "").trim();

  if (!email) return "";

  return email.split("@")[0] || "";
}

function formatDashboardDate(value) {
  const date = getDateOnly(value);

  if (!date) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function percentage(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function DashboardSidebar({ user }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-brand">
        <span>JO</span>
        <strong>JobOps Tracker</strong>
      </div>

      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <a href="#dashboard-overview" className="active">Dashboard</a>
        <a href="#applications">Pipeline</a>
        <a href="#follow-ups">Follow-ups</a>
        <a href="#applications">Interviews</a>
        <a href="#cv-versions">CV Versions</a>
        <a href="#analytics">Analytics</a>
        <a href="#capture">Settings</a>
      </nav>

      <div className="dashboard-helper-card">
        <strong>Passwordless by design</strong>
        <p>Secure magic link login.</p>
        <span>Learn more -&gt;</span>
      </div>

      <div className="dashboard-sidebar-user">
        <span>{user?.email?.charAt(0)?.toUpperCase() || "U"}</span>
        <div>
          <strong>{user?.email || "Signed in"}</strong>
          <p>Private workspace</p>
        </div>
      </div>
    </aside>
  );
}

function PipelineSnapshot({ analytics, summary, followUps }) {
  const active = analytics?.active_applications ?? summary.active;
  const offers = analytics?.offers ?? 0;
  const cards = [
    ["ACTIVE", active, "Current pipeline", "blue"],
    ["INTERVIEWS", summary.interviews, "From your applications", "purple"],
    ["FOLLOW-UPS", followUps.items.length, "Scheduled follow-ups", "amber"],
    ["OFFERS", offers, "Current offers", "green"],
  ];

  return (
    <section className="dashboard-card pipeline-snapshot">
      <div className="dashboard-section-heading">
        <p className="section-kicker">Pipeline snapshot</p>
      </div>
      <div className="pipeline-snapshot-grid">
        {cards.map(([label, value, helper, tone]) => (
          <article className={`pipeline-tile pipeline-tile-${tone}`} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PipelineBreakdown({ summary, followUps }) {
  const total = Math.max(summary.total, 0);
  const active = summary.active;
  const interviews = summary.interviews;
  const followUpCount = followUps.items.length;
  const offers = summary.offers;
  const breakdownTotal = Math.max(active + interviews + followUpCount + offers, 0);
  const segments = [
    ["Active", active, "#5b4df5"],
    ["Interviews", interviews, "#3b82f6"],
    ["Follow-ups", followUpCount, "#94a3b8"],
    ["Offers", offers, "#111827"],
  ];
  const gradient = breakdownTotal
    ? `conic-gradient(${segments
        .reduce(
          (acc, [, count, color]) => {
            const start = acc.offset;
            const end = start + percentage(count, breakdownTotal);
            acc.parts.push(`${color} ${start}% ${end}%`);
            acc.offset = end;
            return acc;
          },
          { offset: 0, parts: [] },
        )
        .parts.join(", ")}, #eef2f7 0)`
    : "#eef2f7";

  return (
    <section className="dashboard-card pipeline-breakdown">
      <p className="section-kicker">Pipeline breakdown</p>
      <div className="breakdown-content">
        <div className="donut-chart" style={{ background: gradient }}>
          <div>
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>
        <div className="breakdown-list">
          {segments.map(([label, count, color]) => (
            <p key={label}>
              <span><i style={{ background: color }} />{label}</span>
              <strong>{count} ({percentage(count, breakdownTotal)}%)</strong>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplicationsOverTime({ applications }) {
  const datedApplications = applications
    .map((application) => getDateOnly(application.applied_date))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (datedApplications.length === 0) {
    return (
      <section className="dashboard-card applications-over-time">
        <p className="section-kicker">Applications over time</p>
        <div className="dashboard-empty">No applied dates available yet.</div>
      </section>
    );
  }

  const points = datedApplications.map((date, index) => {
    const x = datedApplications.length === 1 ? 0 : (index / (datedApplications.length - 1)) * 100;
    const y = 100 - ((index + 1) / datedApplications.length) * 82;
    return `${x},${y}`;
  });
  const labels = datedApplications.filter((_, index) =>
    index === 0 || index === datedApplications.length - 1 || index % 2 === 0,
  );

  return (
    <section className="dashboard-card applications-over-time">
      <div className="dashboard-section-row">
        <p className="section-kicker">Applications over time</p>
        <span>Last 30 days</span>
      </div>
      <svg viewBox="0 0 100 110" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points.join(" ")} />
      </svg>
      <div className="chart-labels">
        {labels.slice(0, 5).map((date) => (
          <span key={date.toISOString()}>{formatDashboardDate(date)}</span>
        ))}
      </div>
    </section>
  );
}

function UpcomingFollowUps({ followUps, onEdit }) {
  const items = followUps.items.slice(0, 3);

  return (
    <section className="dashboard-card" id="follow-ups">
      <p className="section-kicker">Up next / follow-ups</p>
      {items.length === 0 ? (
        <div className="dashboard-empty">No follow-ups due or scheduled.</div>
      ) : (
        <div className="dashboard-list">
          {items.map((item) => (
            <article key={`upcoming-${item.id}`}>
              <span className={`timeline-dot timeline-${item.follow_up_state}`} />
              <div>
                <strong>{item.status === "Technical Interview" ? "Technical Interview" : "Follow up"}</strong>
                <p>{item.company_name}</p>
              </div>
              <button type="button" onClick={() => onEdit(item)}>
                {formatDashboardDate(item.follow_up_date)}
              </button>
            </article>
          ))}
        </div>
      )}
      <a href="#applications" className="dashboard-link">View all follow-ups -&gt;</a>
    </section>
  );
}

function RecentActivity({ applications }) {
  const items = [...applications]
    .sort((a, b) => String(b.applied_date || "").localeCompare(String(a.applied_date || "")))
    .slice(0, 3);

  return (
    <section className="dashboard-card">
      <p className="section-kicker">Recent activity</p>
      {items.length === 0 ? (
        <div className="dashboard-empty">No activity yet.</div>
      ) : (
        <div className="dashboard-list activity-list">
          {items.map((item) => (
            <article key={`activity-${item.id}`}>
              <span className="activity-icon">+</span>
              <div>
                <strong>You added an application</strong>
                <p>{item.company_name} · {item.job_title}</p>
              </div>
              <small>{item.applied_date ? formatDashboardDate(item.applied_date) : "Saved"}</small>
            </article>
          ))}
        </div>
      )}
      <a href="#applications" className="dashboard-link">View all activity -&gt;</a>
    </section>
  );
}

function CVVersionSummary({ cvVersions }) {
  return (
    <section className="dashboard-card cv-summary-card" id="cv-versions">
      <div className="dashboard-section-row">
        <div>
          <p className="section-kicker">CV version management</p>
          <p className="muted">Track and manage your CV variants for different applications.</p>
        </div>
        <a href="#cv-management" className="dashboard-link">Manage CV versions -&gt;</a>
      </div>
      {cvVersions.length === 0 ? (
        <div className="dashboard-empty">No CV versions yet.</div>
      ) : (
        <div className="cv-summary-list">
          {cvVersions.slice(0, 3).map((cv, index) => (
            <article key={cv.id}>
              <strong>{cv.name}</strong>
              {index === 0 && <span>Latest</span>}
              <p>{cv.focus_area || cv.notes || "No focus area set"}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeAppliedDate(value) {
  const today = getTodayDateValue();
  const dateValue = String(value || "").trim();

  if (dateValue === "") {
    return today;
  }

  if (dateValue > today) {
    return today;
  }

  return dateValue;
}

function buildEmptyApplicationForm() {
  return {
    ...EMPTY_APPLICATION_FORM,
    applied_date: getTodayDateValue(),
  };
}

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
    applied_date: normalizeAppliedDate(application.applied_date),
  };
}

function buildApplicationPayload(form) {
  return {
    ...form,
    applied_date: normalizeAppliedDate(form.applied_date),
    cv_version_id: Number(form.cv_version_id) || 0,
  };
}

function detailsToFieldErrors(details = []) {
  return details.reduce((accumulator, item) => {
    if (item.field && item.message) {
      accumulator[item.field] = item.message;
    }

    return accumulator;
  }, {});
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem("jobops-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function AppContent({ user, onLogout, isLoggingOut }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [form, setForm] = useState(buildEmptyApplicationForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState({
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const [cvVersions, setCVVersions] = useState([]);
  const [cvVersionForm, setCVVersionForm] = useState(EMPTY_CV_VERSION_FORM);
  const [analytics, setAnalytics] = useState(null);
  const [csvImportResult, setCSVImportResult] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [detailApplication, setDetailApplication] = useState(null);
  const [historyApplication, setHistoryApplication] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [cvVersionLoading, setCvVersionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [csvImportLoading, setCSVImportLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [capturePayload, setCapturePayload] = useState(null);
  const [captureError, setCaptureError] = useState("");
  const [captureLoading, setCaptureLoading] = useState(false);
  const [capturePanelOpen, setCapturePanelOpen] = useState(false);
  const [manualCaptureURL, setManualCaptureURL] = useState("");

  const isEditing = editingId !== null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("jobops-theme", theme);
  }, [theme]);

  const summary = useMemo(() => {
    const active = applications.filter((app) => !CLOSED_STATUSES.includes(app.status)).length;

    return {
      total: applications.length,
      active,
      applied: applications.filter((app) => app.status === "Applied").length,
      interviews: applications.filter((app) =>
        ["Interview Scheduled", "Technical Interview"].includes(app.status),
      ).length,
      offers: applications.filter((app) => app.status === "Offer").length,
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

  async function refreshApplications(
    activeFilters = filters,
    activePagination = pagination,
    activeSort = sort,
  ) {
    setListLoading(true);
    setError("");

    try {
      const data = await listApplications(
        activeFilters,
        {
          page: activePagination.page,
          pageSize: activePagination.pageSize,
        },
        activeSort,
      );

      setApplications(data.items || []);
      setPagination((current) => ({
        ...current,
        page: data.page,
        pageSize: data.page_size,
        totalItems: data.total_items,
        totalPages: data.total_pages,
      }));
      setSort({
        sortBy: data.sort_by || activeSort.sortBy,
        sortOrder: data.sort_order || activeSort.sortOrder,
      });
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

  async function refreshDashboardData(
    activeFilters = filters,
    activePagination = pagination,
    activeSort = sort,
  ) {
    await Promise.all([
      refreshApplications(activeFilters, activePagination, activeSort),
      refreshAnalytics(),
    ]);
  }

  useEffect(() => {
    refreshApplications(filters, pagination, sort);
  }, [filters, pagination.page, pagination.pageSize, sort.sortBy, sort.sortOrder]);

  useEffect(() => {
    refreshCVVersions();
    refreshAnalytics();
  }, []);

  useEffect(() => {
    try {
      const parsedPayload = parseCaptureFromLocation(window.location);

      if (parsedPayload) {
        setCapturePayload(parsedPayload);
        setCaptureError("");
        window.history.replaceState({}, "", "/");
      }
    } catch (err) {
      setCaptureError(err.message);
      setCapturePanelOpen(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function handleApplicationChange(event) {
    const { name, value } = event.target;

    setFieldErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });

    if (name === "applied_date") {
      setForm((current) => ({
        ...current,
        applied_date: normalizeAppliedDate(value),
      }));

      return;
    }

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

    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setFilters(EMPTY_FILTERS);
  }

  function changePage(nextPage) {
    setPagination((current) => ({
      ...current,
      page: nextPage,
    }));
  }

  function changePageSize(nextPageSize) {
    setPagination((current) => ({
      ...current,
      page: 1,
      pageSize: nextPageSize,
    }));
  }

  function changeSort(columnKey) {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setSort((current) => {
      if (current.sortBy === columnKey) {
        return {
          sortBy: columnKey,
          sortOrder: current.sortOrder === "asc" ? "desc" : "asc",
        };
      }

      return {
        sortBy: columnKey,
        sortOrder: "asc",
      };
    });
  }

  function openDetail(application) {
    setDetailApplication(application);
    setMessage("");
    setError("");
  }

  function closeDetail() {
    setDetailApplication(null);
  }

  function startEdit(application) {
    setDetailApplication(null);
    setEditingId(application.id);
    setForm(normalizeApplicationForForm(application));
    setFieldErrors({});
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(buildEmptyApplicationForm());
    setFieldErrors({});
    setMessage("");
    setError("");
  }

  function openCapturePanel() {
    setCapturePanelOpen(true);
    setCaptureError("");
    setMessage("");
    setError("");
  }

  function closeCapturePanel() {
    setCapturePanelOpen(false);
    setManualCaptureURL("");
  }

  function openManualCapture(event) {
    event.preventDefault();
    const payload = buildManualCapturePayload(manualCaptureURL);

    setCapturePayload(payload);
    setCapturePanelOpen(false);
    setManualCaptureURL("");
    setCaptureError("");
  }

  function scrollToCSVImport() {
    closeCapturePanel();
    document.querySelector(".csv-card, .cv-card")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function saveCapturedApplication(payload) {
    setCaptureLoading(true);
    setCaptureError("");
    setMessage("");
    setError("");

    try {
      await createApplication({
        ...payload,
        cv_version_id: Number(payload.cv_version_id) || 0,
      });

      const firstPage = {
        ...pagination,
        page: 1,
      };

      setCapturePayload(null);
      setPagination(firstPage);
      setMessage("Captured job saved successfully.");
      await refreshDashboardData(filters, firstPage, sort);
    } catch (err) {
      setCaptureError(err.message);
    } finally {
      setCaptureLoading(false);
    }
  }

  async function submitApplication(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");
    setFieldErrors({});

    try {
      const payload = buildApplicationPayload(form);

      if (isEditing) {
        await updateApplication(editingId, payload);
      } else {
        await createApplication(payload);
      }

      const firstPage = {
        ...pagination,
        page: 1,
      };

      setForm(buildEmptyApplicationForm());
      setEditingId(null);
      setPagination(firstPage);
      setMessage(isEditing ? "Application updated successfully." : "Application saved successfully.");
      await refreshDashboardData(filters, firstPage, sort);
    } catch (err) {
      setError(err.message);

      if (err.details?.length > 0) {
        setFieldErrors(detailsToFieldErrors(err.details));
      }
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

  async function importCSV(file) {
    setCSVImportLoading(true);
    setCSVImportResult(null);
    setMessage("");
    setError("");

    try {
      const result = await importApplicationsCSV(file);
      const firstPage = {
        ...pagination,
        page: 1,
      };

      setCSVImportResult(result);
      setPagination(firstPage);

      if (result.failed > 0) {
        setError(`CSV import completed with ${result.failed} failed row(s).`);
      } else {
        setMessage(
          `CSV import completed. Imported ${result.imported || 0}, updated ${result.updated || 0}, skipped ${result.skipped || 0}.`,
        );
      }

      await refreshDashboardData(filters, firstPage, sort);
    } catch (err) {
      setError(err.message);
    } finally {
      setCSVImportLoading(false);
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
      await refreshDashboardData(filters, pagination, sort);
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
      if (detailApplication?.id === id) closeDetail();
      if (historyApplication?.id === id) closeHistory();

      setMessage("Application deleted.");
      await refreshDashboardData(filters, pagination, sort);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openHistory(application) {
    setDetailApplication(null);
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
    <main className="dashboard-shell">
      <DashboardSidebar user={user} />

      <section className="dashboard-main" id="dashboard-overview">
        <header className="dashboard-topbar">
          <label className="dashboard-search">
            <span>Search applications, companies, notes...</span>
            <input
              value={filters.search}
              onChange={(event) =>
                handleFilterChange({
                  target: { name: "search", value: event.target.value },
                })
              }
              placeholder="Search applications, companies, notes..."
            />
            <kbd>⌘K</kbd>
          </label>

          <div className="dashboard-top-actions">
            <button type="button" className="btn btn-capture" onClick={openCapturePanel}>
              Capture Job
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                document.querySelector(".form-card")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              + Add Application
            </button>
            <a className="btn btn-soft" href={getApplicationsExportURL()}>
              Export
            </a>
            <button type="button" className="dashboard-icon-button" aria-label="Notifications">
              ○
            </button>
            <span className="dashboard-avatar">{user?.email?.charAt(0)?.toUpperCase() || "U"}</span>
            <button
              type="button"
              className="btn btn-soft"
              disabled={isLoggingOut}
              onClick={onLogout}
            >
              Logout
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <section className="dashboard-greeting">
          <div>
            <h1>
              Good morning{getUserDisplayName(user) ? `, ${getUserDisplayName(user)}` : ""} 👋
            </h1>
            <p>Here’s what’s happening with your job search.</p>
          </div>
        </section>

        <Notice message={message} error={error} />

        <section className="dashboard-grid dashboard-grid-top">
          <div className="dashboard-grid-wide">
            <PipelineSnapshot analytics={analytics} summary={summary} followUps={followUps} />
          </div>
          <PipelineBreakdown summary={summary} followUps={followUps} />
        </section>

        <section className="dashboard-grid dashboard-grid-middle">
          <ApplicationsOverTime applications={applications} />
          <UpcomingFollowUps followUps={followUps} onEdit={startEdit} />
          <RecentActivity applications={applications} />
        </section>

        <section className="dashboard-grid dashboard-grid-lower">
          <CVVersionSummary cvVersions={cvVersions} />
          <section className="dashboard-card dashboard-highlight-card">
            <p className="section-kicker">Focus</p>
            <h2>Stay ahead in your search</h2>
            <p>Consistent follow-ups and tailored CVs make all the difference.</p>
            <a href="#analytics" className="dashboard-link">View analytics -&gt;</a>
          </section>
        </section>

        <section className="dashboard-workbench">
          <div id="analytics">
            <AnalyticsDashboard
              analytics={analytics}
              loading={analyticsLoading}
              onRefresh={refreshAnalytics}
            />
          </div>

          <CSVDataPanel
            exportUrl={getApplicationsExportURL()}
            loading={csvImportLoading}
            importResult={csvImportResult}
            onImport={importCSV}
          />

          <div id="cv-management">
            <CVVersionsPanel
              cvVersions={cvVersions}
              form={cvVersionForm}
              loading={cvVersionLoading}
              onChange={handleCVVersionFormChange}
              onCreate={submitCVVersion}
              onDelete={removeCVVersion}
              onRefresh={refreshCVVersions}
            />
          </div>

          <FollowUpDashboard followUps={followUps} onEdit={startEdit} />

          <section className="workspace" id="applications">
            <ApplicationForm
              form={form}
              cvVersions={cvVersions}
              isEditing={isEditing}
              editingId={editingId}
              loading={loading}
              fieldErrors={fieldErrors}
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
                pagination={pagination}
                sort={sort}
                onRefresh={() => refreshApplications(filters, pagination, sort)}
                onView={openDetail}
                onEdit={startEdit}
                onDelete={removeApplication}
                onHistory={openHistory}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                onSortChange={changeSort}
              />
            </div>
          </section>
        </section>
      </section>

      <ApplicationDetailModal
        application={detailApplication}
        onClose={closeDetail}
        onEdit={startEdit}
        onHistory={openHistory}
      />

      <StatusHistoryModal
        application={historyApplication}
        history={statusHistory}
        loading={historyLoading}
        onClose={closeHistory}
      />

      {capturePanelOpen && (
        <section className="capture-panel-overlay" onClick={closeCapturePanel}>
          <div
            className="capture-panel card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <p className="section-kicker">Capture job</p>
                <h2>Add a role from another page</h2>
                <p className="muted">
                  Start with a URL, import CSV data, or prepare for the upcoming
                  browser extension capture flow.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-soft btn-small"
                onClick={closeCapturePanel}
              >
                Close
              </button>
            </div>

            <form className="capture-manual-form" onSubmit={openManualCapture}>
              <label>
                Paste job URL manually
                <input
                  type="url"
                  value={manualCaptureURL}
                  onChange={(event) => setManualCaptureURL(event.target.value)}
                  placeholder="https://company.example/jobs/devops-engineer"
                  required
                />
              </label>

              <button type="submit" className="btn btn-primary">
                Review job
              </button>
            </form>

            <div className="capture-panel-grid">
              <article>
                <h3>Import CSV</h3>
                <p>Use the existing import/export panel for bulk application data.</p>
                <button type="button" className="btn btn-soft" onClick={scrollToCSVImport}>
                  Open CSV import
                </button>
              </article>

              <article>
                <h3>Browser extension</h3>
                <p>
                  The old browser-bookmark flow has been removed. The next capture version will
                  use a browser extension that can capture the visible job page,
                  analyze it with OCR, and send the reviewed result back to JobOps.
                </p>
                <div className="capture-extension-placeholder">
                  Extension capture coming soon
                </div>
              </article>
            </div>

            {captureError && <div className="capture-panel-error">{captureError}</div>}
          </div>
        </section>
      )}

      <CaptureReviewModal
        initialPayload={capturePayload}
        cvVersions={cvVersions}
        loading={captureLoading}
        error={captureError}
        onClose={() => setCapturePayload(null)}
        onSave={saveCapturedApplication}
      />
    </main>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}

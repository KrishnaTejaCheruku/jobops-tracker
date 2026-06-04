import React, { useEffect, useMemo, useState } from "react";

import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ApplicationDetailModal from "./components/ApplicationDetailModal";
import ApplicationForm from "./components/ApplicationForm";
import ApplicationsTable from "./components/ApplicationsTable";
import AuthGate from "./components/AuthGate";
import CSVDataPanel from "./components/CSVDataPanel";
import CVVersionsPanel from "./components/CVVersionsPanel";
import FiltersBar from "./components/FiltersBar";
import FollowUpDashboard from "./components/FollowUpDashboard";
import Notice from "./components/Notice";
import StatusHistoryModal from "./components/StatusHistoryModal";
import SummaryCard from "./components/SummaryCard";
import ThemeToggle from "./components/ThemeToggle";

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
  getApplicationsExportURL,
  getDashboardAnalytics,
  importApplicationsCSV,
  listApplications,
  listCVVersions,
  listStatusHistory,
  updateApplication,
} from "./lib/api";

import { getDateOnly, getFollowUpState } from "./lib/date";

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

function AppContent() {
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

  const isEditing = editingId !== null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("jobops-theme", theme);
  }, [theme]);

  const summary = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((app) => app.status === "Applied").length,
      interviews: applications.filter((app) =>
        ["Interview Scheduled", "Technical Interview"].includes(app.status),
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
    <main className="app-shell">
      <section className="hero hero-simple">
        <div className="hero-copy">
          <p className="eyebrow">Open-source job application tracker</p>
          <h1>JobOps Tracker</h1>
          <p className="subtitle">
            A focused workspace for applications, CV versions, recruiter notes, follow-ups,
            and pipeline status.
          </p>

          <div className="hero-meta" aria-label="JobOps workspace coverage">
            <span>Applications</span>
            <span>CV versions</span>
            <span>Follow-ups</span>
            <span>Analytics</span>
          </div>
        </div>

        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </section>

      <section className="summary-grid">
        <SummaryCard label="Visible Applications" value={summary.total} />
        <SummaryCard label="Applied" value={summary.applied} tone="blue" />
        <SummaryCard label="Interview Stage" value={summary.interviews} tone="purple" />
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

      <CSVDataPanel
        exportUrl={getApplicationsExportURL()}
        loading={csvImportLoading}
        importResult={csvImportResult}
        onImport={importCSV}
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

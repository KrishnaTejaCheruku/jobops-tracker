const apiBaseUrl = "http://localhost:8000";

const defaultAnalytics = {
  total_applications: 0,
  active_applications: 0,
  closed_applications: 0,
  interviews_total: 0,
  offers: 0,
  overdue_follow_ups: 0,
  due_today_follow_ups: 0,
  upcoming_follow_ups: 0,
  interview_rate_percent: 0,
  offer_rate_percent: 0,
  rejection_rate_percent: 0,
  high_priority: 0,
  status_counts: {},
  pipeline_breakdown: {
    active: 0,
    interviews: 0,
    offers: 0,
    closed: 0,
  },
  applications_over_time: [],
  by_status: [],
  by_source: [],
  by_priority: [],
  by_work_mode: [],
  by_cv_version: [],
};

function paginatedApplications(applications = []) {
  return {
    items: applications,
    page: 1,
    page_size: 10,
    total_items: applications.length,
    total_pages: applications.length > 0 ? 1 : 0,
    sort_by: "created_at",
    sort_order: "desc",
  };
}

Cypress.Commands.add("stubAuthSession", (user) => {
  cy.intercept("GET", `${apiBaseUrl}/auth/me`, {
    statusCode: 200,
    body: { user },
  }).as("currentUser");
});

Cypress.Commands.add("stubNoSession", () => {
  cy.intercept("GET", `${apiBaseUrl}/auth/me`, {
    statusCode: 401,
    body: { error: "authentication required" },
  }).as("currentUser");
});

Cypress.Commands.add("stubDashboardApis", ({
  applications = [],
  cvVersions = [],
  analytics = defaultAnalytics,
} = {}) => {
  cy.intercept("GET", `${apiBaseUrl}/applications*`, {
    statusCode: 200,
    body: paginatedApplications(applications),
  }).as("applications");

  cy.intercept("GET", `${apiBaseUrl}/cv-versions`, {
    statusCode: 200,
    body: cvVersions,
  }).as("cvVersions");

  cy.intercept("GET", `${apiBaseUrl}/dashboard/analytics`, {
    statusCode: 200,
    body: analytics,
  }).as("analytics");
});

export { apiBaseUrl, defaultAnalytics, paginatedApplications };

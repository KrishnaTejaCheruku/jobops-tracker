const userAApplication = {
  id: 701,
  job_title: "User A Platform Engineer",
  company_name: "Tenant A Cloud",
  source: "LinkedIn",
  job_url: "",
  location: "Berlin",
  work_mode: "Remote",
  status: "Applied",
  cv_version: "User A CV",
  cv_version_id: 11,
  salary_range: "",
  follow_up_date: "",
  recruiter_name: "",
  recruiter_email: "",
  job_description: "",
  priority: "High",
  notes: "",
  applied_date: "2026-05-30",
};

const userBApplication = {
  id: 801,
  job_title: "User B DevOps Engineer",
  company_name: "Tenant B Systems",
  source: "Referral",
  job_url: "",
  location: "Hamburg",
  work_mode: "Hybrid",
  status: "Applied",
  cv_version: "User B CV",
  cv_version_id: 21,
  salary_range: "",
  follow_up_date: "",
  recruiter_name: "",
  recruiter_email: "",
  job_description: "",
  priority: "Medium",
  notes: "",
  applied_date: "2026-05-29",
};

function analyticsFor(application) {
  return {
    total_applications: 100,
    active_applications: 100,
    closed_applications: 0,
    overdue_follow_ups: 0,
    interview_rate_percent: 0,
    offer_rate_percent: 0,
    rejection_rate_percent: 0,
    high_priority: application.priority === "High" ? 100 : 0,
    by_status: [{ name: "Applied", count: 100 }],
    by_source: [{ name: application.source, count: 100 }],
    by_priority: [{ name: application.priority, count: 100 }],
    by_work_mode: [{ name: application.work_mode, count: 100 }],
    by_cv_version: [{ name: application.cv_version, count: 100 }],
  };
}

describe("user isolation", () => {
  it("renders only the current user's applications and analytics", () => {
    cy.stubAuthSession({ id: 1, email: "user-a@example.com" });
    cy.stubDashboardApis({
      applications: [userAApplication],
      analytics: analyticsFor(userAApplication),
    });

    cy.visit("/");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.contains("user-a@example.com").should("be.visible");
    cy.contains("User A Platform Engineer").should("be.visible");
    cy.contains("Tenant A Cloud").should("be.visible");
    cy.contains("User B DevOps Engineer").should("not.exist");
    cy.contains("All tracked applications").parent().contains("100").should("be.visible");
  });

  it("renders a different isolated dataset for another user", () => {
    cy.stubAuthSession({ id: 2, email: "user-b@example.com" });
    cy.stubDashboardApis({
      applications: [userBApplication],
      analytics: analyticsFor(userBApplication),
    });

    cy.visit("/");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.contains("user-b@example.com").should("be.visible");
    cy.contains("User B DevOps Engineer").should("be.visible");
    cy.contains("Tenant B Systems").should("be.visible");
    cy.contains("User A Platform Engineer").should("not.exist");
    cy.contains("All tracked applications").parent().contains("100").should("be.visible");
  });
});

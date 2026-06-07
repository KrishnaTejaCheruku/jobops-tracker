const apiBaseUrl = "http://localhost:8000";

const testUser = {
  id: 1,
  email: "devops@example.com",
};

const applicationsResponse = {
  items: [
    {
      id: 101,
      job_title: "Platform Engineer",
      company_name: "Acme Cloud",
      source: "LinkedIn",
      job_url: "https://example.com/jobs/platform-engineer",
      location: "Berlin",
      work_mode: "Remote",
      status: "Applied",
      cv_version: "Cloud CV",
      cv_version_id: 7,
      salary_range: "EUR 80k-95k",
      follow_up_date: "2026-06-03",
      recruiter_name: "Alex Morgan",
      recruiter_email: "alex@example.com",
      job_description: "Own Kubernetes platform operations.",
      priority: "High",
      notes: "Strong fit for Kubernetes and Terraform background.",
      applied_date: "2026-05-30",
    },
  ],
  page: 1,
  page_size: 10,
  total_items: 1,
  total_pages: 1,
  sort_by: "created_at",
  sort_order: "desc",
};

const analyticsResponse = {
  total_applications: 1,
  active_applications: 1,
  closed_applications: 0,
  overdue_follow_ups: 0,
  interview_rate_percent: 0,
  offer_rate_percent: 0,
  rejection_rate_percent: 0,
  high_priority: 1,
  by_status: [{ name: "Applied", count: 1 }],
  by_source: [{ name: "LinkedIn", count: 1 }],
  by_priority: [{ name: "High", count: 1 }],
  by_work_mode: [{ name: "Remote", count: 1 }],
  by_cv_version: [{ name: "Cloud CV", count: 1 }],
};

describe("authenticated dashboard", () => {
  it("lets a user verify an OTP and see their application pipeline", () => {
    cy.intercept("GET", `${apiBaseUrl}/auth/me`, {
      statusCode: 401,
      body: { error: "authentication required" },
    }).as("currentUser");

    cy.intercept("POST", `${apiBaseUrl}/auth/request-otp`, {
      statusCode: 200,
      body: { debug_otp: "123456" },
    }).as("requestOtp");

    cy.intercept("POST", `${apiBaseUrl}/auth/verify-otp`, {
      statusCode: 200,
      body: { user: testUser },
    }).as("verifyOtp");

    cy.intercept("GET", `${apiBaseUrl}/applications*`, {
      statusCode: 200,
      body: applicationsResponse,
    }).as("applications");

    cy.intercept("GET", `${apiBaseUrl}/cv-versions`, {
      statusCode: 200,
      body: [
        {
          id: 7,
          name: "Cloud CV",
          description: "Cloud platform focused CV",
          file_path: "",
          tags: "kubernetes,terraform",
        },
      ],
    }).as("cvVersions");

    cy.intercept("GET", `${apiBaseUrl}/dashboard/analytics`, {
      statusCode: 200,
      body: analyticsResponse,
    }).as("analytics");

    cy.visit("/");
    cy.wait("@currentUser");

    cy.get("#auth-email").type("DevOps@Example.com");
    cy.contains("button", "Send verification code").click();
    cy.wait("@requestOtp")
      .its("request.body")
      .should("deep.equal", { email: "devops@example.com" });

    cy.contains("Dev OTP:").should("be.visible");
    cy.contains("strong", "123456").should("be.visible");

    cy.get("#auth-otp").type("123456");
    cy.contains("button", "Verify and continue").click();
    cy.wait("@verifyOtp")
      .its("request.body")
      .should("deep.equal", {
        email: "devops@example.com",
        otp: "123456",
      });

    cy.wait(["@applications", "@cvVersions", "@analytics"]);

    cy.contains("devops@example.com").should("be.visible");
    cy.contains("Good morning, devops").should("be.visible");
    cy.contains("Pipeline snapshot").should("be.visible");
    cy.contains("Pipeline workspace")
      .parents(".pipeline-navigation")
      .find("select")
      .select("Analytics");
    cy.contains("Dashboard Analytics").should("be.visible");
    cy.contains("Platform Engineer").should("be.visible");
    cy.contains("Acme Cloud").should("be.visible");
    cy.contains("High").should("be.visible");
    cy.contains("Showing 1 of 1 result").should("be.visible");
  });
});

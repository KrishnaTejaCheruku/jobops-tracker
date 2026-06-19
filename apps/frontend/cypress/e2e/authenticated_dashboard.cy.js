const apiBaseUrl = "http://localhost:8000";

const testUser = {
  id: 1,
  email: "devops@example.com",
};

const namedTestUser = {
  ...testUser,
  display_name: "Teja",
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

    cy.intercept("PATCH", `${apiBaseUrl}/auth/profile`, (req) => {
      expect(req.body).to.deep.equal({ display_name: "Teja" });
      req.reply({
        statusCode: 200,
        body: { user: namedTestUser },
      });
    }).as("updateProfile");

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

    cy.contains("How should I call you?").should("be.visible");
    cy.get("#auth-display-name").type("Teja");
    cy.contains("button", "Continue to JobOps").click();
    cy.wait("@updateProfile");

    cy.wait(["@applications", "@cvVersions", "@analytics"]);

    cy.contains("devops@example.com").should("be.visible");
    cy.contains("Good morning, Teja").should("be.visible");
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

  it("uses dashboard analytics totals instead of the paginated applications page", () => {
    const visibleApplications = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      job_title: `Visible Role ${index + 1}`,
      company_name: "Paged Company",
      source: "LinkedIn",
      job_url: "",
      location: "Remote",
      work_mode: "Remote",
      status: "Applied",
      cv_version: "",
      cv_version_id: 0,
      salary_range: "",
      follow_up_date: "",
      recruiter_name: "",
      recruiter_email: "",
      job_description: "",
      priority: "Medium",
      notes: "",
      applied_date: "2026-06-01",
    }));

    cy.intercept("GET", `${apiBaseUrl}/auth/me`, {
      statusCode: 200,
      body: { user: namedTestUser },
    }).as("currentUser");

    cy.intercept("GET", `${apiBaseUrl}/applications*`, {
      statusCode: 200,
      body: {
        ...applicationsResponse,
        items: visibleApplications,
        total_items: 32,
        total_pages: 4,
      },
    }).as("applications");

    cy.intercept("GET", `${apiBaseUrl}/cv-versions`, {
      statusCode: 200,
      body: [],
    }).as("cvVersions");

    cy.intercept("GET", `${apiBaseUrl}/dashboard/analytics`, {
      statusCode: 200,
      body: {
        ...analyticsResponse,
        total_applications: 32,
        active_applications: 28,
        interviews_total: 3,
        offers: 1,
        closed_applications: 4,
        overdue_follow_ups: 0,
        due_today_follow_ups: 1,
        upcoming_follow_ups: 2,
        pipeline_breakdown: {
          active: 24,
          interviews: 3,
          offers: 1,
          closed: 4,
        },
        applications_over_time: [{ name: "2026-06-01", count: 32 }],
      },
    }).as("analytics");

    cy.visit("/");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.get("#pipeline-snapshot").within(() => {
      cy.contains("ACTIVE").parent().contains("28").should("be.visible");
      cy.contains("INTERVIEWS").parent().contains("3").should("be.visible");
      cy.contains("OFFERS").parent().contains("1").should("be.visible");
    });

    cy.get("#pipeline-breakdown").within(() => {
      cy.contains("strong", "32").should("be.visible");
      cy.contains("Active pipeline").parent().contains("24").should("be.visible");
      cy.contains("Closed").parent().contains("4").should("be.visible");
    });

    cy.contains("Showing 10 of 32 results").should("be.visible");
  });
});

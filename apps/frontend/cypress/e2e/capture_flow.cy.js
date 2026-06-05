import { apiBaseUrl, defaultAnalytics, paginatedApplications } from "../support/commands";

function encodePayload(payload) {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const user = {
  id: 12,
  email: "capture@example.com",
};

const capturePayload = {
  job_title: "DevOps Engineer",
  company_name: "Example GmbH",
  source: "linkedin.com",
  job_url: "https://www.linkedin.com/jobs/view/123",
  location: "Berlin, Germany",
  work_mode: "Hybrid",
  status: "Saved",
  priority: "Medium",
  salary_range: "",
  notes: "Captured from LinkedIn job page",
};

describe("job capture flow", () => {
  it("preserves a capture payload through login and saves the reviewed job", () => {
    let applications = [];

    cy.stubNoSession();
    cy.intercept("POST", `${apiBaseUrl}/auth/request-otp`, {
      statusCode: 200,
      body: { debug_otp: "654321" },
    }).as("requestOtp");
    cy.intercept("POST", `${apiBaseUrl}/auth/verify-otp`, {
      statusCode: 200,
      body: { user },
    }).as("verifyOtp");

    cy.intercept("GET", `${apiBaseUrl}/applications*`, (req) => {
      req.reply({ statusCode: 200, body: paginatedApplications(applications) });
    }).as("applications");
    cy.intercept("GET", `${apiBaseUrl}/cv-versions`, {
      statusCode: 200,
      body: [],
    }).as("cvVersions");
    cy.intercept("GET", `${apiBaseUrl}/dashboard/analytics`, {
      statusCode: 200,
      body: defaultAnalytics,
    }).as("analytics");
    cy.intercept("POST", `${apiBaseUrl}/applications`, (req) => {
      expect(req.body).to.include({
        job_title: "DevOps Engineer",
        company_name: "Example GmbH",
        source: "LinkedIn",
        status: "Saved",
        priority: "Medium",
      });
      expect(req.body.applied_date).to.equal("");

      applications = [{ id: 777, ...req.body }];
      req.reply({ statusCode: 201, body: applications[0] });
    }).as("createApplication");

    cy.visit(`/capture?payload=${encodePayload(capturePayload)}`);
    cy.wait("@currentUser");

    cy.contains("Welcome back").should("be.visible");
    cy.get("#auth-email").type("capture@example.com");
    cy.contains("button", "Send verification code").click();
    cy.wait("@requestOtp");
    cy.get("#auth-otp").type("654321");
    cy.contains("button", "Verify and continue").click();
    cy.wait("@verifyOtp");

    cy.wait(["@applications", "@cvVersions", "@analytics"]);
    cy.contains("Review captured job").should("be.visible");
    cy.get(".capture-modal").within(() => {
      cy.get('input[name="job_title"]').should("have.value", "DevOps Engineer");
      cy.get('input[name="company_name"]').should("have.value", "Example GmbH");
      cy.contains("button", "Save captured job").click();
    });

    cy.wait("@createApplication");
    cy.wait(["@applications", "@analytics"]);
    cy.contains("Captured job saved successfully.").should("be.visible");
    cy.contains("DevOps Engineer").should("be.visible");
  });

  it("opens capture directly for an authenticated user and handles invalid payloads", () => {
    cy.stubAuthSession(user);
    cy.stubDashboardApis();

    cy.visit("/capture?payload=not-valid");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.contains("Capture payload could not be read.").should("be.visible");
    cy.contains("button", "Browser Capture").should("have.class", "btn-capture");

    cy.get(".capture-panel").within(() => {
      cy.contains("h3", "Browser capture").should("be.visible");

      cy.get("a.capture-bookmarklet-button").should("not.exist");

      cy.get("textarea.capture-bookmarklet-code")
        .should("be.visible")
        .invoke("val")
        .should("match", /^javascript:/);

      cy.contains("button.capture-bookmarklet-button", "Copy bookmarklet")
        .should("be.visible")
        .and("have.class", "btn-primary");
    });

    cy.get('input[type="url"]').type("https://company.example/jobs/platform");
    cy.contains("button", "Review job").click();
    cy.contains("Review captured job").should("be.visible");
    cy.get(".capture-modal").within(() => {
      cy.get('input[name="job_url"]').should(
        "have.value",
        "https://company.example/jobs/platform",
      );
      cy.get('select[name="source"]').should("have.value", "Company Website");
    });
  });
});

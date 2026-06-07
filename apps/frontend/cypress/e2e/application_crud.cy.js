import { apiBaseUrl, defaultAnalytics, paginatedApplications } from "../support/commands";

function buildAnalytics(applications) {
  return {
    ...defaultAnalytics,
    total_applications: applications.length,
    active_applications: applications.length,
    high_priority: applications.filter((application) => application.priority === "High").length,
    by_status: [{ name: "Applied", count: applications.length }],
    by_source: [{ name: "LinkedIn", count: applications.length }],
    by_priority: [{ name: "High", count: applications.length }],
    by_work_mode: [{ name: "Remote", count: applications.length }],
    by_cv_version: [{ name: "Cloud CV", count: applications.length }],
  };
}

describe("application management", () => {
  it("creates, lists, and deletes an application for the authenticated user", () => {
    let applications = [];

    cy.stubAuthSession({ id: 1, email: "owner@example.com" });

    cy.intercept("GET", `${apiBaseUrl}/applications*`, (req) => {
      req.reply({
        statusCode: 200,
        body: paginatedApplications(applications),
      });
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

    cy.intercept("GET", `${apiBaseUrl}/dashboard/analytics`, (req) => {
      req.reply({
        statusCode: 200,
        body: buildAnalytics(applications),
      });
    }).as("analytics");

    cy.intercept("POST", `${apiBaseUrl}/applications`, (req) => {
      expect(req.body).to.include({
        job_title: "Site Reliability Engineer",
        company_name: "Reliability Labs",
        source: "LinkedIn",
        work_mode: "Remote",
        status: "Applied",
        priority: "High",
        cv_version_id: 7,
        cv_version: "Cloud CV",
      });

      applications = [
        {
          id: 501,
          ...req.body,
          follow_up_date: req.body.follow_up_date || "",
          recruiter_name: req.body.recruiter_name || "",
          recruiter_email: req.body.recruiter_email || "",
          salary_range: req.body.salary_range || "",
          job_description: req.body.job_description || "",
          notes: req.body.notes || "",
        },
      ];

      req.reply({
        statusCode: 201,
        body: applications[0],
      });
    }).as("createApplication");

    cy.intercept("DELETE", `${apiBaseUrl}/applications/501`, (req) => {
      applications = [];
      req.reply({
        statusCode: 200,
        body: { message: "application deleted" },
      });
    }).as("deleteApplication");

    cy.visit("/");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.contains("No applications in this view").should("be.visible");

    cy.get('input[name="job_title"]').type("Site Reliability Engineer");
    cy.get('input[name="company_name"]').type("Reliability Labs");
    cy.get(".form-card").within(() => {
      cy.get('select[name="work_mode"]').select("Remote");
      cy.get('select[name="status"]').select("Applied");
      cy.get('select[name="priority"]').select("High");
      cy.get('select[name="cv_version_id"]').select("Cloud CV");
    });
    cy.get('input[name="location"]').type("Berlin");
    cy.get('input[name="salary_range"]').type("EUR 90k-110k");
    cy.contains("button", "Save Application").click();

    cy.wait("@createApplication");
    cy.wait(["@applications", "@analytics"]);

    cy.contains("Application saved successfully.").should("be.visible");
    cy.contains("Site Reliability Engineer").should("be.visible");
    cy.contains("Reliability Labs").should("be.visible");
    cy.contains("Showing 1 of 1 result").should("be.visible");
    cy.contains("Pipeline workspace").parent().find("select").select("Analytics");
    cy.contains("High Priority").parent().contains("1").should("be.visible");
    cy.contains("Total").parent().contains("1").should("be.visible");

    cy.on("window:confirm", (message) => {
      expect(message).to.equal("Delete this application?");
      return true;
    });

    cy.get(".applications-card").contains("button", "Delete").click();
    cy.wait("@deleteApplication");
    cy.wait(["@applications", "@analytics"]);

    cy.contains("Application deleted.").should("be.visible");
    cy.contains("No applications in this view").should("be.visible");
    cy.contains("Site Reliability Engineer").should("not.exist");
  });
});

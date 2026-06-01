import { apiBaseUrl } from "../support/commands";

describe("CSV import and export auth behavior", () => {
  it("keeps CSV controls behind the auth gate", () => {
    cy.stubNoSession();
    cy.visit("/");
    cy.wait("@currentUser");

    cy.contains("Passwordless login").should("be.visible");
    cy.contains("CSV Import / Export").should("not.exist");
    cy.contains("Export CSV").should("not.exist");
  });

  it("exports and imports CSV data as the authenticated user", () => {
    cy.stubAuthSession({ id: 1, email: "csv-owner@example.com" });
    cy.stubDashboardApis();

    cy.intercept("POST", `${apiBaseUrl}/applications/import.csv`, {
      statusCode: 200,
      body: {
        imported: 1,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      },
    }).as("importCsv");

    cy.visit("/");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.contains("CSV Import / Export").should("be.visible");
    cy.contains("a", "Export CSV")
      .should("have.attr", "href", `${apiBaseUrl}/applications/export.csv`);

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(
        "job_title,company_name,source,status,priority,work_mode\nPlatform Engineer,CSV Corp,LinkedIn,Applied,High,Remote\n",
      ),
      fileName: "applications.csv",
      mimeType: "text/csv",
    });

    cy.contains("button", "Import CSV").click();
    cy.wait("@importCsv");

    cy.contains("CSV import completed. Imported 1, updated 0, skipped 0.").should("be.visible");
    cy.contains("Imported 1").should("be.visible");
  });
});

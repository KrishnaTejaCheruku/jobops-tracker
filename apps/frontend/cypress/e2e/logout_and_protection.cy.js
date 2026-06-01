import { apiBaseUrl } from "../support/commands";

describe("logout and protected application shell", () => {
  it("does not load protected dashboard data without a session", () => {
    let protectedRequestCount = 0;

    cy.stubNoSession();

    cy.intercept("GET", `${apiBaseUrl}/applications*`, (req) => {
      protectedRequestCount += 1;
      req.reply({ statusCode: 401, body: { error: "authentication required" } });
    });

    cy.intercept("GET", `${apiBaseUrl}/cv-versions`, (req) => {
      protectedRequestCount += 1;
      req.reply({ statusCode: 401, body: { error: "authentication required" } });
    });

    cy.intercept("GET", `${apiBaseUrl}/dashboard/analytics`, (req) => {
      protectedRequestCount += 1;
      req.reply({ statusCode: 401, body: { error: "authentication required" } });
    });

    cy.visit("/");
    cy.wait("@currentUser");

    cy.contains("Passwordless login").should("be.visible");
    cy.contains("Dashboard Analytics").should("not.exist");
    cy.then(() => {
      expect(protectedRequestCount).to.equal(0);
    });
  });

  it("logs out and returns to the auth gate", () => {
    cy.stubAuthSession({ id: 1, email: "logout@example.com" });
    cy.stubDashboardApis();

    cy.intercept("POST", `${apiBaseUrl}/auth/logout`, {
      statusCode: 200,
      body: { message: "logged out" },
    }).as("logout");

    cy.visit("/");
    cy.wait(["@currentUser", "@applications", "@cvVersions", "@analytics"]);

    cy.contains("logout@example.com").should("be.visible");
    cy.contains("button", "Logout").click();
    cy.wait("@logout");

    cy.contains("Passwordless login").should("be.visible");
    cy.get("#auth-email").should("be.visible");
    cy.contains("logout@example.com").should("not.exist");
  });
});

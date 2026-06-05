describe("auth gate", () => {
  it("shows passwordless login before a session exists", () => {
    cy.intercept("GET", "http://localhost:8000/auth/me", {
      statusCode: 401,
      body: { error: "authentication required" },
    }).as("currentUser");

    cy.visit("/");
    cy.wait("@currentUser");

    cy.contains("Welcome back").should("be.visible");
    cy.get("#auth-email").should("be.visible");
    cy.contains("button", "Send verification code").should("be.visible");
    cy.contains("JobOps Tracker").should("be.visible");
  });
});

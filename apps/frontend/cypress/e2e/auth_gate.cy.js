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

  it("fits the login page within a mobile viewport", () => {
    cy.viewport(390, 844);
    cy.intercept("GET", "http://localhost:8000/auth/me", {
      statusCode: 401,
      body: { error: "authentication required" },
    }).as("currentUser");

    cy.visit("/");
    cy.wait("@currentUser");

    cy.document().then((doc) => {
      const root = doc.documentElement;
      const overflowing = [...doc.querySelectorAll("body *")]
        .filter((element) => element.getBoundingClientRect().right > root.clientWidth + 1)
        .slice(0, 8)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return `${element.className || element.tagName}: ${Math.round(rect.right)}`;
        });

      expect(overflowing, "elements overflowing mobile viewport").to.deep.equal([]);
      expect(root.scrollWidth, "document width").to.be.lte(root.clientWidth);
    });
  });
});

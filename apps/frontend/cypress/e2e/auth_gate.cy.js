describe("auth gate", () => {
  function visitLoggedOut() {
    cy.intercept("GET", "http://localhost:8000/auth/me", {
      statusCode: 401,
      body: { error: "authentication required" },
    }).as("currentUser");

    cy.visit("/");
    cy.wait("@currentUser");
  }

  it("shows passwordless login before a session exists", () => {
    visitLoggedOut();

    cy.contains("Welcome back").should("be.visible");
    cy.get("#auth-email").should("be.visible");
    cy.contains("button", "Send verification code").should("be.visible");
    cy.contains("JobOps Tracker").should("be.visible");
  });

  it("navigates public landing sections from the top nav", () => {
    visitLoggedOut();

    [
      ["Product", "product", "Open-source tracking"],
      ["Features", "features", "Implemented features"],
      ["Technologies", "technology", "Tools and Technologies"],
      ["Security", "security", "Security behavior"],
      ["Docs", "docs", "Repository documentation"],
    ].forEach(([label, id, heading]) => {
      cy.contains("nav[aria-label='Product sections'] a", label).click();
      cy.location("hash").should("eq", `#${id}`);
      cy.get(`#${id}`).contains(heading).should("be.visible");
      cy.get(`#${id}`).then(($section) => {
        const rect = $section[0].getBoundingClientRect();

        expect(rect.top, `${id} section top`).to.be.lessThan(Cypress.config("viewportHeight") - 120);
        expect(rect.bottom, `${id} section bottom`).to.be.greaterThan(120);
      });
    });
  });

  it("fits the login page within a mobile viewport", () => {
    cy.viewport(390, 844);
    visitLoggedOut();

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

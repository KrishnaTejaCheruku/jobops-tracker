import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  requestOTP,
  updateProfile,
  verifyOTP,
} from "../lib/authApi";
import jobopsLogo from "../assets/jobops_logo.png";
import "./AuthGate.css";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [step, setStep] = useState("email");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const authCardRef = useRef(null);
  const emailInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const displayNameInputRef = useRef(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const needsDisplayName = Boolean(user && !String(user.display_name || "").trim());

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const data = await getCurrentUser();

        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || user || !window.location.hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      let hashID = window.location.hash.slice(1);
      try {
        hashID = decodeURIComponent(hashID);
      } catch {
        hashID = "";
      }
      const target = document.getElementById(hashID);
      target?.scrollIntoView({ block: "start" });
    });
  }, [isLoading, user]);

  useEffect(() => {
    if (!needsDisplayName) {
      return;
    }

    setDisplayName("");
    window.requestAnimationFrame(() => {
      displayNameInputRef.current?.focus();
    });
  }, [needsDisplayName]);

  function focusAuthForm() {
    authCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.requestAnimationFrame(() => {
      if (step === "otp") {
        otpInputRef.current?.focus({ preventScroll: true });
        return;
      }

      emailInputRef.current?.focus({ preventScroll: true });
    });
  }

  async function handleRequestOTP(event) {
    event.preventDefault();

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");
    setDebugOtp("");

    try {
      const data = await requestOTP(normalizedEmail);

      setStep("otp");
      setMessage("Verification code sent. Check your email to continue.");

      if (data.debug_otp) {
        setDebugOtp(data.debug_otp);
      }
    } catch (err) {
      setError(err.message || "Failed to request verification code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOTP(event) {
    event.preventDefault();

    if (!otp.trim()) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const data = await verifyOTP(normalizedEmail, otp.trim());

      setUser(data.user);
      setOtp("");
      setDebugOtp("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      setError("Enter the name you want JobOps to use.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const data = await updateProfile(trimmedDisplayName);

      setUser(data.user);
      setDisplayName(data.user?.display_name || "");
    } catch (err) {
      setError(err.message || "Failed to save your profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await logoutUser();
    } finally {
      setUser(null);
      setEmail("");
      setOtp("");
      setDisplayName("");
      setDebugOtp("");
      setStep("email");
      setMessage("");
      setError("");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-compact">
          <div className="auth-spinner" />
          <p className="auth-muted">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <section className="auth-layout" aria-label="JobOps Tracker login">
          <header className="auth-topbar">
            <div className="auth-brand">
              <img className="auth-logo-image" src={jobopsLogo} alt="JobOps" />
              <span>JobOps Tracker</span>
            </div>

            <nav className="auth-nav" aria-label="Product sections">
              <a href="#product">Product</a>
              <a href="#features">Features</a>
              <a href="#technology">Technologies</a>
              <a href="#security">Security</a>
              <a href="#docs">Docs</a>
            </nav>

            <div className="auth-top-actions">
              <button type="button" onClick={focusAuthForm}>Sign in</button>
              <button type="button" className="auth-continue-button" onClick={focusAuthForm}>
                Continue
              </button>
            </div>
          </header>

          <div className="auth-hero">
            <div className="auth-product">
              <div className="auth-product-copy">
                <p className="auth-kicker">Private workspace</p>
                <h2>Clarity for every step forward.</h2>
                <p>
                  Track applications, follow-ups, and outcomes in one private,
                  thoughtfully designed workspace.
                </p>
              </div>

              <div className="auth-workflow" aria-label="JobOps workflow">
                <div className="auth-workflow-item">
                  <span aria-hidden="true">01</span>
                  <div>
                    <strong>Private by design</strong>
                    <p>Your data stays yours. Always.</p>
                  </div>
                </div>

                <div className="auth-workflow-item">
                  <span aria-hidden="true">02</span>
                  <div>
                    <strong>See what matters</strong>
                    <p>A clean view of progress and next steps.</p>
                  </div>
                </div>

                <div className="auth-workflow-item">
                  <span aria-hidden="true">03</span>
                  <div>
                    <strong>Built for momentum</strong>
                    <p>Small actions today. Better outcomes tomorrow.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-card" ref={authCardRef} tabIndex="-1">
              <div className="auth-copy">
                <div className="auth-tabs" aria-hidden="true">
                  <span className={step === "email" ? "active" : ""}>Email sign in</span>
                  <span className={step === "otp" ? "active" : ""}>Verify code</span>
                </div>
                <p className="auth-kicker">Secure sign in</p>
                <h2>{step === "email" ? "Welcome back" : "Check your email"}</h2>
                <p>
                  {step === "email"
                    ? "Enter your email and we will send a one-time code to sign in."
                    : `We sent a verification code to ${normalizedEmail}.`}
                </p>
              </div>

              {step === "email" ? (
                <form className="auth-form" onSubmit={handleRequestOTP}>
                  <label htmlFor="auth-email">Email address</label>
                  <input
                    ref={emailInputRef}
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                  />

                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send verification code"}
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleVerifyOTP}>
                  <div className="auth-form-header">
                    <div>
                      <label htmlFor="auth-otp">Verification code</label>
                      <p>{normalizedEmail}</p>
                    </div>

                    <button
                      type="button"
                      className="auth-link-button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                        setMessage("");
                        setDebugOtp("");
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <input
                    ref={otpInputRef}
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={otp}
                    autoComplete="one-time-code"
                    maxLength={6}
                    onChange={(event) => setOtp(event.target.value)}
                  />

                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify and continue"}
                  </button>

                  <button
                    type="button"
                    className="auth-secondary-button"
                    disabled={isSubmitting}
                    onClick={handleRequestOTP}
                  >
                    Resend code
                  </button>
                </form>
              )}

              {message && <div className="auth-message">{message}</div>}
              {error && <div className="auth-error">{error}</div>}

              {debugOtp && (
                <div className="auth-debug">
                  <span>Dev OTP:</span>
                  <strong>{debugOtp}</strong>
                </div>
              )}

              <div className="auth-footer">
                <span>Private by default.</span>
                <span>Session cookie protected.</span>
              </div>
            </div>
          </div>

          <section className="auth-section auth-product-section" id="product" tabIndex="-1">
            <div className="auth-section-copy">
              <p className="auth-kicker">Product</p>
              <h2>Open-source tracking for a real job search pipeline.</h2>
              <p>
                JobOps Tracker is a private, open-source workspace for organizing
                job applications, CV versions, follow-ups, interview progress, and
                outcomes without relying on spreadsheets.
              </p>
            </div>

            <div className="auth-pillar-grid">
              <article>
                <strong>Application pipeline</strong>
                <p>Create, update, filter, sort, paginate, and review applications with status history.</p>
              </article>
              <article>
                <strong>CV version management</strong>
                <p>Track reusable CV versions and associate them with saved applications.</p>
              </article>
              <article>
                <strong>Follow-up workflow</strong>
                <p>Record follow-up dates and surface overdue, due-today, and upcoming actions.</p>
              </article>
              <article>
                <strong>Capture and review</strong>
                <p>Use CSV import, manual URL capture, or the browser extension with OCR-assisted extraction before saving.</p>
              </article>
            </div>
          </section>

          <section className="auth-section" id="features" tabIndex="-1">
            <div className="auth-section-copy">
              <p className="auth-kicker">Features</p>
              <h2>Implemented features from the current repository.</h2>
              <p>
                The public landing page lists only behavior backed by the current
                frontend, backend, extension, OCR service, and tests.
              </p>
            </div>

            <div className="auth-feature-grid">
              {[
                "Passwordless OTP authentication",
                "User-scoped application and CV records",
                "Application CRUD with validation",
                "Search, filters, sorting, and pagination",
                "Status history and follow-up tracking",
                "Dashboard analytics and responsive pipeline views",
                "CSV import/export with duplicate handling",
                "Dark/light mode",
                "Browser extension capture",
                "OCR-assisted extraction with review before save",
              ].map((feature) => (
                <article key={feature}>
                  <span aria-hidden="true">OK</span>
                  <strong>{feature}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="auth-section" id="technology" tabIndex="-1">
            <div className="auth-section-copy">
              <p className="auth-kicker">Technologies</p>
              <h2>Tools and Technologies Used to Build JobOps.</h2>
              <p>
                The stack combines a focused React frontend, Go API, PostgreSQL
                data layer, OCR service, browser extension, and automated tests.
              </p>
            </div>

            <div className="auth-technology-grid">
              <article>
                <h3>Frontend</h3>
                <p>React, Vite, responsive CSS, and Cypress coverage for user flows.</p>
              </article>
              <article>
                <h3>Backend</h3>
                <p>Go, Gin, PostgreSQL migrations, session handling, and API validation.</p>
              </article>
              <article>
                <h3>Capture</h3>
                <p>Manifest V3 browser extension plus a Python OCR extraction service.</p>
              </article>
              <article>
                <h3>Quality</h3>
                <p>Unit tests, integration checks, extension validation, and CI workflows.</p>
              </article>
            </div>
          </section>

          <section className="auth-section auth-security-section" id="security" tabIndex="-1">
            <div className="auth-section-copy">
              <p className="auth-kicker">Security</p>
              <h2>Security behavior is visible in code and documentation.</h2>
              <p>
                JobOps is open source. Security-sensitive behavior is documented
                and reviewable in the repository.
              </p>
            </div>

            <div className="auth-security-list">
              <article>
                <strong>Authentication and sessions</strong>
                <p>Passwordless OTP login, request throttling, hashed session tokens, HttpOnly cookies, and secure-cookie support for HTTPS production.</p>
              </article>
              <article>
                <strong>User-owned data</strong>
                <p>Protected application, CV, dashboard, and CSV endpoints use the authenticated user ID for repository queries.</p>
              </article>
              <article>
                <strong>Capture safeguards</strong>
                <p>The analyze endpoint is size-limited JSON, OCR extraction does not automatically write to the database, and users review captured fields before saving.</p>
              </article>
              <article>
                <strong>Repository checks</strong>
                <p>CI runs backend tests, frontend build and Cypress checks, extension validation, and focused regression coverage for security-sensitive parsing paths.</p>
              </article>
            </div>
          </section>

          <section className="auth-section" id="docs" tabIndex="-1">
            <div className="auth-section-copy">
              <p className="auth-kicker">Docs</p>
              <h2>Repository documentation for users and developers.</h2>
              <p>
                Start with the documentation index or go directly to the guide
                that matches the work in front of you.
              </p>
            </div>

            <div className="auth-doc-grid">
              <article>
                <h3>User guides</h3>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/product-guide.md">Product guide</a>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/browser-extension.md">Browser extension</a>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/csv-import-export.md">CSV import/export</a>
              </article>
              <article>
                <h3>Developer guides</h3>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/local-development.md">Local development</a>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/api.md">API reference</a>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/testing.md">Testing</a>
              </article>
              <article>
                <h3>Security</h3>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/docs/security.md">Security guide</a>
                <a href="https://github.com/KrishnaTejaCheruku/jobops-tracker/blob/main/SECURITY.md">Responsible disclosure</a>
              </article>
            </div>
          </section>
        </section>
      </div>
    );
  }

  if (needsDisplayName) {
    return (
      <div className="auth-page auth-profile-page">
        <div className="auth-card auth-card-compact auth-profile-card">
          <div className="auth-copy">
            <p className="auth-kicker">One last step</p>
            <h2>How should I call you?</h2>
            <p>JobOps will use this name in your private workspace.</p>
          </div>

          <p className="auth-profile-email">{user.email}</p>

          <form className="auth-form" onSubmit={handleUpdateProfile}>
            <label htmlFor="auth-display-name">Preferred name</label>
            <input
              ref={displayNameInputRef}
              id="auth-display-name"
              type="text"
              placeholder="Your name"
              value={displayName}
              autoComplete="given-name"
              maxLength={80}
              onChange={(event) => setDisplayName(event.target.value)}
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Continue to JobOps"}
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              disabled={isSubmitting}
              onClick={handleLogout}
            >
              Use another email
            </button>
          </form>

          {error && <div className="auth-error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      {isValidElement(children)
        ? cloneElement(children, {
            user,
            onLogout: handleLogout,
            isLoggingOut: isSubmitting,
          })
        : children}
    </div>
  );
}

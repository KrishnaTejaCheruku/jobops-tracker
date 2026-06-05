import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  requestOTP,
  verifyOTP,
} from "../lib/authApi";
import jobopsLogo from "../assets/jobops_logo.png";
import "./AuthGate.css";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [step, setStep] = useState("email");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

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

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await logoutUser();
    } finally {
      setUser(null);
      setEmail("");
      setOtp("");
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
              <button type="button">Product</button>
              <button type="button">Features</button>
              <button type="button">Security</button>
              <button type="button">Docs</button>
            </nav>

            <div className="auth-top-actions">
              <button type="button">Sign in</button>
              <button type="button" className="auth-continue-button">
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

            <div className="auth-card">
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

          <div className="auth-dashboard-preview" aria-hidden="true">
            <aside className="auth-preview-sidebar">
              <div className="auth-preview-brand">
                <img src={jobopsLogo} alt="" />
                <span>JobOps Tracker</span>
              </div>
              <span className="active">Overview</span>
              <span>Applications</span>
              <span>Follow-ups</span>
              <span>CV Versions</span>
              <span>Analytics</span>
            </aside>

            <div className="auth-preview-main">
              <div className="auth-preview-header">
                <div>
                  <h3>Good morning, Kris</h3>
                  <p>Here is what is happening with your job search.</p>
                </div>
                <button type="button">New application</button>
              </div>

              <div className="auth-preview-metrics">
                <article><span>Applications</span><strong>36</strong></article>
                <article><span>Interviews</span><strong>8</strong></article>
                <article><span>Follow-ups</span><strong>14</strong></article>
                <article><span>Response rate</span><strong>28%</strong></article>
              </div>

              <div className="auth-preview-lists">
                <div>
                  <h4>Recent applications</h4>
                  <p>Senior Product Manager <span>Interview</span></p>
                  <p>Product Operations Lead <span>Follow-up</span></p>
                  <p>Growth Manager <span>Applied</span></p>
                </div>
                <div>
                  <h4>Follow-up due</h4>
                  <p>Technical interview follow-up <span>Today</span></p>
                  <p>Recruiter check-in <span>Tomorrow</span></p>
                  <p>Case study submission <span>May 19</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-user-bar">
        <div className="auth-user-chip">
          <span className="auth-user-avatar">
            {user.email?.charAt(0)?.toUpperCase() || "U"}
          </span>
          <span>{user.email}</span>
        </div>

        <button
          type="button"
          className="auth-logout-button"
          disabled={isSubmitting}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {children}
    </div>
  );
}

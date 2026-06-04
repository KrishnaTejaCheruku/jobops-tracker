import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  requestOTP,
  verifyOTP,
} from "../lib/authApi";
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
          <div className="auth-product">
            <div className="auth-brand">
              <div className="auth-logo">JO</div>
              <div>
                <h1>JobOps Tracker</h1>
                <p>Track applications without spreadsheet chaos.</p>
              </div>
            </div>

            <div className="auth-product-copy">
              <p className="auth-kicker">Private career pipeline</p>
              <h2>One place for roles, CV versions, recruiters, and follow-ups.</h2>
              <p>
                Keep your job search operational: know what moved, what needs a follow-up,
                and which CV version went to each company.
              </p>
            </div>

            <div className="auth-preview" aria-hidden="true">
              <div className="auth-preview-header">
                <span>Pipeline snapshot</span>
                <strong>Today</strong>
              </div>

              <div className="auth-preview-grid">
                <div>
                  <span>Active</span>
                  <strong>12</strong>
                </div>
                <div>
                  <span>Interviews</span>
                  <strong>3</strong>
                </div>
                <div>
                  <span>Follow-ups</span>
                  <strong>4</strong>
                </div>
              </div>

              <div className="auth-preview-list">
                <div>
                  <span className="auth-dot auth-dot-blue" />
                  <p>Technical interview</p>
                  <strong>Wed</strong>
                </div>
                <div>
                  <span className="auth-dot auth-dot-green" />
                  <p>Recruiter reply due</p>
                  <strong>Today</strong>
                </div>
                <div>
                  <span className="auth-dot auth-dot-amber" />
                  <p>CV v4 sent</p>
                  <strong>Saved</strong>
                </div>
              </div>
            </div>

            <div className="auth-trust-row">
              <span>OTP secured</span>
              <span>User-scoped data</span>
              <span>HTTPS ready</span>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-copy">
              <p className="auth-kicker">Secure sign in</p>
              <h2>Passwordless login</h2>
              <p>
                Enter your email and verify with a one-time code to access your
                private application tracker.
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

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeStyles } from "../components/ThemeStyles";
import { useAuth } from "../context/authContextShared";
import { ensureUserUsageRecord } from "../lib/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await register(email, password);
      const newUser = response?.user;

      if (!newUser) {
        throw new Error("User registration failed.");
      }

      if (!response.session) {
        setStatus(
          "Account created. Please confirm your email before logging in."
        );
        return;
      }

      try {
        await ensureUserUsageRecord(newUser.id);
      } catch (usageError) {
        console.error("Error creating usage row:", usageError);
      }

      navigate("/", { replace: true });

    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ThemeStyles />

      <div className="auth-shell">
        <div className="auth-wrap">

          <Link to="/" className="logo-link">
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="logo-text">Prompt2Craft</span>
          </Link>

          <div className="auth-card-wrap">
            <div className="auth-card">

              <span className="section-label">Get started</span>

              <h1 className="auth-heading">
                Create your account
              </h1>

              {status && (
                <div className="status-banner">{status}</div>
              )}

              {error && (
                <div className="status-banner error-banner">{error}</div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>

                <label className="field-label">
                  Email
                  <input
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="field-label">
                  Password
                  <input
                    className="field-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>

                <label className="field-label">
                  Confirm password
                  <input
                    className="field-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

              </form>

              <div className="helper-row">
                <span>Already have an account?</span>
                <Link className="helper-link" to="/login">
                  Login
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}

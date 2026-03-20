import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeStyles } from "../components/ThemeStyles";
import { useAuth } from "../context/authContextShared";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const statusMessage = location.state?.message ?? "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (authError) {
      setError(authError.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ThemeStyles />
      <div className="auth-shell">
        <div className="auth-wrap">
          <div className="auth-nav-row">
            <Link to="/" className="logo-link" aria-label="Prompt2Craft home">
              <div className="logo-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="logo-text">Prompt2Craft</span>
            </Link>

            <button className="secondary-button auth-nav-button" type="button" onClick={() => navigate("/register")}>Create account</button>
          </div>

          <div className="auth-card-wrap">
            <div className="auth-card">
              <span className="section-label">Welcome back</span>
              <h1 className="auth-heading">Login to continue</h1>
              <p className="auth-copy">
                Access your Prompt2Craft workspace and continue generating presentation decks.
              </p>

              {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}
              {error ? <div className="status-banner error-banner">{error}</div> : null}

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="field-label" htmlFor="login-email">
                  Email
                  <input
                    id="login-email"
                    className="field-input"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="field-label" htmlFor="login-password">
                  Password
                  <input
                    id="login-password"
                    className="field-input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="helper-row">
                <span>Need an account?</span>
                <Link className="helper-link" to="/register">
                  Create one
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeStyles } from "../components/ThemeStyles";
import { useAuth } from "../context/AuthContext";

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

      if (response.user && !response.session) {
        setStatus("Account created. Check your email to confirm your account, then login.");
        return;
      }

      navigate("/", { replace: true });
    } catch (authError) {
      setError(authError.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ThemeStyles />
      <div className="auth-shell">
        <div className="auth-wrap">
          <Link to="/" className="logo-link" aria-label="Prompt2Craft home">
            <div className="logo-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="logo-text">Prompt2Craft</span>
          </Link>

          <div className="auth-card-wrap">
            <div className="auth-card">
              <span className="section-label">Get started</span>
              <h1 className="auth-heading">Create your account</h1>
              <p className="auth-copy">
                Register once, then use your free generations before paying Rs 19 for additional decks.
              </p>

              {status ? <div className="status-banner">{status}</div> : null}
              {error ? <div className="status-banner error-banner">{error}</div> : null}

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="field-label" htmlFor="register-email">
                  Email
                  <input
                    id="register-email"
                    className="field-input"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="field-label" htmlFor="register-password">
                  Password
                  <input
                    id="register-password"
                    className="field-input"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <label className="field-label" htmlFor="register-confirm-password">
                  Confirm password
                  <input
                    id="register-confirm-password"
                    className="field-input"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </label>

                <button className="primary-button" type="submit" disabled={loading}>
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

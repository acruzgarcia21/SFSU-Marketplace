import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sfsu_email: email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const storage = keepSignedIn ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--narrow">
        <Link to="/" className="auth-logo-link">
          <h1 className="auth-logo-text">Switch-It-Up</h1>
        </Link>

        <p className="auth-subtitle">Sign into your Switch-It-Up account</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-input-container">
            <input
              className="auth-input"
              type="email"
              placeholder="SFSU Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-container">
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-checkbox-row">
            <input
              type="checkbox"
              id="keepSignedIn"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            <label htmlFor="keepSignedIn">Keep me signed in</label>
          </div>

          <button type="submit" className="auth-button">
            Sign In
          </button>
        </form>

        <p className="auth-footer-text">
          Not registered?{" "}
          <Link to="/register" className="auth-link">
            Click here
          </Link>{" "}
          to create your Switch-It-Up account
        </p>
      </div>
    </div>
  );
}

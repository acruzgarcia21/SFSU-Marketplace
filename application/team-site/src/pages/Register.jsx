import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [focus, setFocus] = useState(null);
  const [error, setError] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submit, setSubmit] = useState(false);

  const passwordLength = form.password.length >= 8;
  const passwordUppercase = /[A-Z]/.test(form.password);
  const passwordLowercase = /[a-z]/.test(form.password);
  const passwordNumber = /[0-9]/.test(form.password);

  const passwordReq = (
    <div className="password-req-list">
      <div className={`password-req ${passwordLength ? "true" : "false"}`}>
        {passwordLength ? "✓" : "✗"} At least 8 characters
      </div>
      <div className={`password-req ${passwordUppercase ? "true" : "false"}`}>
        {passwordUppercase ? "✓" : "✗"} 1 uppercase letter
      </div>
      <div className={`password-req ${passwordLowercase ? "true" : "false"}`}>
        {passwordLowercase ? "✓" : "✗"} 1 lowercase letter
      </div>
      <div className={`password-req ${passwordNumber ? "true" : "false"}`}>
        {passwordNumber ? "✓" : "✗"} 1 number
      </div>
    </div>
  );

  const validate = (name, value) => {
    switch (name) {
      case "firstName":
        return !value.trim() ? "First name cannot be empty." : "";
      case "lastName":
        return !value.trim() ? "Last name cannot be empty." : "";
      case "email":
        if (!value.trim()) return "Email cannot be empty.";
        if (!value.endsWith("@sfsu.edu")) return "Email must be a SFSU email.";
        return "";
      case "password":
        if (!value) return "Password cannot be empty.";
        if (value.length < 8 || !/[A-Z]/.test(value) || !/[a-z]/.test(value)) {
          return "Password must meet requirements.";
        }
        return "";
      case "confirmPassword":
        if (!value) return "Confirm password cannot be empty.";
        if (value !== form.password) return "Passwords do not match.";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const handleFocus = (name) => {
    setFocus(name);
    setError((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const handleBlur = (name) => {
    setFocus(null);

    setError((prev) => {
      const validationError = validate(name, form[name]);
      return validationError ? { ...prev, [name]: validationError } : prev;
    });
  };

  const handleRedirect = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newError = {};

    Object.keys(form).forEach((key) => {
      const validationError = validate(key, form[key]);

      if (validationError) {
        newError[key] = validationError;
      }
    });

    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: `${form.firstName} ${form.lastName}`,
          sfsu_email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSubmit(true);
      setError({});

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError({ form: err.message });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo-link">
          <h1 className="auth-logo-text">Switch-It-Up</h1>
        </Link>

        <p className="auth-subtitle">Create your Switch-It-Up account</p>

        {submit && (
          <div className="auth-success-message">
            Account created successfully!
            <br />
            Redirecting to sign in...
            <br />
            If you do not wish to wait,{" "}
            <span className="auth-link" onClick={handleRedirect}>
              click here
            </span>
            .
          </div>
        )}

        {error.form && <p className="auth-error">{error.form}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-row">
            <div className="auth-input-container">
              <input
                type="text"
                className={`auth-input ${error.firstName ? "input-error" : ""}`}
                name="firstName"
                placeholder="First Name *"
                value={form.firstName}
                onChange={handleChange}
                onFocus={() => handleFocus("firstName")}
                onBlur={() => handleBlur("firstName")}
              />
              {error.firstName && (
                <p className="auth-error">{error.firstName}</p>
              )}
            </div>

            <div className="auth-input-container">
              <input
                type="text"
                className={`auth-input ${error.lastName ? "input-error" : ""}`}
                name="lastName"
                placeholder="Last Name *"
                value={form.lastName}
                onChange={handleChange}
                onFocus={() => handleFocus("lastName")}
                onBlur={() => handleBlur("lastName")}
              />
              {error.lastName && <p className="auth-error">{error.lastName}</p>}
            </div>
          </div>

          <div className="auth-input-container">
            <input
              type="email"
              className={`auth-input ${error.email ? "input-error" : ""}`}
              name="email"
              placeholder="SFSU Email *"
              value={form.email}
              onChange={handleChange}
              onFocus={() => handleFocus("email")}
              onBlur={() => handleBlur("email")}
            />
            {error.email ? (
              <p className="auth-error">{error.email}</p>
            ) : (
              focus === "email" && (
                <p className="auth-note">Only SFSU emails allowed.</p>
              )
            )}
          </div>

          <div className="auth-input-container">
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={`auth-input ${error.password ? "input-error" : ""}`}
                name="password"
                placeholder="Password *"
                value={form.password}
                onChange={handleChange}
                onFocus={() => handleFocus("password")}
                onBlur={() => handleBlur("password")}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error.password ? (
              <div className="auth-error">
                Password must meet requirements:
                {passwordReq}
              </div>
            ) : (
              focus === "password" && (
                <div className="auth-note">
                  Password requirements:
                  {passwordReq}
                </div>
              )
            )}
          </div>

          <div className="auth-input-container">
            <div className="auth-password-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                className={`auth-input ${
                  error.confirmPassword ? "input-error" : ""
                }`}
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={form.confirmPassword}
                onChange={handleChange}
                onFocus={() => handleFocus("confirmPassword")}
                onBlur={() => handleBlur("confirmPassword")}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>

            {error.confirmPassword && (
              <p className="auth-error">{error.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className="auth-button">
            Register
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Click here
          </Link>{" "}
          to sign in.
        </p>
      </div>
    </div>
  );
}
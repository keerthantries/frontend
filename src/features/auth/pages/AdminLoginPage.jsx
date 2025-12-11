import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginAdmin } from "../api/authApi";

import hero from "../../../assets/images/hero.png"; // NEW VECTOR GIRL IMAGE
import logo from "../../../assets/logo.png";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Moon,
  SunMedium,
} from "lucide-react";

import "./login.css";

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [orgSlug, setOrgSlug] = useState("vidhyapat-dev");
  const [email, setEmail] = useState("admin@vidhyapat.dev");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("vp_theme_mode") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-bs-theme",
      isDark ? "dark" : "light"
    );
  }, [isDark]);

  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("vp_theme_mode", next ? "dark" : "light");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginAdmin({ orgSlug, email, password });

      if (!result?.success) throw new Error(result?.message);

      const { user, org, token } = result.data;

      localStorage.setItem("vp_token", token);
      localStorage.setItem("vp_user", JSON.stringify(user));
      localStorage.setItem("vp_org", JSON.stringify(org));

      if (org?.branding?.logoUrl) {
        localStorage.setItem("vp_logo_url", org.branding.logoUrl);
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ERROR POPUP */}
      {error && (
        <div className="login-toast">
          <div className="login-toast-inner">{error}</div>
        </div>
      )}

      <div className="login-wrapper">
        {/* LEFT PANEL */}
        <div className="login-left">
          <div className="left-content">

            <div className="left-logo-wrap">
              <img src={logo} alt="logo" className="left-logo" />
            </div>

            <h1 className="left-heading">
              Manage your learning ecosystem in one place.
            </h1>

            <p className="left-desc">
              Create and manage courses, enrolments and instructors with a modern intuitive admin portal.
            </p>

            <div className="left-pills">
              <span className="pill">Multi-tenant architecture</span>
              <span className="pill">Role-based access</span>
              <span className="pill">Analytics & billing</span>
            </div>

            {/* ILLUSTRATION AREA */}
            <div className="hero-img-wrap">
              <img src={hero} className="hero-img" alt="LMS Illustration" />
            </div>

            <p className="left-footer">
              © {new Date().getFullYear()} Vidhyapat LMS · Powered by VSAAS Technologies
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">
          <button className="theme-btn" onClick={handleThemeToggle}>
            {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light mode" : "Dark mode"}</span>
          </button>

          <div className="right-card">
            <h3 className="rc-title">Welcome back, Admin</h3>
            <p className="rc-sub">Sign in to manage organizations, users and courses.</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Organization slug</label>
                <input
                  className="form-control form-control-lg"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Admin email</label>
                <input
                  className="form-control form-control-lg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="password-wrap">
                  <input
                    className="form-control form-control-lg"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in to Admin"}
                {!loading && <ArrowRight className="ms-2" size={18} />}
              </button>

              <p className="slug-text">
                You are logging into <strong>{orgSlug}</strong> environment.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLoginPage;

// src/components/layout/Header.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Moon,
  SunMedium,
  LogOut,
  MessageCircle,
  Globe2,
  User,
  Settings as SettingsIcon,
} from "lucide-react";
import { applyTheme } from "../utils/theme";

const Header = ({ onToggleMenu }) => {
  const navigate = useNavigate();

  const [logoLight, setLogoLight] = useState(null);
  const [logoDark, setLogoDark] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(null);

  const [isDark, setIsDark] = useState(() => {
    try {
      const mode = localStorage.getItem("vp_theme_mode");
      return mode === "dark";
    } catch {
      return false;
    }
  });

  // Load logo URLs from localStorage (set at login) and theme
  useEffect(() => {
    const light =
      localStorage.getItem("vp_logo_url") || "/assets/images/logo-light.png";

    const dark =
      localStorage.getItem("vp_logo_url_dark") ||
      localStorage.getItem("vp_logo_url") ||
      "/assets/images/logo-dark.png";

    setLogoLight(light);
    setLogoDark(dark);

    const isDarkMode =
      document.documentElement.getAttribute("data-bs-theme") === "dark";

    setCurrentSrc(isDarkMode ? dark : light);
  }, []);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDarkMode =
        document.documentElement.getAttribute("data-bs-theme") === "dark";
      setCurrentSrc(isDarkMode ? logoDark || logoLight : logoLight || logoDark);
      setIsDark(isDarkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });

    return () => observer.disconnect();
  }, [logoLight, logoDark]);

  // Handle broken logo src
  const handleLogoError = () => {
    const fallback =
      currentSrc === logoLight
        ? logoDark || "/assets/images/logo-dark.png"
        : logoLight || "/assets/images/logo-light.png";
    setCurrentSrc(fallback);
  };

  // Read user info from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("vp_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userName = user?.name || "Admin User";
  const userEmail = user?.email || "admin@vidhyapat.dev";

  // Theme toggle (dark / light)
  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme({ mode: next ? "dark" : "light" });
  };

  // Sign out logic
  const handleSignOut = () => {
    try {
      localStorage.removeItem("vp_token");
      localStorage.removeItem("vp_user");
      localStorage.removeItem("vp_org");
    } catch {
      // ignore
    }
    navigate("/login/admin", { replace: true });
  };

  return (
    <div className="nk-header nk-header-fixed">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          {/* Mobile sidebar toggle */}
          <div className="nk-menu-trigger d-xl-none ms-n1">
            <button
              type="button"
              className="nk-nav-toggle nk-quick-nav-icon btn btn-link p-0 border-0"
              onClick={onToggleMenu}
              aria-label="Toggle navigation menu"
            >
              <Menu className="vp-icon" />
            </button>
          </div>

          {/* Brand on small screens */}
          <div className="nk-header-brand d-xl-none">
            <NavLink to="/admin/dashboard" className="logo-link">
              {currentSrc && (
                <img
                  src={currentSrc}
                  alt="Organization Logo"
                  className="logo-img"
                  onError={handleLogoError}
                />
              )}
            </NavLink>
          </div>

          {/* Search */}
          <div className="nk-header-search ms-3 ms-xl-0">
            <span className="me-2 d-flex align-items-center">
              <Search className="vp-icon" />
            </span>
            <input
              type="text"
              className="form-control border-transparent form-focus-none vp-search-input"
              placeholder="Search anything"
            />
          </div>

          {/* Right side tools */}
          <div className="nk-header-tools">
            <ul className="nk-quick-nav align-items-center">

              {/* Theme toggle button */}
              <li className="me-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light d-flex align-items-center vp-theme-toggle"
                  onClick={handleThemeToggle}
                  aria-label="Toggle dark mode"
                >
                  {isDark ? (
                    <SunMedium className="me-1 vp-icon" />
                  ) : (
                    <Moon className="me-1 vp-icon" />
                  )}
                  <span className="d-none d-sm-inline">
                    {isDark ? "Light" : "Dark"}
                  </span>
                </button>
              </li>

              {/* Language (static demo) */}
              <li className="dropdown language-dropdown d-none d-sm-block me-n1">
                <a
                  href="#"
                  className="dropdown-toggle nk-quick-nav-icon vp-quick-icon-btn"
                  data-bs-toggle="dropdown"
                >
                  <div className="quick-icon border border-light-subtle">
                    <Globe2 className="vp-icon" />
                  </div>
                </a>
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-s1">
                  <ul className="language-list">
                    <li>
                      <button className="language-item" type="button">
                        <span className="language-name">English</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </li>

              {/* Chats dropdown (static) */}
              <li className="dropdown chats-dropdown hide-mb-xs">
                <a
                  href="#"
                  className="dropdown-toggle nk-quick-nav-icon vp-quick-icon-btn"
                  data-bs-toggle="dropdown"
                >
                  <div className="icon-status icon-status-na">
                    <MessageCircle className="vp-icon" />
                  </div>
                </a>
                <div className="dropdown-menu dropdown-menu-xl dropdown-menu-end">
                  <div className="dropdown-head d-flex justify-content-between align-items-center">
                    <span className="sub-title nk-dropdown-title">
                      Recent Chats
                    </span>
                    <a href="#" className="link-sm">
                      Settings
                    </a>
                  </div>
                  <div className="dropdown-body">
                    <div className="text-muted small px-3 py-2">
                      No recent chats. (Demo content)
                    </div>
                  </div>
                </div>
              </li>

              {/* Notifications dropdown (static) */}
              <li className="dropdown notification-dropdown">
                <a
                  href="#"
                  className="dropdown-toggle nk-quick-nav-icon vp-quick-icon-btn"
                  data-bs-toggle="dropdown"
                >
                  <div className="icon-status icon-status-info">
                    <Bell className="vp-icon" />
                  </div>
                </a>
                <div className="dropdown-menu dropdown-menu-xl dropdown-menu-end">
                  <div className="dropdown-head d-flex justify-content-between align-items-center">
                    <span className="sub-title nk-dropdown-title">
                      Notifications
                    </span>
                    <a href="#" className="link-sm">
                      Mark all as read
                    </a>
                  </div>
                  <div className="dropdown-body">
                    <div className="nk-notification">
                      <div className="nk-notification-item dropdown-inner">
                        <div className="nk-notification-icon">
                          <span className="icon icon-circle bg-warning-dim d-flex align-items-center justify-content-center">
                            <Bell className="vp-icon" />
                          </span>
                        </div>
                        <div className="nk-notification-content">
                          <div className="nk-notification-text">
                            This is a sample notification.
                          </div>
                          <div className="nk-notification-time">Just now</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* User Dropdown */}
              <li className="dropdown user-dropdown">
                <a
                  href="#"
                  className="dropdown-toggle me-n1"
                  data-bs-toggle="dropdown"
                >
                  <div className="user-toggle d-flex align-items-center">
                    <div className="user-avatar bg-pink-dim">
                      <span>{userName?.charAt(0) || "A"}</span>
                    </div>
                    <div className="user-info d-none d-xl-block ms-2">
                      <div className="user-status user-status-active">
                        Admin
                      </div>
                      <div className="user-name d-flex align-items-center gap-1">
                        {userName}
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                </a>

                <div className="dropdown-menu dropdown-menu-md dropdown-menu-end">
                  <div className="dropdown-inner user-card-wrap bg-lighter d-none d-md-block">
                    <div className="user-card">
                      <div className="user-avatar bg-pink-dim">
                        <span>{userName?.charAt(0) || "A"}</span>
                      </div>
                      <div className="user-info">
                        <span className="lead-text">{userName}</span>
                        <span className="sub-text">{userEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-inner">
                    <ul className="link-list">
                      <li>
                        <NavLink to="/admin/profile" className="d-flex align-items-center gap-2">
                          <User className="vp-icon" />
                          <span>View Profile</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/settings/general"
                          className="d-flex align-items-center gap-2"
                        >
                          <SettingsIcon className="vp-icon" />
                          <span>Account Settings</span>
                        </NavLink>
                      </li>
                    </ul>
                  </div>

                  <div className="dropdown-inner">
                    <ul className="link-list">
                      <li>
                        <button
                          type="button"
                          className="btn btn-link text-start w-100 px-0 d-flex align-items-center gap-2"
                          onClick={handleSignOut}
                        >
                          <LogOut className="vp-icon" />
                          <span>Sign out</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>

            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

// src/components/layout/Sidebar.jsx
import React, { useState, useCallback, useEffect } from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  Network,
  Users,
  UserSquare2,
  GraduationCap,
  UserRound,
  BookOpenText,
  Layers3,
  Tags,
  ClipboardList,
  UserPlus,
  Award,
  FileBadge2,
  BarChart3,
  PieChart,
  TrendingUp,
  ReceiptText,
  Gauge,
  Settings,
  Palette,
  ShieldCheck,
  UserCircle2,
  ChevronLeft,
  PanelLeftOpen,
  List as ListIcon,
  ReceiptIndianRupee,
  ChevronRight,
} from "lucide-react";

const Sidebar = ({ isOpen, onToggleMenu }) => {
  const [open, setOpen] = useState({
    org: false,
    user: false,
    courses: false,
    batches: false,
    enrolment: false,
    certificates: false,
    reports: false,
    billing: false,
    settings: false,
  });

  const toggle = useCallback((key) => {
    setOpen((prev) => {
      const next = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      next[key] = !prev[key];
      return next;
    });
  }, []);

  // Logo logic
  const [logoLight, setLogoLight] = useState(null);
  const [logoDark, setLogoDark] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    const light =
      localStorage.getItem("vp_logo_url") || "/assets/images/logo.png";

    const dark =
      localStorage.getItem("vp_logo_url_dark") ||
      localStorage.getItem("vp_logo_url") ||
      "/assets/images/logo-dark.png";

    setLogoLight(light);
    setLogoDark(dark);

    const isDark =
      document.documentElement.getAttribute("data-bs-theme") === "dark";
    setCurrentSrc(isDark ? dark : light);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark";
      setCurrentSrc(isDark ? logoDark || logoLight : logoLight || logoDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });

    return () => observer.disconnect();
  }, [logoLight, logoDark]);

  const handleError = () => {
    const alt =
      currentSrc === logoLight
        ? logoDark || "/assets/images/logo-dark.png"
        : logoLight || "/assets/images/logo-light.png";
    setCurrentSrc(alt);
  };

  // helper for submenu animation
  const submenuStyle = (isOpen) => ({
    maxHeight: isOpen ? "400px" : "0px",
    opacity: isOpen ? 1 : 0,
    overflow: "hidden",
    transition: "max-height 0.25s ease, opacity 0.2s ease",
  });

  return (
    <div
      className={`nk-sidebar nk-sidebar-fixed nk-sidebar-mobile ${isOpen ? "nk-sidebar-active" : ""
        }`}
      data-content="sidebarMenu"
    >
      {/* ===================== SIDEBAR HEADER ===================== */}
      <div className="nk-sidebar-element nk-sidebar-head">
        <div className="nk-sidebar-brand">
          <NavLink to="/admin/dashboard" className="logo-link nk-sidebar-logo">
            {currentSrc && (
              <img
                src={currentSrc}
                alt="Organization Logo"
                className="logo-img"
                onError={handleError}
              />
            )}
          </NavLink>
        </div>

        <div className="nk-menu-trigger me-n2">
          <button
            type="button"
            className="nk-menu-btn d-xl-none"
            onClick={onToggleMenu}
          >
            <ChevronLeft className="icon vp-icon" />
          </button>

          <button
            type="button"
            className="nk-menu-btn d-none d-xl-inline-flex"
            onClick={onToggleMenu}
          >
            <PanelLeftOpen className="icon vp-icon" />
          </button>
        </div>

      </div>

      {/* ===================== SIDEBAR BODY ===================== */}
      <div className="nk-sidebar-element">
        <div className="nk-sidebar-content">
          <div className="nk-sidebar-menu" data-simplebar="">
            <ul className="nk-menu">
              {/* ===== Dashboard ===== */}
              <li className="nk-menu-item">
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `nk-menu-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="nk-menu-icon">
                    <LayoutDashboard className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Dashboard</span>
                </NavLink>
              </li>

              {/* ===== Organization ===== */}
              <li className={`nk-menu-item has-sub ${open.org ? "active" : ""}`}>
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("org");
                  }}
                >
                  <span className="nk-menu-icon">
                    <Building2 className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Organization</span>
                  <span
                    className={`vp-menu-chevron ${open.org ? "open" : ""}`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul className="nk-menu-sub" style={submenuStyle(open.org)}>
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/suborgs"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Network className="vp-icon me-2" />
                      <span className="nk-menu-text">Sub-Organizations</span>
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== User Management ===== */}
              {/* ===== User Management ===== */}
              <li className={`nk-menu-item has-sub ${open.user ? "active" : ""}`}>
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("user");
                  }}
                >
                  <span className="nk-menu-icon">
                    <Users className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">User Management</span>
                  <span className={`vp-menu-chevron ${open.user ? "open" : ""}`}>
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul className="nk-menu-sub" style={submenuStyle(open.user)}>
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <UserSquare2 className="vp-icon me-2" /> All Users
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/educators"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <GraduationCap className="vp-icon me-2" /> Educators
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/suborg-admins"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <ShieldCheck className="vp-icon me-2" /> Sub-Org Admins
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/learners"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <UserRound className="vp-icon me-2" /> Learners
                    </NavLink>
                  </li>
                </ul>
              </li>


              {/* ===== Courses (SEPARATE SECTION) ===== */}
              <li
                className={`nk-menu-item has-sub ${open.courses ? "active" : ""
                  }`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("courses");
                  }}
                >
                  <span className="nk-menu-icon">
                    <BookOpenText className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Courses</span>
                  <span
                    className={`vp-menu-chevron ${open.courses ? "open" : ""}`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul
                  className="nk-menu-sub"
                  style={submenuStyle(open.courses)}
                >
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/categories"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Tags className="vp-icon me-2" /> Categories
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/courses"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <ListIcon className="vp-icon me-2" /> Course List
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== Batches (SEPARATE SECTION) ===== */}
              <li
                className={`nk-menu-item has-sub ${open.batches ? "active" : ""
                  }`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("batches");
                  }}
                >
                  <span className="nk-menu-icon">
                    <Layers3 className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Batches</span>
                  <span
                    className={`vp-menu-chevron ${open.batches ? "open" : ""}`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul
                  className="nk-menu-sub"
                  style={submenuStyle(open.batches)}
                >
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/batches"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Layers3 className="vp-icon me-2" /> All Batches
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== Enrolment ===== */}
              <li
                className={`nk-menu-item has-sub ${open.enrolment ? "active" : ""}`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("enrolment");
                  }}
                >
                  <span className="nk-menu-icon">
                    <ClipboardList className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Enrollment</span>
                  <span
                    className={`vp-menu-chevron ${open.enrolment ? "open" : ""}`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul className="nk-menu-sub" style={submenuStyle(open.enrolment)}>
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/enrolments"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <ClipboardList className="vp-icon me-2" />
                      Enrolment List
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/enrolments/new"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <UserPlus className="vp-icon me-2" />
                      Enroll a Learner
                    </NavLink>
                  </li>
                </ul>
              </li>


              {/* ===== Certificates ===== */}
              <li
                className={`nk-menu-item has-sub ${open.certificates ? "active" : ""
                  }`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("certificates");
                  }}
                >
                  <span className="nk-menu-icon">
                    <Award className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Certificates</span>
                  <span
                    className={`vp-menu-chevron ${open.certificates ? "open" : ""
                      }`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul
                  className="nk-menu-sub"
                  style={submenuStyle(open.certificates)}
                >
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/certificates/templates"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <FileBadge2 className="vp-icon me-2" />
                      Certificate Templates
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/certificates"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Award className="vp-icon me-2" />
                      Issued Certificates
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== Reports & Analytics ===== */}
              <li
                className={`nk-menu-item has-sub ${open.reports ? "active" : ""
                  }`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("reports");
                  }}
                >
                  <span className="nk-menu-icon">
                    <BarChart3 className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Reports & Analytics</span>
                  <span
                    className={`vp-menu-chevron ${open.reports ? "open" : ""
                      }`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul
                  className="nk-menu-sub"
                  style={submenuStyle(open.reports)}
                >
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/reports/overview"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <PieChart className="vp-icon me-2" /> Overview
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/reports/courses"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <BookOpenText className="vp-icon me-2" /> Course Reports
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/reports/learners"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <TrendingUp className="vp-icon me-2" /> Learner Progress
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== Billing ===== */}
              <li
                className={`nk-menu-item has-sub ${open.billing ? "active" : ""
                  }`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("billing");
                  }}
                >
                  <span className="nk-menu-icon">
                    <ReceiptIndianRupee className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Billing & Invoices</span>
                  <span
                    className={`vp-menu-chevron ${open.billing ? "open" : ""
                      }`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul
                  className="nk-menu-sub"
                  style={submenuStyle(open.billing)}
                >
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/billing/invoices"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <ReceiptText className="vp-icon me-2" /> Invoices
                    </NavLink>
                  </li>

                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/billing/subscription"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Gauge className="vp-icon me-2" /> Subscription & Usage
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== Settings ===== */}
              <li
                className={`nk-menu-item has-sub ${open.settings ? "active" : ""
                  }`}
              >
                <a
                  href="#"
                  className="nk-menu-link nk-menu-toggle vp-menu-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("settings");
                  }}
                >
                  <span className="nk-menu-icon">
                    <Settings className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Settings</span>
                  <span
                    className={`vp-menu-chevron ${open.settings ? "open" : ""
                      }`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </a>

                <ul
                  className="nk-menu-sub"
                  style={submenuStyle(open.settings)}
                >
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/settings/general"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Building2 className="vp-icon me-2" /> Org Settings
                    </NavLink>
                  </li>
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/settings/branding"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <Palette className="vp-icon me-2" /> Branding & Theme
                    </NavLink>
                  </li>
                  <li className="nk-menu-item">
                    <NavLink
                      to="/admin/settings/auth"
                      className={({ isActive }) =>
                        `nk-menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <ShieldCheck className="vp-icon me-2" /> Auth & Security
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* ===== Admin Profile ===== */}
              <li className="nk-menu-item">
                <NavLink
                  to="/admin/profile"
                  className={({ isActive }) =>
                    `nk-menu-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="nk-menu-icon">
                    <UserCircle2 className="vp-icon" />
                  </span>
                  <span className="nk-menu-text">Admin Profile</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

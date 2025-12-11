// src/features/userManagement/pages/UserDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  fetchUserById,
  deleteUser,
  updateUserStatus,
} from "../api/usersApi";
import {
  ArrowLeft,
  Edit3,
  UserX,
  UserCheck,
  UserMinus,
  ArrowLeftRight,
  ShieldCheck,
  Trash2,
  Mail,
  Phone,
  Building2,
  CalendarClock,
  Activity,
} from "lucide-react";

const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ===== Current logged-in user (from localStorage) =====
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    currentUser = null;
  }

  const currentRole = currentUser?.role;
  const isAdmin = currentRole === "admin"; // keep as-is for Transfer Sub-Org (Admin only)
  const canVerifyEducator =
    currentRole === "admin" || currentRole === "subOrgAdmin";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchUserById(id);
        if (!isMounted) return;
        setUser(data);
      } catch (err) {
        console.error("Error fetching user details:", err);
        if (!isMounted) return;
        setError(
          err?.message || "Failed to load user details. Please try again."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active") return "badge bg-success-dim text-success";
    if (s === "pending") return "badge bg-warning-dim text-warning";
    if (s === "inactive") return "badge bg-info-dim text-info";
    if (["blocked", "suspend", "suspended"].includes(s))
      return "badge bg-danger-dim text-danger";
    return "badge bg-light text-muted";
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setActionLoading(true);
    setError("");
    try {
      await deleteUser(id);
      navigate("/admin/users");
    } catch (err) {
      console.error("Delete user error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete user.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const current = (user.status || "").toLowerCase();
    const nextStatus = current === "active" ? "blocked" : "active";

    setActionLoading(true);
    setError("");
    try {
      await updateUserStatus(id, nextStatus);
      setUser((prev) => ({ ...prev, status: nextStatus }));
    } catch (err) {
      console.error("Update status error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user status.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <div className="text-soft mt-2 small">Loading user...</div>
      </div>
    );
  }

  if (error && !user) {
    return <p className="text-danger">{error}</p>;
  }

  if (!user) return null;

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const organizationName =
    user.orgName ||
    user.organizationName ||
    user.subOrgName ||
    user.subOrgId ||
    "Main Org";

  const isActive = (user.status || "").toLowerCase() === "active";
  const isEducator =
    (user.role || user.userRole || "").toLowerCase() === "educator";

  return (
    <>
      {/* PAGE HEAD */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <div className="d-flex align-items-center gap-2 mb-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-light border-0 p-1 me-1"
                onClick={() => navigate(-1)}
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="nk-block-title page-title mb-0">
                User /{" "}
                <strong className="text-primary small">
                  {user.name || "User"}
                </strong>
              </h3>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                View and manage user profile, role and account status.
              </p>
            </div>
          </div>

          <div className="nk-block-head-content">
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              {/* Edit User */}
              <Link
                to={`/admin/users/${id}/edit`}
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
              >
                <Edit3 size={16} className="me-1" />
                Edit User
              </Link>

              {/* Educator Verification button (only for educator + admin/subOrgAdmin) */}
              {isEducator && canVerifyEducator && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                  onClick={() => navigate(`/admin/educators/${id}/verify`)}
                >
                  <ShieldCheck size={16} className="me-1" />
                  Educator Verification
                </button>
              )}

              {/* Transfer Sub-Org (Admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                  onClick={() => navigate(`/admin/users/${id}/transfer`)}
                >
                  <ArrowLeftRight size={16} className="me-1" />
                  Transfer Sub-Org
                </button>
              )}

              {/* Suspend / Activate */}
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center ${
                  isActive ? "btn-outline-danger" : "btn-outline-success"
                }`}
                disabled={actionLoading}
                onClick={handleToggleStatus}
              >
                {isActive ? (
                  <>
                    <UserMinus size={16} className="me-1" /> Suspend
                  </>
                ) : (
                  <>
                    <UserCheck size={16} className="me-1" /> Activate
                  </>
                )}
              </button>

              {/* Delete */}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                disabled={actionLoading}
                onClick={handleDelete}
              >
                <Trash2 size={16} className="me-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner">

            {/* TOP PROFILE HEADER */}
            <div className="d-flex align-items-center mb-4">
              <div className="user-avatar bg-primary-dim me-3">
                <span>{initials}</span>
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-1">{user.name || "-"}</h5>
                <div className="d-flex flex-wrap align-items-center gap-2 small text-muted">
                  <span className="d-flex align-items-center">
                    <Mail size={14} className="me-1" />
                    {user.email || "-"}
                  </span>
                  <span className="text-soft">•</span>
                  <span className="d-flex align-items-center">
                    <Building2 size={14} className="me-1" />
                    {organizationName}
                  </span>
                </div>
                <div className="mt-1 small">
                  <span className="me-2">
                    Role:{" "}
                    <strong className="text-capitalize">
                      {user.role || user.userRole || "-"}
                    </strong>
                  </span>
                  <span>
                    Status:{" "}
                    <span
                      className={getStatusBadgeClass(user.status)}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {user.status || "-"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* DETAIL CARDS */}
            <div className="row g-gs">
              {/* LEFT: Basic Info */}
              <div className="col-md-6">
                <div className="card card-bordered h-100">
                  <div className="card-inner">
                    <h6 className="title mb-3">Basic Information</h6>
                    <dl className="row gy-2">
                      <dt className="col-sm-4">Full Name</dt>
                      <dd className="col-sm-8">{user.name || "-"}</dd>

                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8 d-flex align-items-center">
                        <Mail size={14} className="me-1 text-primary" />
                        {user.email || "-"}
                      </dd>

                      <dt className="col-sm-4">Phone</dt>
                      <dd className="col-sm-8 d-flex align-items-center">
                        <Phone size={14} className="me-1 text-primary" />
                        {user.phone || "-"}
                      </dd>

                      <dt className="col-sm-4">Organization</dt>
                      <dd className="col-sm-8 d-flex align-items-center">
                        <Building2 size={14} className="me-1 text-primary" />
                        {organizationName}
                      </dd>

                      <dt className="col-sm-4">Role</dt>
                      <dd className="col-sm-8 text-capitalize">
                        {user.role || user.userRole || "-"}
                      </dd>

                      <dt className="col-sm-4">Status</dt>
                      <dd className="col-sm-8">
                        <span
                          className={getStatusBadgeClass(user.status)}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {user.status || "-"}
                        </span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* RIGHT: Activity */}
              <div className="col-md-6">
                <div className="card card-bordered h-100">
                  <div className="card-inner">
                    <h6 className="title mb-3">Activity</h6>
                    <dl className="row gy-2">
                      <dt className="col-sm-4">Joined</dt>
                      <dd className="col-sm-8 d-flex align-items-center">
                        <CalendarClock
                          size={14}
                          className="me-1 text-primary"
                        />
                        {formatDate(user.createdAt)}
                      </dd>

                      <dt className="col-sm-4">Last Active</dt>
                      <dd className="col-sm-8 d-flex align-items-center">
                        <Activity size={14} className="me-1 text-primary" />
                        {formatDate(user.lastActiveAt || user.lastLoginAt)}
                      </dd>

                      <dt className="col-sm-4">Last Updated</dt>
                      <dd className="col-sm-8 d-flex align-items-center">
                        <CalendarClock
                          size={14}
                          className="me-1 text-primary"
                        />
                        {formatDate(user.updatedAt)}
                      </dd>
                    </dl>

                    {/* Placeholder for future: Permissions / Courses etc */}
                    <div className="mt-3 small text-soft">
                      You can extend this section with course enrolments,
                      permissions or activity logs as needed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsPage;

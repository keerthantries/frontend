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
import { fetchSubOrgs } from "../../subOrgManagement/api/suborgApi"; 

const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // current logged-in user
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {
    currentUser = null;
  }

  const currentRole = currentUser?.role;
  const isAdmin = currentRole === "admin";
  const canVerifyEducator =
    currentRole === "admin" || currentRole === "subOrgAdmin";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // sub-org mapping (id → name) so details page never shows raw IDs
  const [subOrgMap, setSubOrgMap] = useState({});

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
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load user details. Please try again."
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

  // Load sub-org list once so we can resolve IDs → names
  useEffect(() => {
    let isMounted = true;

    async function loadSubOrgs() {
      try {
        const res = await fetchSubOrgs();
        const data = res?.data;

        let items = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.items)) items = data.items;
        else if (Array.isArray(data?.data?.items)) items = data.data.items;
        else if (Array.isArray(data?.data)) items = data.data;

        const map = {};
        (items || []).forEach((so) => {
          const sid = so.id || so._id;
          if (!sid) return;
          const name =
            so.name || so.subOrgName || so.displayName || `Sub-Org #${sid}`;
          map[String(sid)] = name;
        });

        if (isMounted) setSubOrgMap(map);
      } catch (err) {
        // non-blocking – just log
        console.warn("Failed to load sub-orgs for details page:", err);
      }
    }

    loadSubOrgs();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const getOrganizationName = () => {
    if (!user) return "Main Org";

    // direct names from user
    const direct =
      user.subOrgName ||
      user.orgName ||
      user.organizationName ||
      user.org?.name ||
      user.subOrg?.name;

    if (direct) return direct;

    // lookup by id
    const possibleId =
      user.subOrgId ||
      user.suborgId ||
      user.orgId ||
      user.organizationId ||
      user.subOrg?._id ||
      user.subOrg?.id;

    if (possibleId && subOrgMap[String(possibleId)]) {
      return subOrgMap[String(possibleId)];
    }

    return "Main Org";
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
      setUser((prev) => (prev ? { ...prev, status: nextStatus } : prev));
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

  // ===== Loading / error states in full-page style =====
  if (loading && !user) {
    return (
      <div className="nk-block">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <div className="text-soft mt-2 small">
            Loading user details...
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="nk-block">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mt-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="me-1" />
          Back
        </button>
      </div>
    );
  }

  if (!user) return null;

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const organizationName = getOrganizationName();
  const isActive = (user.status || "").toLowerCase() === "active";
  const isEducator =
    (user.role || user.userRole || "").toLowerCase() === "educator";

  return (
    <>
      {/* PAGE HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              <button
                type="button"
                className="btn btn-sm btn-outline-light me-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} className="me-1" />
                Back
              </button>
              User /{" "}
              <strong className="text-primary small">
                {user.name || "User"}
              </strong>
            </h3>
            <div className="nk-block-des text-soft">
              <p>View and manage user profile, role and status.</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="d-flex flex-wrap gap-2">
              {/* Edit User */}
              <Link
                to={`/admin/users/${id}/edit`}
                className="btn btn-outline-primary btn-sm"
              >
                <Edit3 className="me-1" size={16} />
                Edit User
              </Link>

              {/* Educator Verification */}
              {isEducator && canVerifyEducator && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate(`/admin/educators/${id}/verify`)}
                >
                  <ShieldCheck className="me-1" size={16} />
                  Educator Verification
                </button>
              )}

              {/* Transfer Sub-Org (Admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate(`/admin/users/${id}/transfer`)}
                >
                  <ArrowLeftRight className="me-1" size={16} />
                  Transfer Sub-Org
                </button>
              )}

              {/* Suspend / Activate */}
              <button
                type="button"
                className={`btn btn-sm ${
                  isActive ? "btn-outline-danger" : "btn-outline-success"
                }`}
                disabled={actionLoading}
                onClick={handleToggleStatus}
              >
                {isActive ? (
                  <>
                    <UserMinus className="me-1" size={16} /> Suspend
                  </>
                ) : (
                  <>
                    <UserCheck className="me-1" size={16} /> Activate
                  </>
                )}
              </button>

              {/* Delete */}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                disabled={actionLoading}
                onClick={handleDelete}
              >
                <Trash2 className="me-1" size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE-LEVEL ALERTS */}
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner">
            {/* Header / summary */}
            <div className="d-flex align-items-center mb-4">
              <div className="user-avatar bg-primary me-3">
                <span>{initials}</span>
              </div>
              <div>
                <h5 className="mb-1">{user.name || "-"}</h5>
                <div className="text-muted small d-flex flex-wrap gap-2">
                  {user.email && (
                    <span className="d-inline-flex align-items-center me-2">
                      <Mail size={14} className="me-1" /> {user.email}
                    </span>
                  )}
                  {user.phone && (
                    <span className="d-inline-flex align-items-center me-2">
                      <Phone size={14} className="me-1" /> {user.phone}
                    </span>
                  )}
                </div>
                <div className="mt-1 d-flex flex-wrap gap-2 align-items-center">
                  <span className="badge bg-light text-dark text-capitalize">
                    Role: {user.role || user.userRole || "-"}
                  </span>
                  <span className={getStatusBadgeClass(user.status)}>
                    {user.status || "-"}
                  </span>
                  <span className="badge bg-outline-primary d-inline-flex align-items-center">
                    <Building2 size={14} className="me-1" />
                    {organizationName}
                  </span>
                </div>
              </div>
            </div>

            {/* Detail cards */}
            <div className="row g-gs">
              <div className="col-md-6">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <h6 className="title mb-3">Basic Information</h6>
                    <dl className="row gy-2">
                      <dt className="col-sm-4">Full Name</dt>
                      <dd className="col-sm-8">{user.name || "-"}</dd>

                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8">{user.email || "-"}</dd>

                      <dt className="col-sm-4">Phone</dt>
                      <dd className="col-sm-8">{user.phone || "-"}</dd>

                      <dt className="col-sm-4">Organization</dt>
                      <dd className="col-sm-8">{organizationName}</dd>

                      <dt className="col-sm-4">Role</dt>
                      <dd className="col-sm-8">
                        {user.role || user.userRole || "-"}
                      </dd>

                      <dt className="col-sm-4">Status</dt>
                      <dd className="col-sm-8">
                        <span className={getStatusBadgeClass(user.status)}>
                          {user.status || "-"}
                        </span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <h6 className="title mb-3">Activity</h6>
                    <dl className="row gy-2">
                      <dt className="col-sm-4 d-flex align-items-center">
                        <CalendarClock size={14} className="me-1" /> Joined
                      </dt>
                      <dd className="col-sm-8">
                        {formatDate(user.createdAt)}
                      </dd>

                      <dt className="col-sm-4 d-flex align-items-center">
                        <Activity size={14} className="me-1" /> Last Active
                      </dt>
                      <dd className="col-sm-8">
                        {formatDate(user.lastActiveAt || user.lastLoginAt)}
                      </dd>

                      <dt className="col-sm-4 d-flex align-items-center">
                        <CalendarClock size={14} className="me-1" />
                        Last Updated
                      </dt>
                      <dd className="col-sm-8">
                        {formatDate(user.updatedAt)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* future: sections for enrollments, courses, etc. */}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsPage;

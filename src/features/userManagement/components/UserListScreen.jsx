// src/features/userManagement/components/UserListScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Ban,
  Shield,
  Mail,
  Trash2,
  ArrowLeftRight,
  UserX,
} from "lucide-react";
import {
  fetchUsers,
  deleteUser,
  updateUserStatus,
} from "../api/usersApi";

const UserListScreen = ({ title = "Users", addLabel = "Add User", role, subOrgId }) => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  // current user (for permissions)
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.role === "superadmin" ||
    currentUser?.role === "superAdmin";

  // debounce search
  useEffect(() => {
    const handle = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setDebouncedSearch(searchTerm.trim());
    }, 400);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  // fetch users
  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchUsers({
          page: pagination.page,
          limit: pagination.limit,
          q: debouncedSearch || undefined,
          role,
          sortBy,
          sortDir,
          subOrgId, // ✅ so this component can be reused under a Sub-Org
        });

        if (!isMounted) return;

        const items = result.items || result.data || [];
        const pag = result.pagination || {};

        setUsers(items);
        setPagination((prev) => ({
          ...prev,
          page: pag.page ?? prev.page,
          limit: pag.limit ?? prev.limit,
          total: pag.total ?? items.length,
          totalPages: pag.totalPages ?? prev.totalPages ?? 1,
        }));
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching users:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load users.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    sortBy,
    sortDir,
    role,
    subOrgId,
  ]);

  // helpers
  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

const getStatusPillClass = (status) => {
  const s = (status || "").toLowerCase();

  if (s === "active") return "badge bg-success-dim text-success";
  if (s === "pending") return "badge bg-warning-dim text-warning";
  if (s === "inactive") return "badge bg-info-dim text-info";
  if (["blocked", "suspend", "suspended"].includes(s))
    return "badge bg-danger-dim text-danger";

  return "badge bg-light text-muted";
};


  const totalUsers = pagination.total ?? users.length;
  const activeUsers = users.filter(
    (u) => (u.status || "").toLowerCase() === "active"
  ).length;
  const blockedUsers = users.filter((u) =>
    ["blocked", "suspend", "suspended"].includes(
      (u.status || "").toLowerCase()
    )
  ).length;

  const handleChangePage = (newPage) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSort = (columnKey) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSortBy((prevSortBy) => {
      if (prevSortBy === columnKey) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevSortBy;
      }
      setSortDir("asc");
      return columnKey;
    });
  };

  const renderSortIndicator = (columnKey) => {
    if (sortBy !== columnKey) return null;
    return (
      <span className="ms-1 small text-muted">
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const handleRowClick = (user) => {
    const id = user.id || user._id;
    if (!id) return;
    navigate(`/admin/users/${id}`);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const current = String(currentStatus || "").toLowerCase();
    const nextStatus = current === "active" ? "blocked" : "active";

    if (
      !window.confirm(
        `Are you sure you want to set this user as "${nextStatus}"?`
      )
    ) {
      return;
    }

    setActionLoadingId(id);
    try {
      await updateUserStatus(id, nextStatus);
      setUsers((prev) =>
        prev.map((u) =>
          (u.id || u._id) === id ? { ...u, status: nextStatus } : u
        )
      );
    } catch (err) {
      console.error("Update status error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user status.";
      alert(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setActionLoadingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max((prev.total || 1) - 1, 0),
      }));
    } catch (err) {
      console.error("Delete user error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete user.";
      alert(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">{title}</h3>
            <div className="nk-block-des text-soft">
              <p>
                Manage all{" "}
                {role ? role.toLowerCase() + "s" : "users"} in this tenant.
              </p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="d-flex flex-wrap gap-2">
              <div className="badge bg-light text-muted rounded-pill px-3 py-2">
                <span className="small d-block text-uppercase fw-semibold">
                  Total
                </span>
                <span className="fw-bold">{totalUsers}</span>
              </div>
              <div className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                <span className="small d-block text-uppercase fw-semibold">
                  Active
                </span>
                <span className="fw-bold">{activeUsers}</span>
              </div>
              <div className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
                <span className="small d-block text-uppercase fw-semibold">
                  Blocked
                </span>
                <span className="fw-bold">{blockedUsers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS + ACTIONS */}
      <div className="nk-block">
        <div className="card card-bordered mb-3">
          <div className="card-inner">
            <div className="row g-3 align-items-center">
              {/* Search */}
              <div className="col-md-6">
                <div className="form-control-wrap">
                  <div className="form-icon form-icon-left">
                    <Search className="icon" size={16} />
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or org"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Right side: Add button */}
              <div className="col-md-6 text-md-end">
                <div className="nk-block-tools">
                  <ul className="nk-block-tools g-2">
                    <li className="nk-block-tools-opt">
                      <button
                        type="button"
                        className="btn btn-icon btn-primary d-md-none"
                        onClick={() => navigate("/admin/users/new")}
                      >
                        <Plus className="icon" size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary d-none d-md-inline-flex"
                        onClick={() => navigate("/admin/users/new")}
                      >
                        <Plus className="icon me-1" size={18} />
                        <span>{addLabel}</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="card card-bordered card-stretch">
          <div className="card-inner p-0">
            <div className="nk-tb-list nk-tb-ulist">
              {/* table head */}
              <div className="nk-tb-item nk-tb-head">
                <div
                  className="nk-tb-col"
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="sub-text">
                    Name {renderSortIndicator("name")}
                  </span>
                </div>
                <div
                  className="nk-tb-col tb-col-md"
                  onClick={() => handleSort("email")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="sub-text">
                    Email {renderSortIndicator("email")}
                  </span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Organization</span>
                </div>
                <div
                  className="nk-tb-col tb-col-md"
                  onClick={() => handleSort("role")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="sub-text">
                    Role {renderSortIndicator("role")}
                  </span>
                </div>
                <div
                  className="nk-tb-col tb-col-md"
                  onClick={() => handleSort("status")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="sub-text">
                    Status {renderSortIndicator("status")}
                  </span>
                </div>
                <div
                  className="nk-tb-col tb-col-md"
                  onClick={() => handleSort("createdAt")}
                  style={{ cursor: "pointer", minWidth: 120 }}
                >
                  <span className="sub-text">
                    Created {renderSortIndicator("createdAt")}
                  </span>
                </div>
                <div className="nk-tb-col nk-tb-col-tools text-end">
                  <span className="sub-text">Actions</span>
                </div>
              </div>

              {/* table body */}
              {loading && (
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span>Loading users...</span>
                  </div>
                </div>
              )}

              {!loading && users.length === 0 && (
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="text-muted">No users found.</span>
                  </div>
                </div>
              )}

              {!loading &&
                users.map((user) => {
                  const id = user.id || user._id;
                  const initials =
                    user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "U";

                  const status = user.status || "inactive";
                  const orgName =
                    user.orgName ||
                    user.organizationName ||
                    user.subOrgName ||
                    "Main Org";

                  const isActive =
                    (user.status || "").toLowerCase() === "active";

                  return (
                    <div
                      key={id}
                      className="nk-tb-item"
                      onClick={() => handleRowClick(user)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Name + avatar */}
                      <div className="nk-tb-col">
                        <div className="user-card">
                          <div className="user-avatar bg-primary-dim">
                            <span>{initials}</span>
                          </div>
                          <div className="user-info">
                            <span className="tb-lead">
                              {user.name || "Unnamed User"}
                            </span>
                            <span className="text-soft">
                              {user.username || ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="nk-tb-col tb-col-md">
                        <span className="tb-sub">{user.email}</span>
                      </div>

                      {/* Organization */}
                      <div className="nk-tb-col tb-col-md">
                        <span className="tb-sub">{orgName}</span>
                      </div>

                      {/* Role */}
                      <div className="nk-tb-col tb-col-md">
                        <span className="tb-sub text-capitalize">
                          {user.role || user.userRole || "user"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="nk-tb-col tb-col-md">
                        <span className={getStatusPillClass(status)}>
                          {String(status).charAt(0).toUpperCase() +
                            String(status).slice(1)}
                        </span>
                      </div>

                      {/* Created */}
                      <div className="nk-tb-col tb-col-md">
                        <span className="tb-sub">
                          {formatDate(user.createdAt || user.createdOn)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div
                        className="nk-tb-col nk-tb-col-tools text-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="drodown">
                          <button
                            type="button"
                            className="btn btn-sm btn-icon btn-trigger"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <MoreVertical className="icon" size={18} />
                          </button>
                          <div className="dropdown-menu dropdown-menu-end">
                            <ul className="link-list-opt no-bdr">
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() =>
                                    navigate(`/admin/users/${id}`)
                                  }
                                >
                                  <Eye className="icon me-1" size={16} />
                                  <span>View details</span>
                                </button>
                              </li>

                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() =>
                                    handleToggleStatus(id, user.status)
                                  }
                                  disabled={actionLoadingId === id}
                                >
                                  <Ban
                                    className="icon me-1"
                                    size={16}
                                  />
                                  <span>
                                    {isActive ? "Block user" : "Unblock user"}
                                  </span>
                                </button>
                              </li>

                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() =>
                                    navigate(`/admin/users/${id}/edit`)
                                  }
                                >
                                  <Shield
                                    className="icon me-1"
                                    size={16}
                                  />
                                  <span>Edit / permissions</span>
                                </button>
                              </li>

                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() =>
                                    navigate(`/admin/users/${id}`)
                                  }
                                >
                                  <Mail
                                    className="icon me-1"
                                    size={16}
                                  />
                                  <span>Send email</span>
                                </button>
                              </li>

                              {isAdmin && (
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() =>
                                      navigate(
                                        `/admin/users/${id}/transfer`
                                      )
                                    }
                                  >
                                    <ArrowLeftRight
                                      className="icon me-1"
                                      size={16}
                                    />
                                    <span>Transfer sub-org</span>
                                  </button>
                                </li>
                              )}

                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDelete(id)}
                                  disabled={actionLoadingId === id}
                                >
                                  <UserX
                                    className="icon me-1"
                                    size={16}
                                  />
                                  <span>Delete user</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Pagination footer */}
          {pagination.totalPages > 1 && (
            <div className="card-inner border-top">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="small text-soft">
                  Showing{" "}
                  <strong>
                    {users.length ? (pagination.page - 1) * pagination.limit + 1 : 0}
                  </strong>{" "}
                  –{" "}
                  <strong>
                    {(pagination.page - 1) * pagination.limit + users.length}
                  </strong>{" "}
                  of <strong>{pagination.total}</strong>
                </div>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.page === 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handleChangePage(pagination.page - 1)}
                    >
                      Prev
                    </button>
                  </li>
                  {Array.from(
                    { length: pagination.totalPages || 1 },
                    (_, i) => i + 1
                  ).map((p) => (
                    <li
                      key={p}
                      className={`page-item ${
                        p === pagination.page ? "active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => handleChangePage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${
                      pagination.page === pagination.totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handleChangePage(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserListScreen;

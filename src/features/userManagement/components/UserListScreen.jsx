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
  ArrowLeftRight,
  UserX,
} from "lucide-react";
import {
  fetchUsers,
  deleteUser,
  updateUserStatus,
} from "../api/usersApi";
import { fetchSubOrgs } from "../../subOrgManagement/api/suborgApi";

const UserListScreen = ({
  title = "All Users",
  addLabel = "Add User",
  role,
  subOrgId,
}) => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
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

  // sub-org mapping { id: name }
  const [subOrgMap, setSubOrgMap] = useState({});

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

  // ===== helpers =====
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

  const getOrgNameForUser = (user) => {
    // 1️⃣ direct name from user
    const direct =
      user.subOrgName ||
      user.orgName ||
      user.organizationName ||
      user.org?.name ||
      user.subOrg?.name;
    if (direct) return direct;

    // 2️⃣ try ID mapping
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

    // 3️⃣ fallback
    return "Main Org";
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

  // ===== debounce search =====
  useEffect(() => {
    const handle = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // ===== fetch users =====
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
          subOrgId,
        });

        if (!isMounted) return;

        const items = result.items || result.data || [];
        const pag = result.pagination || {};

        setUsers(Array.isArray(items) ? items : []);
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

  // ===== fetch sub-orgs once for ID -> name mapping =====
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
          const id = so.id || so._id;
          if (!id) return;
          const name =
            so.name || so.subOrgName || so.displayName || `Sub-Org ${id}`;
          map[String(id)] = name;
        });

        if (isMounted) setSubOrgMap(map);
      } catch (err) {
        console.warn("Failed to load sub-orgs (non-blocking)", err);
      }
    }

    loadSubOrgs();
    return () => {
      isMounted = false;
    };
  }, []);

  // ===== sorting & pagination =====
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

  // ===== actions =====
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

  const startIndex =
    users.length === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;
  const endIndex = (pagination.page - 1) * pagination.limit + users.length;

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
            <div className="d-flex gap-3 align-items-center">

              {/* Total */}
              <div className="badge border border-dark text-dark rounded-pill px-4 py-3 d-flex flex-column align-items-center">
                <span className="small text-uppercase fw-semibold mb-1">
                  Total
                </span>
                <span className="fw-bold fs-6">
                  {totalUsers}
                </span>
              </div>

              {/* Active */}
              <div className="badge border border-dark text-dark rounded-pill px-4 py-3 d-flex flex-column align-items-center">
                <span className="small text-uppercase fw-semibold mb-1">
                  Active
                </span>
                <span className="fw-bold fs-6">
                  {activeUsers}
                </span>
              </div>

              {/* Blocked */}
              <div className="badge border border-dark text-dark rounded-pill px-4 py-3 d-flex flex-column align-items-center">
                <span className="small text-uppercase fw-semibold mb-1">
                  Blocked
                </span>
                <span className="fw-bold fs-6">
                  {blockedUsers}
                </span>
              </div>

            </div>
          </div>


        </div>
      </div>

      {/* SEARCH + ADD BAR */}
      <div className="nk-block">
        <div className="card card-bordered mb-3">
          <div className="card-inner">
            <div className="row g-3 align-items-center">
              <div className="col-md-7">
                <div className="form-control-wrap position-relative ">

                  {/* Search icon */}
                  <div className="form-icon form-icon-left d-flex align-items-center h-100">
                    <Search className="icon" size={16} />
                  </div>

                  {/* Input */}
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5"
                    placeholder="Search by name, email, or org"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                </div>
              </div>

              <div className="col-md-5 text-md-end">
                <div className="nk-block-tools justify-content-md-end">
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

        {/* USERS TABLE */}
        <div className="card card-bordered card-stretch">
          {/* header strip similar to footer highlight */}
          <div className="card-inner border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div className="small text-soft">Users list</div>
              <div className="small text-soft">
                Sorted by{" "}
                <span className="text-dark text-capitalize">{sortBy}</span>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th onClick={() => handleSort("name")}>
                    Name {renderSortIndicator("name")}
                  </th>
                  <th onClick={() => handleSort("email")}>
                    Email {renderSortIndicator("email")}
                  </th>
                  <th>Organization</th>
                  <th onClick={() => handleSort("role")}>
                    Role {renderSortIndicator("role")}
                  </th>
                  <th onClick={() => handleSort("status")}>
                    Status {renderSortIndicator("status")}
                  </th>
                  <th onClick={() => handleSort("createdAt")}>
                    Created {renderSortIndicator("createdAt")}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7}>Loading users...</td>
                  </tr>
                )}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="text-center py-4">
                        <div className="text-muted">No users found.</div>
                        <div className="text-soft small">
                          Try changing your search or filters.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  users.map((user) => {
                    const id = user.id || user._id;
                    const initials =
                      (user.name || "")
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "U";

                    const status = user.status || "inactive";
                    const orgName = getOrgNameForUser(user);
                    const isActive =
                      (user.status || "").toLowerCase() === "active";

                    return (
                      <tr
                        key={id}
                        className="cursor-pointer"
                        onClick={() => handleRowClick(user)}
                      >
                        {/* Name + avatar */}
                        <td>
                          <div className="user-card">
                            <div className="user-avatar bg-primary-dim">
                              <span>{initials}</span>
                            </div>
                            <div className="user-info">
                              <span className="tb-lead">
                                {user.name || "Unnamed User"}
                              </span>
                              <span className="text-soft small">
                                ID: {id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td>
                          <span className="tb-sub">{user.email}</span>
                        </td>

                        {/* Organization */}
                        <td>
                          <span className="tb-sub">{orgName}</span>
                        </td>

                        {/* Role */}
                        <td>
                          <span className="tb-sub text-capitalize">
                            {user.role || user.userRole || "user"}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={getStatusPillClass(status)}>
                            {String(status).charAt(0).toUpperCase() +
                              String(status).slice(1)}
                          </span>
                        </td>

                        {/* Created */}
                        <td>
                          <span className="tb-sub">
                            {formatDate(user.createdAt || user.createdOn)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="text-end"
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
                                <li className="dropdown-header text-muted small text-uppercase px-3">
                                  User actions
                                </li>
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
                                    <Ban className="icon me-1" size={16} />
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
                                    <Shield className="icon me-1" size={16} />
                                    <span>Edit / permissions</span>
                                  </button>
                                </li>

                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() =>
                                      window.open(
                                        `mailto:${user.email}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <Mail className="icon me-1" size={16} />
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
                                    <UserX className="icon me-1" size={16} />
                                    <span>Delete user</span>
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="card-inner border-top">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small text-soft">
                Showing <strong>{startIndex}</strong> –{" "}
                <strong>{endIndex}</strong> of{" "}
                <strong>{pagination.total}</strong>
              </div>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${pagination.page === 1 ? "disabled" : ""
                    }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      handleChangePage(pagination.page - 1)
                    }
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
                    className={`page-item ${p === pagination.page ? "active" : ""
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
                  className={`page-item ${pagination.page === pagination.totalPages
                    ? "disabled"
                    : ""
                    }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      handleChangePage(pagination.page + 1)
                    }
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserListScreen;

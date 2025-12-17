// src/features/batches/pages/BatchesListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Layers3, PlayCircle, Filter } from "lucide-react";
import { FiMoreVertical, FiEye, FiEdit, FiUsers } from "react-icons/fi";
import { fetchBatches } from "../api/batchesApi";
import { fetchSubOrgs } from "../../subOrgManagement/api/suborgApi";

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const getStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "draft") return "badge-dim bg-warning";
  if (s === "published") return "badge-dim bg-success";
  if (s === "ongoing") return "badge-dim bg-primary";
  if (s === "completed") return "badge-dim bg-info";
  if (s === "cancelled") return "badge-dim bg-danger";
  return "badge-dim bg-light text-muted";
};

const getModeBadgeClass = (mode) => {
  const m = (mode || "").toLowerCase();
  if (m === "online") return "badge-dim bg-success";
  if (m === "offline") return "badge-dim bg-warning";
  if (m === "hybrid") return "badge-dim bg-info";
  return "badge-dim bg-light text-muted";
};

const BatchesListPage = () => {
  const navigate = useNavigate();

  // CURRENT USER
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isSubOrgAdmin = currentUser?.role === "subOrgAdmin";
  const restrictedSubOrgId =
    isSubOrgAdmin && currentUser?.subOrgId ? currentUser.subOrgId : null;

  // STATE
  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [courseQuery, setCourseQuery] = useState("");
  const [subOrgFilter, setSubOrgFilter] = useState(
    restrictedSubOrgId || "all"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [subOrgs, setSubOrgs] = useState([]);
  const [loadingSubOrgs, setLoadingSubOrgs] = useState(false);

  // DEBOUNCE SEARCH
  useEffect(() => {
    const handle = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // LOAD SUB-ORGS
  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;

    async function loadSubOrgs() {
      setLoadingSubOrgs(true);
      try {
        const res = await fetchSubOrgs();
        const list = res?.data?.data || res?.data || [];
        if (!isMounted) return;
        setSubOrgs(list);
      } catch {
        console.error("Failed to load sub-orgs");
      } finally {
        if (isMounted) setLoadingSubOrgs(false);
      }
    }

    loadSubOrgs();
    return () => (isMounted = false);
  }, [isAdmin]);

  // LOAD BATCHES
  useEffect(() => {
    let isMounted = true;

    async function loadBatches() {
      setLoading(true);
      setError("");

      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          q: debouncedSearch || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          mode: modeFilter !== "all" ? modeFilter : undefined,
          courseName: courseQuery || undefined,
          subOrgId:
            restrictedSubOrgId || (subOrgFilter !== "all" ? subOrgFilter : undefined),
        };

        const result = await fetchBatches(params);

        const items = result.items || [];
        const pag = result.pagination || {};

        if (!isMounted) return;

        setBatches(items);
        setPagination((prev) => ({
          ...prev,
          page: pag.page ?? prev.page,
          limit: pag.limit ?? prev.limit,
          total: pag.total ?? items.length,
          totalPages: pag.totalPages ?? prev.totalPages ?? 1,
        }));
      } catch (err) {
        if (!isMounted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load batches.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBatches();
    return () => (isMounted = false);
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
    modeFilter,
    courseQuery,
    subOrgFilter,
    restrictedSubOrgId,
  ]);

  const handleChangePage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* HEADER */}
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">
                  <Layers3 className="me-1" size={18} />
                  Batches
                </h3>
              </div>

              <div className="nk-block-head-content">
                <button
                  className="btn btn-primary d-inline-flex align-items-center"
                  onClick={() => navigate("/admin/batches/add")}
                >
                  <PlayCircle className="me-1" size={14} />
                  Create Batch
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="card card-bordered mb-3">
            <div className="card-inner">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Search</label>
                  <div className="form-control-wrap">
                    <div className="form-icon form-icon-left">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Batch name, code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Course</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Course name..."
                    value={courseQuery}
                    onChange={(e) => {
                      setCourseQuery(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Mode</label>
                  <select
                    className="form-select"
                    value={modeFilter}
                    onChange={(e) => {
                      setModeFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="all">All</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {isAdmin && (
                  <div className="col-md-3">
                    <label className="form-label">Sub-Org</label>
                    <div className="form-control-wrap d-flex align-items-center">
                      <div className="form-icon form-icon-left">
                        <Filter size={16} />
                      </div>
                      <select
                        className="form-select"
                        value={subOrgFilter}
                        onChange={(e) => {
                          setSubOrgFilter(e.target.value);
                          setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        disabled={loadingSubOrgs}
                      >
                        <option value="all">All Sub-Orgs</option>
                        {subOrgs.map((so) => (
                          <option key={so.id || so._id} value={so.id || so._id}>
                            {so.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLE LIST */}
          <div className="nk-tb-list is-separate mb-3">
            <div className="nk-tb-item nk-tb-head">
              <div className="nk-tb-col">
                <span className="sub-text">Batch</span>
              </div>
              <div className="nk-tb-col">
                <span className="sub-text">Course</span>
              </div>
              <div className="nk-tb-col">
                <span className="sub-text">Educator</span>
              </div>
              <div className="nk-tb-col tb-col-md">
                <span className="sub-text">Mode</span>
              </div>
              <div className="nk-tb-col tb-col-md">
                <span className="sub-text">Schedule</span>
              </div>
              <div className="nk-tb-col tb-col-md">
                <span className="sub-text">Capacity</span>
              </div>
              <div className="nk-tb-col tb-col-md">
                <span className="sub-text">Status</span>
              </div>
              <div className="nk-tb-col nk-tb-col-tools">
                <span className="sub-text">Actions</span>
              </div>
            </div>

            {loading && (
              <div className="nk-tb-item">
                <div className="nk-tb-col">Loading batches…</div>
              </div>
            )}

            {error && !loading && (
              <div className="nk-tb-item">
                <div className="nk-tb-col text-danger">{error}</div>
              </div>
            )}

            {!loading &&
              !error &&
              batches.map((batch) => {
                const id = batch.id || batch._id;

                // REAL NAMES ONLY
                const batchName = batch.name || "Untitled Batch";
                const courseName =
                  batch.course?.title || batch.courseName || "-";
                const educatorName =
                  batch.educator?.name || batch.educatorName || "-";

                const scheduleDays =
                  batch.schedule?.daysOfWeek?.join(", ") || "—";
                const startTime = batch.schedule?.startTime || "--:--";
                const endTime = batch.schedule?.endTime || "--:--";

                return (
                  <div className="nk-tb-item" key={id}>
                    {/* BATCH NAME */}
                    <div className="nk-tb-col">
                      <span className="fw-medium">{batchName}</span>
                      <div className="text-soft small">
                        <div>Code: {batch.code || "—"}</div>
                        <div>
                          {formatDate(batch.startDate)} –{" "}
                          {formatDate(batch.endDate)}
                        </div>
                      </div>
                    </div>

                    {/* COURSE NAME */}
                    <div className="nk-tb-col">
                      <span className="tb-lead">{courseName}</span>
                    </div>

                    {/* EDUCATOR NAME */}
                    <div className="nk-tb-col">
                      <span>{educatorName}</span>
                    </div>

                    {/* MODE */}
                    <div className="nk-tb-col tb-col-md">
                      <span className="text-capitalize">
                        {batch.mode || "-"}
                      </span>
                    </div>

                    {/* SCHEDULE */}
                    <div className="nk-tb-col tb-col-md">
                      <div className="small">
                        <div>{scheduleDays}</div>
                        <div className="text-soft small">
                          {startTime} – {endTime}
                        </div>
                      </div>
                    </div>

                    {/* CAPACITY */}
                    <div className="nk-tb-col tb-col-md">
                      <span>
                        {batch.capacity === 0
                          ? "Unlimited"
                          : `${batch.enrollmentCount || 0} / ${
                              batch.capacity ?? "-"
                            }`}
                      </span>
                    </div>

                    {/* STATUS */}
                    <div className="nk-tb-col tb-col-md">
                      <span
                        className={`badge ${getStatusBadgeClass(
                          batch.status
                        )}`}
                      >
                        {batch.status || "draft"}
                      </span>
                      <span className="ms-1">
                        <span
                          className={`badge ${getModeBadgeClass(batch.mode)}`}
                        >
                          {batch.mode || "-"}
                        </span>
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div
                      className="nk-tb-col nk-tb-col-tools"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="drodown">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-trigger dropdown-toggle"
                          data-bs-toggle="dropdown"
                        >
                          <FiMoreVertical className="icon" />
                        </button>
                        <div className="dropdown-menu dropdown-menu-end">
                          <ul className="link-list-opt no-bdr">
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => navigate(`/admin/batches/${id}`)}
                              >
                                <FiEye className="icon me-1" />
                                View Details
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                // FIXED: Changed to point to the edit route instead of details
                                onClick={() =>
                                  navigate(`/admin/batches/${id}/edit`)
                                }
                              >
                                <FiEdit className="icon me-1" />
                                Edit Batch
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() =>
                                  navigate(`/admin/batches/${id}/enrollments`)
                                }
                              >
                                <FiUsers className="icon me-1" />
                                Manage Enrollments
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

          {/* PAGINATION */}
          <div className="card">
            <div className="card-inner">
              <div className="nk-block-between-md g-3">
                <ul className="pagination justify-content-center justify-content-md-start">
                  <li
                    className={`page-item ${
                      pagination.page <= 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handleChangePage(pagination.page - 1)}
                    >
                      Prev
                    </button>
                  </li>
                  <li className="page-item">
                    <span className="page-link">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </li>
                  <li
                    className={`page-item ${
                      pagination.page >= pagination.totalPages
                        ? "disabled"
                        : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handleChangePage(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>

                <div className="pagination-goto d-flex gx-3">
                  <div>Page</div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      className="form-control"
                      style={{ width: "80px" }}
                      value={pagination.page}
                      onChange={(e) =>
                        handleChangePage(Number(e.target.value))
                      }
                    />
                  </div>
                  <div>of {pagination.totalPages}</div>
                </div>
              </div>
            </div>
          </div>

          {/* END */}
        </div>
      </div>
    </div>
  );
};

export default BatchesListPage;
// src/features/enrollments/pages/EnrollmentsListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Filter,
  Layers3,
  BookOpen,
  User,
  Users,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { fetchBatches } from "../../batches/api/batchesApi";

const EnrollmentsListPage = () => {
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    mode: "all",
    page: 1,
    limit: 10,
  });

  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBatches = async (override = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        status: filters.status,
        mode: filters.mode,
        q: filters.q,
        page: filters.page,
        limit: filters.limit,
        ...override,
      };
      const { items, pagination } = await fetchBatches(params);
      setBatches(items || []);
      setPagination(
        pagination || {
          page: params.page,
          limit: params.limit,
          total: items?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error("Error fetching batches for enrollments:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load batches.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches({ page: 1 });
  };

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      (pagination.totalPages && nextPage > pagination.totalPages)
    ) {
      return;
    }
    setFilters((prev) => ({ ...prev, page: nextPage }));
    loadBatches({ page: nextPage });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    const next = {
      q: "",
      status: "all",
      mode: "all",
      page: 1,
      limit: 10,
    };
    setFilters(next);
    loadBatches(next);
  };

  return (
    <div className="nk-block">
      {/* HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              <ClipboardList size={20} className="me-1" />
              Enrollment Management
            </h3>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Choose a batch to view and manage its enrollments. All
                enrollment actions are batch-scoped, but you have a dedicated
                Enrollment menu here.
              </p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="nk-block-tools">
              <ul className="nk-block-tools g-3">
                <li>
                  <button
                    type="button"
                    className="btn btn-outline-light d-none d-sm-inline-flex"
                    onClick={resetFilters}
                    disabled={loading}
                  >
                    <RefreshCw size={16} className="me-1" />
                    Reset Filters
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate("/admin/enrolments/new")}
                  >
                    <Users size={16} className="me-1" />
                    Enroll a Learner
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="nk-block">
        <div className="card card-bordered mb-3">
          <div className="card-inner">
            <form
              className="row g-3 align-items-end"
              onSubmit={handleSearchSubmit}
            >
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">
                    Search Batches / Courses
                  </label>
                  <div className="form-control-wrap">
                    <div className="form-icon form-icon-left">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Batch name, course, educator..."
                      value={filters.q}
                      name="q"
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Batch Status</label>
                  <div className="form-control-wrap">
                    <select
                      className="form-select"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="all">All</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <div className="form-control-wrap">
                    <select
                      className="form-select"
                      name="mode"
                      value={filters.mode}
                      onChange={handleFilterChange}
                    >
                      <option value="all">All</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-outline-primary w-100"
                  disabled={loading}
                >
                  <Filter size={16} className="me-1" />
                  Filter
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* TABLE */}
        <div className="card card-bordered">
          <div className="card-inner p-0">
            <div className="nk-tb-list nk-tb-ulist">
              <div className="nk-tb-item nk-tb-head">
                <div className="nk-tb-col">
                  <span className="sub-text">Batch</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Course</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Educator</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Enrollments</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Status / Mode</span>
                </div>
                <div className="nk-tb-col nk-tb-col-tools text-end">
                  <span className="sub-text">Actions</span>
                </div>
              </div>

              {loading ? (
                <div className="nk-tb-item">
                  <div className="nk-tb-col text-center py-4">
                    <div className="spinner-border spinner-border-sm me-1" />
                    Loading batches...
                  </div>
                </div>
              ) : batches.length === 0 ? (
                <div className="nk-tb-item">
                  <div className="nk-tb-col text-center py-4">
                    No batches found. Create a batch first to manage
                    enrollments.
                  </div>
                </div>
              ) : (
                batches.map((b) => (
                  <div className="nk-tb-item" key={b.id}>
                    <div className="nk-tb-col">
                      <div className="d-flex flex-column">
                        <span className="fw-semibold small">
                          {b.name}
                        </span>
                        <span className="text-soft small">
                          Code: {b.code || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <div className="d-flex align-items-center small">
                        <BookOpen size={14} className="me-1" />
                        <span>
                          {b.courseTitle ||
                            b.courseName ||
                            b.course?.title ||
                            "Course"}
                        </span>
                      </div>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <div className="d-flex align-items-center small">
                        <User size={14} className="me-1" />
                        <span>
                          {b.educatorName ||
                            b.educatorFullName ||
                            b.educator?.name ||
                            "Educator"}
                        </span>
                      </div>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <div className="small">
                        <Users size={14} className="me-1" />
                        {b.enrollmentCount || 0}{" "}
                        {b.capacity
                          ? `/ ${b.capacity}`
                          : "(no limit)"}
                      </div>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <div className="d-flex flex-column small">
                        <span className="text-capitalize">
                          Status: {b.status}
                        </span>
                        <span className="text-capitalize text-soft">
                          Mode: {b.mode}
                        </span>
                      </div>
                    </div>

                    <div className="nk-tb-col nk-tb-col-tools text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          navigate(`/admin/batches/${b.id}/enrollments`)
                        }
                      >
                        <Layers3 size={14} className="me-1" />
                        Manage Enrollments
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="card-inner border-top d-flex justify-content-between align-items-center">
            <div className="small text-soft">
              Page {pagination.page} of {pagination.totalPages || 1} •{" "}
              Total {pagination.total} batches
            </div>
            <ul className="pagination pagination-sm mb-0">
              <li
                className={`page-item ${
                  pagination.page <= 1 ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Prev
                </button>
              </li>
              <li
                className={`page-item ${
                  pagination.page >= (pagination.totalPages || 1)
                    ? "disabled"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentsListPage;

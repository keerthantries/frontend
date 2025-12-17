// src/features/Courses/CoursesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  ListTree,
  Layers3,
  PlayCircle,
  Trash2,
  Filter,
} from "lucide-react";
import { fetchCourses, deleteCourse } from "./api/coursesApi";

import { FaPlus } from "react-icons/fa";
import { FiMoreVertical, FiEye, FiTrash2, FiEdit } from "react-icons/fi";
import { HiOutlineSearch } from "react-icons/hi";

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const CoursesList = () => {
  const navigate = useNavigate();

  // --- newer logic/state preserved exactly ---
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  // debounce search (same timing and behaviour as newer file)
  useEffect(() => {
    const handle = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // fetch courses (preserve exactly)
  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchCourses({
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter === "all" ? undefined : statusFilter,
          category: categoryFilter === "all" ? undefined : categoryFilter,
          level: levelFilter === "all" ? undefined : levelFilter,
          tag: tagFilter || undefined,
          q: debouncedSearch || undefined,
        });

        if (!isMounted) return;

        const items = result.items || [];
        const pag = result.pagination || {};

        setCourses(items);
        setPagination((prev) => ({
          ...prev,
          page: pag.page ?? prev.page,
          limit: pag.limit ?? prev.limit,
          total: pag.total ?? items.length,
          totalPages: pag.totalPages ?? prev.totalPages ?? 1,
        }));
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching courses:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load courses.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [
    pagination.page,
    pagination.limit,
    statusFilter,
    categoryFilter,
    levelFilter,
    tagFilter,
    debouncedSearch,
  ]);

  const handleChangePage = (page) => {
    if (page < 1 || page > (pagination.totalPages || 1)) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  // preserve newer delete behaviour exactly (uses actionLoadingId and removes by course.id)
  const handleDeleteCourse = async (courseId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this course? This will also delete its sections and lessons."
    );
    if (!ok) return;

    try {
      setActionLoadingId(courseId);
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error("Delete course error:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete course."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const distinctCategories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [courses]);

  const distinctLevels = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.level) set.add(c.level);
    });
    return Array.from(set);
  }, [courses]);

  const handleCreateBatch = (course, mode) => {
    // preserve newer behaviour using course.id
    navigate("/admin/batches/add", {
      state: {
        courseId: course.id,
        courseTitle: course.title,
        preferredMode: mode,
      },
    });
  };

  // ---------- helper functions older layout expects (pure-read) ----------
  const getCourseId = (course) => course.id || course._id || course.courseId;

  const getInitials = (title) => {
    if (!title) return "C";
    return title
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getPriceLabel = (course) => {
    const pricing = course.pricing || {};
    const isFree = pricing.isFree ?? course.isFree ?? false;
    const rawPrice = pricing.price ?? course.price ?? 0;
    const numPrice = Number(rawPrice);

    if (isFree || !numPrice || numPrice === 0) {
      return "Free";
    }

    return `₹${numPrice.toLocaleString("en-IN")}`;
  };

  const getApprovalLabel = (course) => {
    const raw =
      course.approvalStatus ||
      (course.approval && (course.approval.state || course.approval.status)) ||
      "";
    const normalized = String(raw || "").toLowerCase();

    if (!normalized || normalized === "pending") return "Pending";
    if (normalized === "approved") return "Approved";
    if (normalized === "rejected") return "Rejected";
    if (normalized === "in-review" || normalized === "review") return "In Review";

    return raw || "Pending";
  };

  const getApprovalBadgeClass = (label) => {
    const s = String(label || "").toLowerCase();
    if (s === "approved") return "badge-dim bg-success";
    if (s === "rejected") return "badge-dim bg-danger";
    if (s === "in review" || s === "in-review") return "badge-dim bg-info";
    return "badge-dim bg-warning";
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "published") return "badge-dim bg-success";
    if (s === "draft") return "badge-dim bg-warning";
    if (s === "archived") return "badge-dim bg-secondary";
    return "badge-dim bg-light text-muted";
  };

  const totalCourses = pagination.total ?? courses.length;

  // ---------- Render: older styles/layout but using newer logic/state ----------
  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* HEADER (older look) */}
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">Courses</h3>
                <div className="nk-block-des text-soft">
                  <p>You have total {totalCourses} courses.</p>
                </div>
              </div>

              <div className="nk-block-head-content">
                <div className="toggle-wrap nk-block-tools-toggle">
                  <button
                    type="button"
                    className="btn btn-icon btn-trigger toggle-expand me-n1"
                    data-target="courses-more-options"
                  >
                    <FiMoreVertical className="icon" />
                  </button>
                  <div
                    className="toggle-expand-content"
                    data-content="courses-more-options"
                  >
                    <ul className="nk-block-tools g-3">
                      <li>
                        <div className="form-control-wrap">
                          <div className="form-icon form-icon-left">
                            <HiOutlineSearch className="icon" />
                          </div>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </li>

                      <li>
                        <div className="dropdown">
                          <button
                            type="button"
                            className="btn btn-outline-light dropdown-toggle"
                            data-bs-toggle="dropdown"
                          >
                            {statusFilter === "all"
                              ? "All Status"
                              : statusFilter.charAt(0).toUpperCase() +
                                statusFilter.slice(1)}
                          </button>
                          <div className="dropdown-menu dropdown-menu-end">
                            {["all", "draft", "published", "archived"].map(
                              (st) => (
                                <button
                                  key={st}
                                  type="button"
                                  className={`dropdown-item ${
                                    statusFilter === st ? "active" : ""
                                  }`}
                                  onClick={() => setStatusFilter(st)}
                                >
                                  {st === "all"
                                    ? "All"
                                    : st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </li>

                      <li className="nk-block-tools-opt">
                        <button
                          type="button"
                          className="btn btn-primary d-md-none"
                          onClick={() => navigate("/admin/courses/add")}
                        >
                          <FaPlus className="icon" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary d-none d-md-inline-flex"
                          onClick={() => navigate("/admin/courses/add")}
                        >
                          <FaPlus className="icon me-1" />
                          <span>Add Course</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS CARD (use newer controls but keep older container above) */}
          <div className="nk-block">
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
                        placeholder="Title, tags, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">
                      Track / Category{" "}
                    </label>
                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="FOUNDATION">FOUNDATION</option>
                      <option value="FULL">FULL</option>
                      <option value="EXAM">EXAM</option>
                      {distinctCategories
                        .filter(
                          (c) => !["FOUNDATION", "FULL", "EXAM"].includes(c)
                        )
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Level</label>
                    <select
                      className="form-select"
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      {distinctLevels
                        .filter(
                          (l) =>
                            !["beginner", "intermediate", "advanced"].includes(l)
                        )
                        .map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      Tag filter{" "}
                      <span className="text-soft small">(e.g. fswd, foundation)</span>
                    </label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        className="form-control"
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        placeholder="Tag name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIST CARD (older markup + newer list columns/actions) */}
            <div className="nk-tb-list is-separate mb-3">
              {/* HEAD */}
              <div className="nk-tb-item nk-tb-head">
                <div className="nk-tb-col nk-tb-col-check">
                  <div className="custom-control custom-control-sm custom-checkbox notext">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="course-all"
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="course-all"
                    />
                  </div>
                </div>

                <div className="nk-tb-col">
                  <span className="sub-text">Course</span>
                </div>

                <div className="nk-tb-col tb-col-lg">
                  <span className="sub-text">Category</span>
                </div>

                <div className="nk-tb-col tb-col-mb">
                  <span className="sub-text">Level</span>
                </div>

                <div className="nk-tb-col tb-col-lg">
                  <span className="sub-text">Courses by</span>
                </div>

                <div className="nk-tb-col tb-col-lg">
                  <span className="sub-text">Lessons Planned</span>
                </div>

                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Status</span>
                </div>

                {/* Removed Approval column per request */}

                <div className="nk-tb-col tb-col-mb">
                  <span className="sub-text">Price</span>
                </div>

                <div className="nk-tb-col tb-col-lg">
                  <span className="sub-text">Created</span>
                </div>

                <div className="nk-tb-col nk-tb-col-tools">
                  <span className="sub-text">Actions</span>
                </div>
              </div>

              {/* STATES */}
              {loading && (
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span>Loading courses…</span>
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="text-danger">{error}</span>
                  </div>
                </div>
              )}

              {!loading && !error && courses.length === 0 && (
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span>No courses found.</span>
                  </div>
                </div>
              )}

              {/* ROWS */}
              {!loading &&
                !error &&
                courses.map((course) => {
                  const id = getCourseId(course);
                  const initials = getInitials(course.title);
                  const status = course.status || "draft";
                  const category = course.category || "-";
                  const level = course.level || "-";
                  const instructor =
                    course.instructorName || course.instructor || "Admin";
                  const lessons =
                    course.totalLessonsPlanned ??
                    course.lessonsCount ??
                    course.totalLessons ??
                    0;
                  const createdAt = formatDate(course.createdAt);

                  const priceLabel = getPriceLabel(course);
                  const approvalLabel = getApprovalLabel(course);

                  const handleRowClick = () => {
                    if (!id) return;
                    navigate(`/admin/courses/${id}/preview`);
                  };

                  return (
                    <div
                      className="nk-tb-item"
                      key={id || course.title}
                      style={{ cursor: "pointer" }}
                      onClick={handleRowClick}
                    >
                      <div
                        className="nk-tb-col nk-tb-col-check"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="custom-control custom-control-sm custom-checkbox notext">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id={`course-${id}`}
                          />
                          <label
                            className="custom-control-label"
                            htmlFor={`course-${id}`}
                          />
                        </div>
                      </div>

                      {/* Course name + subtitle */}
                      <div className="nk-tb-col">
                        <div className="user-card">
                          <div className="user-avatar bg-purple">
                            <span>{initials}</span>
                          </div>
                          <div className="user-info">
                            <span className="tb-lead">
                              {course.title || "-"}
                            </span>
                            <span className="text-soft">
                              {course.subtitle || category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="nk-tb-col tb-col-lg">
                        <span>{category}</span>
                      </div>

                      {/* Level */}
                      <div className="nk-tb-col tb-col-mb">
                        <span className="tb-amount text-capitalize">{level}</span>
                      </div>

                      {/* Instructor */}
                      <div className="nk-tb-col tb-col-lg">
                        <span>{instructor}</span>
                      </div>

                      {/* Lessons planned */}
                      <div className="nk-tb-col tb-col-lg">
                        <span>{lessons === "-" ? "-" : `${lessons}`}</span>
                      </div>

                      {/* Status */}
                      <div className="nk-tb-col tb-col-md">
                        <span className={`badge ${getStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </div>

                      {/* Approval column removed from rows */}

                      {/* Price */}
                      <div className="nk-tb-col tb-col-mb">
                        <span>{priceLabel}</span>
                      </div>

                      {/* Created */}
                      <div className="nk-tb-col tb-col-lg">
                        <span>{createdAt}</span>
                      </div>

                      {/* Actions */}
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
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() =>
                                    navigate(`/admin/courses/${id}/preview`)
                                  }
                                >
                                  <FiEye className="icon me-1" />
                                  <span>Preview</span>
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() =>
                                    navigate(`/admin/courses/${id}/curriculum`)
                                  }
                                >
                                  <FiEdit className="icon me-1" />
                                  <span>Edit Curriculum</span>
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDeleteCourse(id)}
                                  disabled={actionLoadingId === id}
                                >
                                  <FiTrash2 className="icon me-1" />
                                  <span>
                                    {actionLoadingId === id
                                      ? "Deleting..."
                                      : "Delete Course"}
                                  </span>
                                </button>
                              </li>

                              <li className="dropdown-divider" />
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => handleCreateBatch(course, "online")}
                                >
                                  <PlayCircle size={14} className="me-1" />
                                  <span>Create Online Batch</span>
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => handleCreateBatch(course, "offline")}
                                >
                                  <Layers3 size={14} className="me-1" />
                                  <span>Create Offline Batch</span>
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => handleCreateBatch(course, "hybrid")}
                                >
                                  <Layers3 size={14} className="me-1" />
                                  <span>Create Hybrid Batch</span>
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

            {/* PAGINATION (older style, newer pagination state preserved) */}
            <div className="card">
              <div className="card-inner">
                <div className="nk-block-between-md g-3">
                  <div className="g">
                    <ul className="pagination justify-content-center justify-content-md-start">
                      <li
                        className={`page-item ${
                          pagination.page <= 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          type="button"
                          onClick={() => handleChangePage(pagination.page - 1)}
                        >
                          Prev
                        </button>
                      </li>
                      <li className="page-item">
                        <span className="page-link">
                          Page {pagination.page} of {pagination.totalPages || 1}
                        </span>
                      </li>
                      <li
                        className={`page-item ${
                          pagination.page >= (pagination.totalPages || 1)
                            ? "disabled"
                            : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          type="button"
                          onClick={() => handleChangePage(pagination.page + 1)}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="g">
                    <div className="pagination-goto d-flex justify-content-center justify-content-md-start gx-3">
                      <div>Page</div>
                      <div>
                        <input
                          type="number"
                          min="1"
                          max={pagination.totalPages || 1}
                          className="form-control"
                          value={pagination.page}
                          onChange={(e) =>
                            handleChangePage(Number(e.target.value) || 1)
                          }
                          style={{ width: "80px" }}
                        />
                      </div>
                      <div>of {pagination.totalPages || 1}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* END PAGINATION */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesList;

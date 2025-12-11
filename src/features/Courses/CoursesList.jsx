// src/features/Courses/pages/CoursesList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCourses, deleteCourse } from "./api/coursesApi";

import { FaPlus } from "react-icons/fa";
import { FiMoreVertical, FiEye, FiTrash2, FiEdit } from "react-icons/fi";
import { HiOutlineSearch } from "react-icons/hi";

const CoursesList = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search like UserListScreen
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter && statusFilter !== "All") {
        params.status = statusFilter.toLowerCase();
      }

      if (debouncedSearch) {
        params.q = debouncedSearch;
      }

      const { data } = await fetchCourses(params);

      const items = data.items || data.courses || [];
      const total = data.total ?? data.totalItems ?? items.length;
      const totalPages =
        data.totalPages ??
        Math.max(1, Math.ceil(total / (pagination.limit || 10)));

      setCourses(items);
      setPagination((prev) => ({
        ...prev,
        total,
        totalPages,
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearch]);

  const handleChangePage = (newPage) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleDeleteCourse = async (courseId) => {
    const ok = window.confirm(
      "Delete this course and all its curriculum? This cannot be undone."
    );
    if (!ok) return;

    try {
      setLoading(true);
      await deleteCourse(courseId);
      await loadCourses();
    } catch (err) {
      console.error(err);
      setError("Failed to delete course");
    } finally {
      setLoading(false);
    }
  };

  const totalCourses = pagination.total ?? courses.length;

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "published") return "badge-dim bg-success";
    if (s === "draft") return "badge-dim bg-warning";
    if (s === "archived") return "badge-dim bg-secondary";
    return "badge-dim bg-light text-muted";
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
      (course.approval &&
        (course.approval.state || course.approval.status)) ||
      "";
    const normalized = String(raw || "").toLowerCase();

    if (!normalized || normalized === "pending") return "Pending";
    if (normalized === "approved") return "Approved";
    if (normalized === "rejected") return "Rejected";
    if (normalized === "in-review" || normalized === "review")
      return "In Review";

    return raw || "Pending";
  };

  const getApprovalBadgeClass = (label) => {
    const s = String(label || "").toLowerCase();
    if (s === "approved") return "badge-dim bg-success";
    if (s === "rejected") return "badge-dim bg-danger";
    if (s === "in review" || s === "in-review") return "badge-dim bg-info";
    return "badge-dim bg-warning";
  };

  const getCourseId = (course) =>
    course.id || course._id || course.courseId;

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

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* HEADER */}
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
                            {statusFilter === "All"
                              ? "All Status"
                              : statusFilter}
                          </button>
                          <div className="dropdown-menu dropdown-menu-end">
                            {["All", "Draft", "Published", "Archived"].map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className={`dropdown-item ${
                                    statusFilter === status ? "active" : ""
                                  }`}
                                  onClick={() => setStatusFilter(status)}
                                >
                                  {status}
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

          {/* TABLE */}
          <div className="nk-block">
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

                {/* Lessons planned */}
                <div className="nk-tb-col tb-col-lg">
                  <span className="sub-text">Lessons Planned</span>
                </div>

                {/* Status */}
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Status</span>
                </div>

                {/* Approval */}
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Approval</span>
                </div>

                {/* Price */}
                <div className="nk-tb-col tb-col-mb">
                  <span className="sub-text">Price</span>
                </div>

                {/* Created */}
                <div className="nk-tb-col tb-col-lg">
                  <span className="sub-text">Created</span>
                </div>

                {/* Actions */}
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
                    "-";
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
                      key={id}
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
                        <span className="tb-amount text-capitalize">
                          {level}
                        </span>
                      </div>

                      {/* Instructor */}
                      <div className="nk-tb-col tb-col-lg">
                        <span>{instructor}</span>
                      </div>

                      {/* Lessons planned */}
                      <div className="nk-tb-col tb-col-lg">
                        <span>
                          {lessons === "-" ? "-" : `${lessons}`}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="nk-tb-col tb-col-md">
                        <span
                          className={`badge ${getStatusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      {/* Approval */}
                      <div className="nk-tb-col tb-col-md">
                        <span
                          className={`badge ${getApprovalBadgeClass(
                            approvalLabel
                          )}`}
                        >
                          {approvalLabel}
                        </span>
                      </div>

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
                                    navigate(
                                      `/admin/courses/${id}/curriculum`
                                    )
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
                                >
                                  <FiTrash2 className="icon me-1" />
                                  <span>Delete Course</span>
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
                          onClick={() =>
                            handleChangePage(pagination.page - 1)
                          }
                        >
                          Prev
                        </button>
                      </li>
                      <li className="page-item">
                        <span className="page-link">
                          Page {pagination.page} of{" "}
                          {pagination.totalPages || 1}
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
                          onClick={() =>
                            handleChangePage(pagination.page + 1)
                          }
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
                            handleChangePage(
                              Number(e.target.value) || 1
                            )
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

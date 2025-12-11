// src/features/batches/pages/BatchDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBatchById,
  updateBatch,
  changeBatchStatus,
  listBatchEnrollments,
  enrollLearner,
} from "../api/batchesApi";
import { listBatchAttendanceSummary } from "../api/attendanceApi";
import { searchLearners } from "../api/lookupApi";
import EnrollmentCsvUploadPanel from "../components/EnrollmentCsvUploadPanel";

const STATUS_OPTIONS = [
  "draft",
  "published",
  "ongoing",
  "completed",
  "cancelled",
];

const statusBadgeClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "published":
      return "badge badge-dim bg-success";
    case "ongoing":
      return "badge badge-dim bg-primary";
    case "completed":
      return "badge badge-dim bg-info";
    case "cancelled":
      return "badge badge-dim bg-danger";
    case "draft":
    default:
      return "badge badge-dim bg-warning";
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const BatchDetailPage = () => {
  const { id: batchIdParam } = useParams();
  const navigate = useNavigate();
  const batchId = batchIdParam;

  const [batch, setBatch] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [batchError, setBatchError] = useState("");

  const [activeTab, setActiveTab] = useState("details");

  // Enrollments
  const [enrollments, setEnrollments] = useState([]);
  const [enrollPagination, setEnrollPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // Attendance summary
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendancePagination, setAttendancePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  // Manual enroll form
  const [learnerQuery, setLearnerQuery] = useState("");
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [enrollStartDate, setEnrollStartDate] = useState("");
  const [enrollExpiryDate, setEnrollExpiryDate] = useState("");
  const [enrollNotes, setEnrollNotes] = useState("");
  const [manualEnrollLoading, setManualEnrollLoading] = useState(false);

  const [savingBatch, setSavingBatch] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  const showSuccess = (msg) => {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(""), 2000);
  };

  const showError = (msg) => {
    setGlobalError(msg);
    setTimeout(() => setGlobalError(""), 3000);
  };

  const loadBatch = async () => {
    try {
      setLoadingBatch(true);
      setBatchError("");
      const { data } = await getBatchById(batchId);
      setBatch(data || null);
    } catch (err) {
      console.error(err);
      setBatchError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load batch."
      );
    } finally {
      setLoadingBatch(false);
    }
  };

  const loadEnrollments = async (page = 1) => {
    if (!batchId) return;
    try {
      setLoadingEnrollments(true);
      setEnrollError("");
      const { data } = await listBatchEnrollments(batchId, {
        page,
        limit: enrollPagination.limit,
      });
      setEnrollments(data.items || []);
      setEnrollPagination(
        data.pagination || {
          page,
          limit: enrollPagination.limit,
          total: data.items?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(err);
      setEnrollError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load enrollments."
      );
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const loadAttendance = async (page = 1) => {
    if (!batchId) return;
    try {
      setLoadingAttendance(true);
      setAttendanceError("");
      const { data } = await listBatchAttendanceSummary(batchId, {
        page,
        limit: attendancePagination.limit,
      });
      setAttendanceRows(data.items || []);
      setAttendancePagination(
        data.pagination || {
          page,
          limit: attendancePagination.limit,
          total: data.items?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(err);
      setAttendanceError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load attendance summary."
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    if (activeTab === "enrollments") {
      loadEnrollments(1);
    } else if (activeTab === "attendance") {
      loadAttendance(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, batchId]);

  const handleStatusChange = async (newStatus) => {
    if (!batch) return;
    if (!window.confirm(`Change status to '${newStatus}'?`)) return;
    try {
      setStatusChanging(true);
      const { data } = await changeBatchStatus(batch.id || batch._id, {
        status: newStatus,
      });
      setBatch(data);
      showSuccess("Batch status updated.");
    } catch (err) {
      console.error(err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update status."
      );
    } finally {
      setStatusChanging(false);
    }
  };

  const handleBasicUpdate = async () => {
    if (!batch) return;
    try {
      setSavingBatch(true);
      const payload = {
        name: batch.name,
        code: batch.code || null,
        capacity: batch.capacity ?? 0,
        startDate: batch.startDate || null,
        endDate: batch.endDate || null,
      };
      const { data } = await updateBatch(batch.id || batch._id, payload);
      setBatch(data);
      showSuccess("Batch details updated.");
    } catch (err) {
      console.error(err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update batch."
      );
    } finally {
      setSavingBatch(false);
    }
  };

  // Manual enrollment
  const handleLearnerSearch = async (value) => {
    setLearnerQuery(value);
    try {
      const { data } = await searchLearners({
        q: value,
        page: 1,
        limit: 10,
      });
      setLearnerOptions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualEnroll = async () => {
    if (!selectedLearner) {
      showError("Please select a learner.");
      return;
    }
    try {
      setManualEnrollLoading(true);
      const payload = {
        learnerId: selectedLearner.id || selectedLearner._id,
        startDate: enrollStartDate
          ? new Date(enrollStartDate).toISOString()
          : null,
        expiryDate: enrollExpiryDate
          ? new Date(enrollExpiryDate).toISOString()
          : null,
        notes: enrollNotes || null,
      };
      await enrollLearner(batchId, payload);
      showSuccess("Learner enrolled successfully.");
      setSelectedLearner(null);
      setLearnerQuery("");
      setEnrollStartDate("");
      setEnrollExpiryDate("");
      setEnrollNotes("");
      loadEnrollments(enrollPagination.page);
    } catch (err) {
      console.error(err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to enroll learner."
      );
    } finally {
      setManualEnrollLoading(false);
    }
  };

  if (loadingBatch) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="p-4">Loading batch…</div>
          </div>
        </div>
      </div>
    );
  }

  if (batchError && !batch) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="p-4">
              <div className="alert alert-danger mb-3">{batchError}</div>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/admin/batches")}
              >
                Back to Batches
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="p-4">
              Batch not found.
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate("/admin/batches")}
                >
                  Back to Batches
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const id = batch.id || batch._id;

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* Header */}
          <div className="nk-block-head nk-block-head-sm mb-3">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">
                  Batch /{" "}
                  <strong className="text-primary small">{batch.name}</strong>
                </h3>
                <div className="nk-block-des text-soft">
                  <p>
                    Manage enrollments and monitor attendance for this batch.
                  </p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <div className="d-flex flex-column align-items-end gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`${statusBadgeClass(
                        batch.status
                      )} text-capitalize`}
                    >
                      {batch.status || "draft"}
                    </span>
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary dropdown-toggle"
                        data-bs-toggle="dropdown"
                        disabled={statusChanging}
                      >
                        Change Status
                      </button>
                      <div className="dropdown-menu dropdown-menu-end">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="dropdown-item text-capitalize"
                            onClick={() => handleStatusChange(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate("/admin/batches")}
                  >
                    Back to Batches
                  </button>
                </div>
              </div>
            </div>
          </div>

          {globalError && (
            <div className="alert alert-danger mb-2 py-2">{globalError}</div>
          )}
          {globalSuccess && (
            <div className="alert alert-success mb-2 py-2">
              {globalSuccess}
            </div>
          )}

          {/* Top summary card */}
          <div className="nk-block mb-3">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="row g-3 align-items-center">
                  <div className="col-md-4">
                    <h5 className="mb-1">{batch.name}</h5>
                    <div className="text-soft small">
                      Code: {batch.code || "-"}
                    </div>
                    <div className="text-soft small">
                      Course: {batch.courseName || "-"}
                    </div>
                    <div className="text-soft small">
                      Mode:{" "}
                      <span className="text-capitalize">
                        {batch.mode || "-"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-soft mb-1">Schedule</div>
                    <div className="small">
                      {batch.schedule?.daysOfWeek?.join(", ") || "-"} ·{" "}
                      {batch.schedule?.startTime || "--:--"} -{" "}
                      {batch.schedule?.endTime || "--:--"} (
                      {batch.schedule?.timeZone || "Asia/Kolkata"})
                    </div>
                    <div className="small mt-1">
                      Start: {formatDate(batch.startDate)} · End:{" "}
                      {formatDate(batch.endDate)}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex justify-content-md-end">
                      <div className="text-end">
                        <div className="small text-soft">Educator</div>
                        <div className="small">
                          {batch.educatorName ||
                            batch.educatorEmail ||
                            "-"}
                        </div>
                        <div className="small text-soft mt-1">
                          Capacity: {batch.capacity ?? "-"} · Enrolled:{" "}
                          {batch.enrollmentCount ?? 0}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={handleBasicUpdate}
                          disabled={savingBatch}
                        >
                          {savingBatch ? "Saving…" : "Save Basic Details"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs nav-tabs-mb border-bottom mb-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "details" ? "active" : ""
                }`}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "enrollments" ? "active" : ""
                }`}
                onClick={() => setActiveTab("enrollments")}
              >
                Enrollments
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "attendance" ? "active" : ""
                }`}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance
              </button>
            </li>
          </ul>

          {/* Tab content */}
          <div className="nk-block">
            {activeTab === "details" && (
              <div className="row g-3">
                <div className="col-xl-6">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title mb-3">Batch Info</h6>
                      <dl className="row gy-2 small">
                        <dt className="col-sm-4">Name</dt>
                        <dd className="col-sm-8">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={batch.name || ""}
                            onChange={(e) =>
                              setBatch((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </dd>

                        <dt className="col-sm-4">Code</dt>
                        <dd className="col-sm-8">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={batch.code || ""}
                            onChange={(e) =>
                              setBatch((prev) => ({
                                ...prev,
                                code: e.target.value,
                              }))
                            }
                          />
                        </dd>

                        <dt className="col-sm-4">Start Date</dt>
                        <dd className="col-sm-8">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={
                              batch.startDate
                                ? new Date(batch.startDate)
                                    .toISOString()
                                    .slice(0, 10)
                                : ""
                            }
                            onChange={(e) =>
                              setBatch((prev) => ({
                                ...prev,
                                startDate: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              }))
                            }
                          />
                        </dd>

                        <dt className="col-sm-4">End Date</dt>
                        <dd className="col-sm-8">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={
                              batch.endDate
                                ? new Date(batch.endDate)
                                    .toISOString()
                                    .slice(0, 10)
                                : ""
                            }
                            onChange={(e) =>
                              setBatch((prev) => ({
                                ...prev,
                                endDate: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              }))
                            }
                          />
                        </dd>

                        <dt className="col-sm-4">Capacity</dt>
                        <dd className="col-sm-8">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={batch.capacity ?? ""}
                            min="1"
                            onChange={(e) =>
                              setBatch((prev) => ({
                                ...prev,
                                capacity: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </dd>

                        <dt className="col-sm-4">Created At</dt>
                        <dd className="col-sm-8">
                          {formatDateTime(batch.createdAt)}
                        </dd>
                        <dt className="col-sm-4">Updated At</dt>
                        <dd className="col-sm-8">
                          {formatDateTime(batch.updatedAt)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="col-xl-6">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title mb-3">Attendance Rules</h6>
                      <p className="small text-soft mb-2">
                        Attendance is mandatory for this batch. Actual marking
                        will be handled from the Educator and Learner modules:
                      </p>
                      <ul className="small text-soft">
                        <li>
                          <strong>Online:</strong> Attendance will be derived
                          from live session presence / course progress.
                        </li>
                        <li>
                          <strong>Offline:</strong> Learners must scan a QR code
                          in the classroom to mark present.
                        </li>
                        <li>
                          <strong>Hybrid:</strong> Both mechanisms apply,
                          depending on session type.
                        </li>
                      </ul>
                      <p className="small mb-0">
                        As an admin, you can monitor summary data in the{" "}
                        <strong>Attendance</strong> tab.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "enrollments" && (
              <div className="row g-3">
                <div className="col-xl-5">
                  {/* Manual enroll */}
                  <div className="card card-bordered mb-3">
                    <div className="card-inner">
                      <h6 className="card-title mb-3">Manual Enroll</h6>
                      <div className="mb-2">
                        <label className="form-label">
                          Learner (search by name/email)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Type to search learners…"
                          value={learnerQuery}
                          onChange={(e) =>
                            handleLearnerSearch(e.target.value)
                          }
                        />
                        {learnerOptions.length > 0 && (
                          <select
                            className="form-select mt-2"
                            value={
                              selectedLearner
                                ? selectedLearner.id || selectedLearner._id
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              const found = learnerOptions.find(
                                (u) => (u.id || u._id) === value
                              );
                              setSelectedLearner(found || null);
                            }}
                          >
                            <option value="">Select learner</option>
                            {learnerOptions.map((u) => {
                              const id = u.id || u._id;
                              return (
                                <option key={id} value={id}>
                                  {u.name || u.fullName || u.email}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label">Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={enrollStartDate}
                            onChange={(e) =>
                              setEnrollStartDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={enrollExpiryDate}
                            onChange={(e) =>
                              setEnrollExpiryDate(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={enrollNotes}
                          onChange={(e) => setEnrollNotes(e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleManualEnroll}
                        disabled={manualEnrollLoading}
                      >
                        {manualEnrollLoading
                          ? "Enrolling…"
                          : "Enroll Learner"}
                      </button>
                    </div>
                  </div>

                  {/* CSV bulk enroll */}
                  <EnrollmentCsvUploadPanel
                    batchId={batchId}
                    onAfterImport={() =>
                      loadEnrollments(enrollPagination.page)
                    }
                  />
                </div>

                <div className="col-xl-7">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title mb-3">
                        Enrollments ({batch.enrollmentCount ?? 0})
                      </h6>

                      {loadingEnrollments && (
                        <div className="py-3 small">Loading…</div>
                      )}
                      {enrollError && !loadingEnrollments && (
                        <div className="alert alert-danger py-2 mb-2">
                          {enrollError}
                        </div>
                      )}
                      {!loadingEnrollments &&
                        !enrollError &&
                        enrollments.length === 0 && (
                          <div className="py-3 small text-soft">
                            No enrollments yet.
                          </div>
                        )}

                      {!loadingEnrollments &&
                        !enrollError &&
                        enrollments.length > 0 && (
                          <>
                            <div className="table-responsive">
                              <table className="table table-sm">
                                <thead>
                                  <tr className="small text-soft">
                                    <th>Learner</th>
                                    <th>Status</th>
                                    <th>Source</th>
                                    <th>Start</th>
                                    <th>Expiry</th>
                                    <th>Notes</th>
                                    <th>Enrolled At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {enrollments.map((en) => (
                                    <tr key={en.id || en._id}>
                                      <td>
                                        <span className="small">
                                          {en.learnerName ||
                                            en.learnerEmail ||
                                            en.learnerId}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="badge badge-dim bg-outline-primary text-capitalize">
                                          {en.status || "confirmed"}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="small text-capitalize">
                                          {en.source || "admin"}
                                        </span>
                                      </td>
                                      <td className="small">
                                        {formatDate(en.startDate)}
                                      </td>
                                      <td className="small">
                                        {formatDate(en.expiryDate)}
                                      </td>
                                      <td className="small text-truncate">
                                        {en.notes || "-"}
                                      </td>
                                      <td className="small">
                                        {formatDateTime(en.enrolledAt)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-2 small">
                              <div>
                                Showing page {enrollPagination.page} of{" "}
                                {enrollPagination.totalPages}
                              </div>
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className="btn btn-outline-light"
                                  onClick={() =>
                                    loadEnrollments(
                                      enrollPagination.page - 1
                                    )
                                  }
                                  disabled={enrollPagination.page <= 1}
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-light"
                                  onClick={() =>
                                    loadEnrollments(
                                      enrollPagination.page + 1
                                    )
                                  }
                                  disabled={
                                    enrollPagination.page >=
                                    enrollPagination.totalPages
                                  }
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="row g-3">
                <div className="col-xl-12">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title mb-3">
                        Attendance Summary (read-only)
                      </h6>
                      <p className="small text-soft">
                        Attendance is recorded from Educator/Learner modules.
                        This view shows session-wise presence summary for this
                        batch.
                      </p>

                      {loadingAttendance && (
                        <div className="py-3 small">Loading…</div>
                      )}
                      {attendanceError && !loadingAttendance && (
                        <div className="alert alert-danger py-2 mb-2">
                          {attendanceError}
                        </div>
                      )}
                      {!loadingAttendance &&
                        !attendanceError &&
                        attendanceRows.length === 0 && (
                          <div className="py-3 small text-soft">
                            No attendance records yet.
                          </div>
                        )}

                      {!loadingAttendance &&
                        !attendanceError &&
                        attendanceRows.length > 0 && (
                          <>
                            <div className="table-responsive">
                              <table className="table table-sm">
                                <thead>
                                  <tr className="small text-soft">
                                    <th>Date</th>
                                    <th>Mode</th>
                                    <th>Total Enrolled</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Recorded By</th>
                                    <th>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attendanceRows.map((row) => (
                                    <tr key={row.id || row._id}>
                                      <td className="small">
                                        {formatDate(row.date)}
                                      </td>
                                      <td className="small text-capitalize">
                                        {row.mode || "-"}
                                      </td>
                                      <td className="small">
                                        {row.totalEnrolled ?? "-"}
                                      </td>
                                      <td className="small text-success">
                                        {row.presentCount ?? 0}
                                      </td>
                                      <td className="small text-danger">
                                        {row.absentCount ?? 0}
                                      </td>
                                      <td className="small">
                                        {row.recordedBy || "-"}
                                      </td>
                                      <td className="small text-truncate">
                                        {row.notes || "-"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-2 small">
                              <div>
                                Showing page {attendancePagination.page} of{" "}
                                {attendancePagination.totalPages}
                              </div>
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className="btn btn-outline-light"
                                  onClick={() =>
                                    loadAttendance(
                                      attendancePagination.page - 1
                                    )
                                  }
                                  disabled={attendancePagination.page <= 1}
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-light"
                                  onClick={() =>
                                    loadAttendance(
                                      attendancePagination.page + 1
                                    )
                                  }
                                  disabled={
                                    attendancePagination.page >=
                                    attendancePagination.totalPages
                                  }
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* END nk-block */}
        </div>
      </div>
    </div>
  );
};

export default BatchDetailPage;

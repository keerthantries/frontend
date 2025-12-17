// src/features/batches/pages/BatchDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  User,
  Users,
  Clock,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Layers3,
  ClipboardList,
} from "lucide-react";
import {
  fetchBatchById,
  changeBatchStatus,
} from "../api/batchesApi";

const BatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // current user
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const currentRole = currentUser?.role;
  const canManageStatus =
    currentRole === "admin" || currentRole === "subOrgAdmin";

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState("draft");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadBatch() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const data = await fetchBatchById(id);
        if (!isMounted) return;
        setBatch(data);
        setStatusValue(data.status || "draft");
      } catch (err) {
        console.error("Error loading batch:", err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load batch details.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBatch();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "draft") return "badge bg-secondary-dim text-secondary";
    if (s === "published") return "badge bg-info-dim text-info";
    if (s === "ongoing") return "badge bg-success-dim text-success";
    if (s === "completed") return "badge bg-primary-dim text-primary";
    if (s === "cancelled") return "badge bg-danger-dim text-danger";
    return "badge bg-light text-muted";
  };

  const getModeBadgeClass = (mode) => {
    const m = (mode || "").toLowerCase();
    if (m === "online") return "badge bg-success-dim text-success";
    if (m === "offline") return "badge bg-warning-dim text-warning";
    if (m === "hybrid") return "badge bg-info-dim text-info";
    return "badge bg-light text-muted";
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!batch) return;
    if (!canManageStatus) {
      alert("You do not have permission to change batch status.");
      return;
    }

    setSavingStatus(true);
    setError("");
    setSuccess("");

    try {
      await changeBatchStatus(batch.id || id, statusValue);
      setSuccess("Batch status updated.");
      setBatch((prev) =>
        prev ? { ...prev, status: statusValue } : prev
      );
    } catch (err) {
      console.error("Status change error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update batch status.";
      setError(message);
    } finally {
      setSavingStatus(false);
    }
  };

  const courseLabel =
    batch?.courseTitle ||
    batch?.courseName ||
    batch?.course?.title ||
    "Linked course";

  const educatorLabel =
    batch?.educatorName ||
    batch?.educatorFullName ||
    batch?.educator?.name ||
    "Assigned educator";

  const days =
    batch?.schedule?.daysOfWeek?.join(", ") || "Not set";
  const startTime = batch?.schedule?.startTime || "--:--";
  const endTime = batch?.schedule?.endTime || "--:--";
  const timeZone = batch?.schedule?.timeZone || "—";

  return (
    <div className="nk-block">
      {/* HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <div className="nk-block-title">
              <button
                type="button"
                className="btn btn-sm btn-outline-light me-2"
                onClick={() => navigate("/admin/batches")}
              >
                <ArrowLeft size={16} className="me-1" />
                Back
              </button>
              <span className="h4 align-middle mb-0">
                <Layers3 size={20} className="me-1" />
                {batch?.name || "Batch Details"}
              </span>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                View batch configuration, schedule and status. From here we’ll
                connect Enrollments & Attendance modules.
              </p>
            </div>
          </div>

          {/* Top-right actions (optional future buttons) */}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-3" role="alert">
          {success}
        </div>
      )}

      {/* BODY */}
      <div className="nk-block">
        {loading ? (
          <div className="card card-bordered">
            <div className="card-inner text-center py-5">
              <div className="spinner-border mb-2" />
              <div>Loading batch details...</div>
            </div>
          </div>
        ) : !batch ? (
          <div className="card card-bordered">
            <div className="card-inner text-center py-5">
              <AlertCircle size={32} className="mb-2 text-danger" />
              <div className="text-soft">
                Batch not found or failed to load.
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {/* Left: Overview */}
            <div className="col-lg-8">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="mb-1">{batch.name}</h4>
                      <div className="text-soft small">
                        Code: {batch.code || "—"}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="mb-1">
                        <span className={getStatusBadgeClass(batch.status)}>
                          {batch.status}
                        </span>
                        <span className={`ms-1 ${getModeBadgeClass(batch.mode)}`}>
                          {batch.mode}
                        </span>
                      </div>
                      <div className="text-soft small">
                        Created: {formatDate(batch.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Course & Educator */}
                    <div className="col-md-6">
                      <div className="border rounded-3 p-3">
                        <div className="d-flex align-items-center mb-1">
                          <BookOpen size={16} className="me-1" />
                          <span className="fw-semibold small">
                            Course
                          </span>
                        </div>
                        <div className="small">{courseLabel}</div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded-3 p-3">
                        <div className="d-flex align-items-center mb-1">
                          <User size={16} className="me-1" />
                          <span className="fw-semibold small">
                            Educator
                          </span>
                        </div>
                        <div className="small">{educatorLabel}</div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="col-md-6">
                      <div className="border rounded-3 p-3">
                        <div className="d-flex align-items-center mb-1">
                          <Calendar size={16} className="me-1" />
                          <span className="fw-semibold small">
                            Schedule
                          </span>
                        </div>
                        <div className="small">
                          Days: <strong>{days}</strong>
                        </div>
                        <div className="small">
                          <Clock size={12} className="me-1" />
                          {startTime} – {endTime}
                        </div>
                        <div className="text-soft small">
                          Timezone: {timeZone}
                        </div>
                      </div>
                    </div>

                    {/* Duration & Capacity */}
                    <div className="col-md-6">
                      <div className="border rounded-3 p-3">
                        <div className="d-flex align-items-center mb-1">
                          <Activity size={16} className="me-1" />
                          <span className="fw-semibold small">
                            Duration & Capacity
                          </span>
                        </div>
                        <div className="small">
                          {formatDate(batch.startDate)} –{" "}
                          {formatDate(batch.endDate)}
                        </div>
                        <div className="small mt-1">
                          <Users size={14} className="me-1" />
                          {batch.capacity === 0
                            ? "Unlimited capacity"
                            : `${batch.enrollmentCount || 0} / ${batch.capacity
                            } learners`}
                        </div>
                      </div>
                    </div>

                    {/* Sub-Org / Location */}
                    <div className="col-md-6">
                      <div className="border rounded-3 p-3">
                        <div className="d-flex align-items-center mb-1">
                          <MapPin size={16} className="me-1" />
                          <span className="fw-semibold small">
                            Location / Sub-Organization
                          </span>
                        </div>
                        <div className="small">
                          {batch.subOrgName ||
                            batch.subOrg?.name ||
                            "Main organization"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Future hooks */}
                  <div className="alert alert-soft info mt-3 small mb-0">
                    <p className="mb-1">
                      Next steps (we’ll wire these in upcoming modules):
                    </p>
                    <ul className="mb-0 ps-3">
                      <li>Enroll learners into this batch</li>
                      <li>Generate attendance sessions from schedule</li>
                      <li>Track live / recorded classes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Status & actions */}
            <div className="col-lg-4">
              <div className="card card-bordered">
                <div className="card-inner">
                  <h6 className="title mb-3">Status & Lifecycle</h6>

                  <form onSubmit={handleStatusUpdate}>
                    <div className="form-group">
                      <label className="form-label">
                        Batch Status
                      </label>
                      <select
                        className="form-select"
                        value={statusValue}
                        onChange={(e) =>
                          setStatusValue(e.target.value)
                        }
                        disabled={!canManageStatus || savingStatus}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="form-note small">
                        Allowed transitions: draft → published → ongoing →
                        completed or cancelled. Backend enforces business rules.
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="text-soft small">
                        {canManageStatus ? (
                          <span>
                            You can update current status. Learner access,
                            enrollments & certificates will follow this.
                          </span>
                        ) : (
                          <span>
                            Only Admin / SubOrgAdmin can update batch status.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                        disabled={!canManageStatus || savingStatus}
                      >
                        {savingStatus ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} className="me-1" />
                            Save Status
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* NEW: Manage Enrollments button */}
                  <hr className="mt-4 mb-3" />

                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center mb-2"
                    onClick={() => navigate(`/admin/batches/${id}/enrollments`)}
                  >
                    <ClipboardList size={16} className="me-1" />
                    Manage Enrollments
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center mb-2"
                    onClick={() => navigate(`/admin/batches/${id}/attendance`)}
                  >
                    <CalendarDays size={16} className="me-1" />
                    View Attendance
                  </button>


                  <div className="small text-soft mb-1">
                    Upcoming automation:
                  </div>
                  <ul className="small ps-3 mb-0">
                    <li>Auto-move from Published to Ongoing on start date.</li>
                    <li>
                      Auto-complete when course & assessments are finished.
                    </li>
                    <li>
                      Attendance engine will use schedule + timezone to build
                      sessions.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetailPage;

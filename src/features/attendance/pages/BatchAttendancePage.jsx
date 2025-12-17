// src/features/attendance/pages/BatchAttendancePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  QrCode,
  Clock,
  Layers3,
  Users,
} from "lucide-react";

import { fetchBatchById } from "../../batches/api/batchesApi";
import {
  fetchBatchSessions,
  generateAttendanceSessions,
  autoMarkOnlineSession,
} from "../api/attendanceApi";

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
};

const getSessionStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "scheduled") return "badge bg-info-dim text-info";
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

const BatchAttendancePage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const role = currentUser?.role;
  const canGenerate =
    role === "admin" || role === "subOrgAdmin" || role === "educator";

  const [batch, setBatch] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoMarkingId, setAutoMarkingId] = useState(null);
  const [regenerate, setRegenerate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load batch
  useEffect(() => {
    let isMounted = true;
    async function loadBatch() {
      setLoadingBatch(true);
      setError("");
      try {
        const data = await fetchBatchById(batchId);
        if (!isMounted) return;
        setBatch(data);
      } catch (err) {
        console.error("BatchAttendancePage fetchBatchById error:", err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load batch.";
        setError(message);
      } finally {
        if (isMounted) setLoadingBatch(false);
      }
    }
    loadBatch();
    return () => {
      isMounted = false;
    };
  }, [batchId]);

  // Load sessions
  const loadSessions = async () => {
    setLoadingSessions(true);
    setError("");
    try {
      const list = await fetchBatchSessions(batchId);
      setSessions(list);
    } catch (err) {
      console.error("fetchBatchSessions error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load attendance sessions.";
      setError(message);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const stats = useMemo(() => {
    const summary = {
      total: sessions.length,
      scheduled: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
    };
    sessions.forEach((s) => {
      const st = (s.status || "").toLowerCase();
      if (st === "scheduled") summary.scheduled++;
      else if (st === "ongoing") summary.ongoing++;
      else if (st === "completed") summary.completed++;
      else if (st === "cancelled") summary.cancelled++;
    });
    return summary;
  }, [sessions]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      alert("You do not have permission to generate sessions.");
      return;
    }
    if (!batch) {
      alert("Batch not loaded yet.");
      return;
    }
    if (
      regenerate &&
      !window.confirm(
        "Regenerate will delete existing sessions for this batch and recreate them from schedule. Continue?"
      )
    ) {
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const res = await generateAttendanceSessions(batchId, { regenerate });
      const count = res?.data?.created ?? res?.created ?? "-";
      setSuccess(
        `Attendance sessions generated successfully. Created: ${count}`
      );
      await loadSessions();
    } catch (err) {
      console.error("generateAttendanceSessions error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate attendance sessions.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoMarkOnline = async (session) => {
    if (!canGenerate) {
      alert("You do not have permission to auto-mark sessions.");
      return;
    }
    if (!window.confirm("Mark all enrolled learners present for this session?"))
      return;

    setAutoMarkingId(session.id);
    setError("");
    setSuccess("");
    try {
      await autoMarkOnlineSession(session.id);
      setSuccess("Online session attendance marked as present for all.");
      await loadSessions();
    } catch (err) {
      console.error("autoMarkOnlineSession error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to auto-mark online session.";
      setError(message);
    } finally {
      setAutoMarkingId(null);
    }
  };

  return (
    <div className="nk-block">
      {/* header */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <div className="nk-block-title">
              <button
                type="button"
                className="btn btn-sm btn-outline-light me-2"
                onClick={() => navigate(`/admin/batches/${batchId}`)}
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Batch
              </button>
              <span className="h4 align-middle mb-0">
                <CalendarDays size={20} className="me-1" />
                Batch Attendance
              </span>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Sessions are auto-generated from batch schedule. Educators and
                learners will use these sessions for marking presence.
              </p>
            </div>
          </div>

          {canGenerate && (
            <div className="nk-block-head-content">
              <div className="nk-block-tools">
                <ul className="nk-block-tools g-2">
                  <li>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="regenerateSessionsSwitch"
                        checked={regenerate}
                        onChange={(e) => setRegenerate(e.target.checked)}
                        disabled={generating}
                      />
                      <label
                        className="form-check-label small"
                        htmlFor="regenerateSessionsSwitch"
                      >
                        Regenerate (overwrite existing)
                      </label>
                    </div>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-items-center"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} className="me-1" />
                          Generate Sessions
                        </>
                      )}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
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

      {/* batch summary */}
      <div className="nk-block mb-3">
        <div className="card card-bordered">
          <div className="card-inner d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex flex-column mb-2 mb-md-0">
              <div className="fw-semibold">
                {loadingBatch
                  ? "Loading batch..."
                  : batch?.name || "Batch"}
              </div>
              <div className="text-soft small">
                {batch ? (
                  <>
                    <Layers3 size={14} className="me-1" />
                    {batch.courseTitle ||
                      batch.courseName ||
                      batch.course?.title ||
                      "Course"}
                    {" • "}
                    Code: {batch.code || "—"}
                  </>
                ) : (
                  "Batch details not loaded."
                )}
              </div>
              {batch && (
                <div className="text-soft small">
                  <CalendarCheck size={12} className="me-1" />
                  {formatDate(batch.startDate)} –{" "}
                  {formatDate(batch.endDate)}
                  {" • "}
                  <Clock size={12} className="ms-1 me-1" />
                  {batch.schedule?.startTime || "--:--"} –{" "}
                  {batch.schedule?.endTime || "--:--"}{" "}
                  <span className="ms-1">
                    ({batch.schedule?.timeZone || "Timezone"})
                  </span>
                </div>
              )}
            </div>

            <div className="d-flex gap-3 text-end small">
              <div>
                <div className="text-soft">Sessions</div>
                <div>
                  Total: <strong>{stats.total}</strong>
                </div>
              </div>
              <div>
                <div className="text-soft">Status split</div>
                <div>
                  <span className="badge bg-info-dim text-info me-1">
                    {stats.scheduled} scheduled
                  </span>
                  <span className="badge bg-success-dim text-success me-1">
                    {stats.ongoing} ongoing
                  </span>
                  <span className="badge bg-primary-dim text-primary me-1">
                    {stats.completed} completed
                  </span>
                  <span className="badge bg-danger-dim text-danger">
                    {stats.cancelled} cancelled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* sessions table */}
      <div className="nk-block">
        <div className="card card-bordered">
          <div className="card-inner p-0">
            <div className="nk-tb-list nk-tb-ulist">
              <div className="nk-tb-item nk-tb-head">
                <div className="nk-tb-col">
                  <span className="sub-text">Session</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Mode</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">QR / Online</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Status</span>
                </div>
                <div className="nk-tb-col nk-tb-col-tools text-end">
                  <span className="sub-text">Actions</span>
                </div>
              </div>

              {loadingSessions ? (
                <div className="nk-tb-item">
                  <div className="nk-tb-col text-center py-4">
                    <div className="spinner-border spinner-border-sm me-2" />
                    Loading sessions...
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="nk-tb-item">
                  <div className="nk-tb-col text-center py-4">
                    <AlertCircle size={18} className="me-1 text-soft" />
                    No sessions yet. Use{" "}
                    <strong>Generate Sessions</strong> to create them based
                    on batch schedule.
                  </div>
                </div>
              ) : (
                sessions.map((s) => (
                  <div className="nk-tb-item" key={s.id}>
                    <div className="nk-tb-col">
                      <div className="d-flex flex-column">
                        <span className="fw-semibold small">
                          {formatDate(s.date, false)}
                        </span>
                        <span className="text-soft small">
                          <Clock size={12} className="me-1" />
                          {s.startTime || "--:--"} –{" "}
                          {s.endTime || "--:--"} •{" "}
                          {s.timeZone || "Timezone"}
                        </span>
                        <span className="text-soft small">
                          Session ID: {s.id}
                        </span>
                      </div>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <span className={getModeBadgeClass(s.mode)}>
                        {s.mode}
                      </span>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <div className="small d-flex flex-column">
                        <span>
                          <QrCode
                            size={14}
                            className={`me-1 ${
                              s.qrEnabled ? "text-success" : "text-soft"
                            }`}
                          />
                          QR:{" "}
                          <strong>
                            {s.qrEnabled ? "Enabled" : "Disabled"}
                          </strong>
                        </span>
                        <span>
                          <Wifi
                            size={14}
                            className={`me-1 ${
                              s.autoOnline ? "text-success" : "text-soft"
                            }`}
                          />
                          Auto online:{" "}
                          <strong>
                            {s.autoOnline ? "Yes" : "No"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="nk-tb-col tb-col-md">
                      <span className={getSessionStatusBadgeClass(s.status)}>
                        {s.status}
                      </span>
                    </div>

                    <div className="nk-tb-col nk-tb-col-tools text-end">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-light"
                          onClick={() =>
                            navigate(`/admin/attendance/sessions/${s.id}`)
                          }
                        >
                          <Activity size={14} className="me-1" />
                          View & Records
                        </button>

                        {s.mode === "online" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleAutoMarkOnline(s)}
                            disabled={autoMarkingId === s.id}
                          >
                            {autoMarkingId === s.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Auto-marking...
                              </>
                            ) : (
                              <>
                                <CheckCircle2
                                  size={14}
                                  className="me-1"
                                />
                                Auto-mark Online
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* footer note */}
          <div className="card-inner border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-soft small">
                Sessions here will be used by educators (mark attendance) and
                learners (QR scan). Enrollments define who can be marked
                present.
              </div>
              <div className="small text-soft">
                <Users size={14} className="me-1" />
                Connected to batch enrollments.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAttendancePage;

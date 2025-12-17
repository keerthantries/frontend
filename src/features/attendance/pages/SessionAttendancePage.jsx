// src/features/attendance/pages/SessionAttendancePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Calendar,
  Clock,
  Wifi,
  QrCode,
  AlertCircle,
  User,
  Users,
  Activity,
} from "lucide-react";

import { fetchSessionWithAttendance } from "../api/attendanceApi";

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
};

const getRecordStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "present") return "badge bg-success-dim text-success";
  if (s === "absent") return "badge bg-danger-dim text-danger";
  if (s === "late") return "badge bg-warning-dim text-warning";
  return "badge bg-light text-muted";
};

const SessionAttendancePage = () => {
  const { sessionId } = useParams();
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
  const canEdit =
    role === "admin" || role === "subOrgAdmin" || role === "educator";

  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchSessionWithAttendance(sessionId);
        if (!isMounted) return;
        setSession(data.session || null);
        setRecords(data.attendance || []);
      } catch (err) {
        console.error("fetchSessionWithAttendance error:", err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load session attendance.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const stats = useMemo(() => {
    const summary = {
      total: records.length,
      present: 0,
      absent: 0,
      late: 0,
    };
    records.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "present") summary.present++;
      else if (s === "absent") summary.absent++;
      else if (s === "late") summary.late++;
    });
    return summary;
  }, [records]);

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
                onClick={() =>
                  session?.batchId
                    ? navigate(`/admin/batches/${session.batchId}/attendance`)
                    : navigate("/admin/batches")
                }
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Attendance
              </button>
              <span className="h4 align-middle mb-0">
                <CalendarDays size={20} className="me-1" />
                Session Attendance
              </span>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                View presence for this specific class session. This page is
                optimized for admin review and educator audit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* body */}
      <div className="nk-block">
        {loading ? (
          <div className="card card-bordered">
            <div className="card-inner text-center py-5">
              <div className="spinner-border mb-2" />
              <div>Loading session...</div>
            </div>
          </div>
        ) : !session ? (
          <div className="card card-bordered">
            <div className="card-inner text-center py-5">
              <AlertCircle size={32} className="mb-2 text-danger" />
              <div className="text-soft">
                Session not found or failed to load.
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {/* Session info */}
            <div className="col-lg-4">
              <div className="card card-bordered">
                <div className="card-inner">
                  <h6 className="title mb-2">Session Details</h6>

                  <div className="border rounded-3 p-3 mb-2">
                    <div className="d-flex align-items-center mb-1">
                      <Calendar size={16} className="me-1" />
                      <span className="fw-semibold small">
                        Date & Time
                      </span>
                    </div>
                    <div className="small">
                      {formatDate(session.date, false)}
                    </div>
                    <div className="small">
                      <Clock size={12} className="me-1" />
                      {session.startTime || "--:--"} –{" "}
                      {session.endTime || "--:--"}
                    </div>
                    <div className="text-soft small">
                      Timezone: {session.timeZone || "—"}
                    </div>
                  </div>

                  <div className="border rounded-3 p-3 mb-2">
                    <div className="d-flex align-items-center mb-1">
                      <Activity size={16} className="me-1" />
                      <span className="fw-semibold small">
                        Mode & Automation
                      </span>
                    </div>
                    <div className="small mb-1">
                      Mode: <strong>{session.mode || "-"}</strong>
                    </div>
                    <div className="small">
                      <QrCode
                        size={14}
                        className={`me-1 ${
                          session.qrEnabled ? "text-success" : "text-soft"
                        }`}
                      />
                      QR:{" "}
                      <strong>
                        {session.qrEnabled ? "Enabled" : "Disabled"}
                      </strong>
                    </div>
                    <div className="small">
                      <Wifi
                        size={14}
                        className={`me-1 ${
                          session.autoOnline ? "text-success" : "text-soft"
                        }`}
                      />
                      Auto Online:{" "}
                      <strong>
                        {session.autoOnline ? "Yes" : "No"}
                      </strong>
                    </div>
                    <div className="text-soft small mt-1">
                      Status: <strong>{session.status}</strong>
                    </div>
                  </div>

                  <div className="border rounded-3 p-3">
                    <div className="d-flex align-items-center mb-1">
                      <Users size={16} className="me-1" />
                      <span className="fw-semibold small">
                        Attendance Summary
                      </span>
                    </div>
                    <div className="small">
                      Total records:{" "}
                      <strong>{stats.total}</strong>
                    </div>
                    <div className="small">
                      Present:{" "}
                      <span className="badge bg-success-dim text-success">
                        {stats.present}
                      </span>
                    </div>
                    <div className="small">
                      Late:{" "}
                      <span className="badge bg-warning-dim text-warning">
                        {stats.late}
                      </span>
                    </div>
                    <div className="small">
                      Absent:{" "}
                      <span className="badge bg-danger-dim text-danger">
                        {stats.absent}
                      </span>
                    </div>
                    <div className="text-soft small mt-2">
                      {canEdit
                        ? "Manual overrides and exports can be added here later."
                        : "Read-only view based on educator / learner actions."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Records table */}
            <div className="col-lg-8">
              <div className="card card-bordered">
                <div className="card-inner p-0">
                  <div className="nk-tb-list nk-tb-ulist">
                    <div className="nk-tb-item nk-tb-head">
                      <div className="nk-tb-col">
                        <span className="sub-text">Learner</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span className="sub-text">Status</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span className="sub-text">Source</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span className="sub-text">Checked In</span>
                      </div>
                    </div>

                    {records.length === 0 ? (
                      <div className="nk-tb-item">
                        <div className="nk-tb-col text-center py-4">
                          <AlertCircle
                            size={18}
                            className="me-1 text-soft"
                          />
                          No attendance records yet for this session.
                        </div>
                      </div>
                    ) : (
                      records.map((r) => (
                        <div className="nk-tb-item" key={r.id}>
                          <div className="nk-tb-col">
                            <div className="d-flex align-items-center">
                              <div className="user-avatar xs bg-primary-dim me-2">
                                <span>
                                  {(r.learnerName || "L")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div className="d-flex flex-column">
                                <span className="fw-semibold small">
                                  {r.learnerName || "Learner"}
                                </span>
                                <span className="text-soft small">
                                  {r.learnerEmail
                                    ? r.learnerEmail
                                    : `ID: ${r.learnerId}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="nk-tb-col tb-col-md">
                            <span className={getRecordStatusBadgeClass(r.status)}>
                              {r.status || "present"}
                            </span>
                          </div>

                          <div className="nk-tb-col tb-col-md small">
                            {r.source || "-"}
                          </div>

                          <div className="nk-tb-col tb-col-md small">
                            {formatDate(r.checkedInAt, true)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card-inner border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-soft small">
                      Attendance is aggregated from QR scans, online tracking
                      and (later) manual overrides.
                    </div>
                    <div className="small text-soft">
                      <User size={14} className="me-1" />
                      {canEdit
                        ? "Educators / Admins maintain accuracy here."
                        : "View-only for your role."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionAttendancePage;

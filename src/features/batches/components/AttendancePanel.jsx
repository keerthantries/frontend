// src/features/batches/components/AttendancePanel.jsx
import React, { useEffect, useState } from "react";
import AttendanceDatePicker from "./AttendanceDatePicker";
import AttendanceTable from "./AttendanceTable";
import { listBatchAttendance, markBatchAttendance } from "../api/attendanceApi";

const AttendancePanel = ({ batchId, enrollments }) => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const [records, setRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const [markSuccess, setMarkSuccess] = useState("");

  // State for today's mark form
  const [statusByEnrollment, setStatusByEnrollment] = useState({}); // { enrollmentId: "present" | "absent" | "late" }
  const [notesByEnrollment, setNotesByEnrollment] = useState({});

  // Load history for selected date
  useEffect(() => {
    const load = async () => {
      if (!batchId || !date) return;
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const { data } = await listBatchAttendance(batchId, { date });
        setRecords(data.items || []);
      } catch (err) {
        console.error(err);
        setHistoryError(
          err?.message || "Failed to load attendance for this date."
        );
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [batchId, date]);

  const handleStatusChange = (enrollmentId, value) => {
    setStatusByEnrollment((prev) => ({
      ...prev,
      [enrollmentId]: value,
    }));
  };

  const handleNotesChange = (enrollmentId, value) => {
    setNotesByEnrollment((prev) => ({
      ...prev,
      [enrollmentId]: value,
    }));
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setMarkError("");
    setMarkSuccess("");

    if (!date) {
      setMarkError("Please select a date for attendance.");
      return;
    }

    // Build records – required for UI
    const recordsPayload = (enrollments || []).map((en) => {
      const enrollmentId = en.id || en._id;
      const status = statusByEnrollment[enrollmentId] || "absent"; // default absent (mandatory)
      const notes = notesByEnrollment[enrollmentId] || null;
      return {
        enrollmentId,
        learnerId: en.learnerId,
        status,
        notes,
      };
    });

    try {
      setMarking(true);
      await markBatchAttendance(batchId, {
        date,
        records: recordsPayload,
      });
      setMarkSuccess("Attendance marked successfully.");
      setTimeout(() => setMarkSuccess(""), 1500);

      // Refresh history
      const { data } = await listBatchAttendance(batchId, { date });
      setRecords(data.items || []);
    } catch (err) {
      console.error(err);
      setMarkError(
        err?.message || "Failed to mark attendance. Please try again."
      );
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="card card-bordered mb-3">
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="title mb-0">Mark Attendance</h6>
            <AttendanceDatePicker date={date} onChange={setDate} />
          </div>
          <p className="text-soft small mb-2">
            Attendance is mandatory for each session. Default is{" "}
            <strong>Absent</strong>, change to <strong>Present</strong> /
            <strong>Late</strong> where needed.
          </p>

          {markError && (
            <div className="alert alert-danger py-1 mb-2">{markError}</div>
          )}
          {markSuccess && (
            <div className="alert alert-success py-1 mb-2">
              {markSuccess}
            </div>
          )}

          {(!enrollments || enrollments.length === 0) && (
            <div className="text-muted small">
              No learners enrolled yet. Enroll learners to mark attendance.
            </div>
          )}

          {enrollments && enrollments.length > 0 && (
            <form onSubmit={handleMarkAttendance}>
              <div
                className="border rounded p-2"
                style={{ maxHeight: 260, overflowY: "auto" }}
              >
                {enrollments.map((en) => {
                  const enrollmentId = en.id || en._id;
                  const status =
                    statusByEnrollment[enrollmentId] || "absent";
                  const name = en.learnerName || en.learnerId || "Learner";
                  return (
                    <div
                      key={enrollmentId}
                      className="d-flex flex-wrap align-items-center justify-content-between border-bottom py-1"
                    >
                      <div className="d-flex align-items-center">
                        <div className="user-avatar xs bg-primary-dim me-2">
                          <span>
                            {name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="small fw-semibold">{name}</div>
                          <div className="text-soft xsmall">
                            {en.learnerEmail || ""}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-1 mt-sm-0">
                        <select
                          className="form-select form-select-sm"
                          style={{ minWidth: 110 }}
                          value={status}
                          onChange={(e) =>
                            handleStatusChange(
                              enrollmentId,
                              e.target.value
                            )
                          }
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Notes"
                          value={notesByEnrollment[enrollmentId] || ""}
                          onChange={(e) =>
                            handleNotesChange(
                              enrollmentId,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 text-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={marking}
                >
                  {marking ? "Saving…" : "Save Attendance"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* History table */}
      <AttendanceTable
        records={records}
        loading={historyLoading}
        error={historyError}
      />
    </div>
  );
};

export default AttendancePanel;
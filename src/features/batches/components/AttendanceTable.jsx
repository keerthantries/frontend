// src/features/batches/components/AttendanceTable.jsx
import React from "react";

const AttendanceTable = ({ records, loading, error }) => {
  return (
    <div className="card card-bordered mt-3">
      <div className="card-inner p-0">
        <table className="nk-tb-list nk-tb-ulist">
          <thead>
            <tr className="nk-tb-item nk-tb-head">
              <th className="nk-tb-col">
                <span className="sub-text">Learner</span>
              </th>
              <th className="nk-tb-col tb-col-md">
                <span className="sub-text">Status</span>
              </th>
              <th className="nk-tb-col tb-col-md">
                <span className="sub-text">Date</span>
              </th>
              <th className="nk-tb-col tb-col-xl">
                <span className="sub-text">Notes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="nk-tb-item">
                <td colSpan={4} className="text-center py-3">
                  Loading attendance…
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr className="nk-tb-item">
                <td colSpan={4} className="text-center text-danger py-3">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && records.length === 0 && (
              <tr className="nk-tb-item">
                <td colSpan={4} className="text-center py-3">
                  No attendance records for this date.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              records.map((rec) => {
                const id = rec.id || rec._id;
                const date = rec.date
                  ? new Date(rec.date).toLocaleDateString()
                  : "-";
                const notes =
                  rec.notes?.length > 60
                    ? `${rec.notes.slice(0, 57)}…`
                    : rec.notes || "-";
                return (
                  <tr className="nk-tb-item" key={id}>
                    <td className="nk-tb-col">
                      <div className="user-card">
                        <div className="user-avatar bg-warning-dim">
                          <span>
                            {(rec.learnerName || "L")
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="user-info">
                          <span className="tb-lead">
                            {rec.learnerName || rec.learnerId}
                          </span>
                          <span className="text-soft small">
                            {rec.learnerEmail || rec.learnerId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="nk-tb-col tb-col-md">
                      <span className="badge badge-dim bg-outline-primary text-capitalize">
                        {rec.status || "absent"}
                      </span>
                    </td>
                    <td className="nk-tb-col tb-col-md">
                      <span>{date}</span>
                    </td>
                    <td className="nk-tb-col tb-col-xl">
                      <span className="small text-break" title={rec.notes || ""}>
                        {notes}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
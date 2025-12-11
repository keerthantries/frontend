// src/features/batches/components/EnrollmentsTable.jsx
import React from "react";

const EnrollmentsTable = ({
  enrollments,
  loading,
  error,
  pagination,
  onPageChange,
}) => {
  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  const renderPageNumbers = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p += 1) {
      pages.push(
        <li
          key={p}
          className={`page-item ${p === page ? "active" : ""}`}
        >
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        </li>
      );
    }
    return pages;
  };

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
                <span className="sub-text">Source</span>
              </th>
              <th className="nk-tb-col tb-col-md">
                <span className="sub-text">Start</span>
              </th>
              <th className="nk-tb-col tb-col-md">
                <span className="sub-text">Expiry</span>
              </th>
              <th className="nk-tb-col tb-col-xl">
                <span className="sub-text">Notes</span>
              </th>
              <th className="nk-tb-col tb-col-md">
                <span className="sub-text">Enrolled At</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="nk-tb-item">
                <td colSpan={7} className="text-center py-3">
                  Loading enrollments…
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr className="nk-tb-item">
                <td colSpan={7} className="text-center text-danger py-3">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && enrollments.length === 0 && (
              <tr className="nk-tb-item">
                <td colSpan={7} className="text-center py-3">
                  No enrollments yet.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              enrollments.map((en) => {
                const id = en.id || en._id;
                const startDate = en.startDate
                  ? new Date(en.startDate).toLocaleDateString()
                  : "-";
                const expiryDate = en.expiryDate
                  ? new Date(en.expiryDate).toLocaleDateString()
                  : "-";
                const enrolledAt = en.enrolledAt
                  ? new Date(en.enrolledAt).toLocaleString()
                  : "-";
                const notes =
                  en.notes?.length > 60
                    ? `${en.notes.slice(0, 57)}…`
                    : en.notes || "-";

                return (
                  <tr className="nk-tb-item" key={id}>
                    <td className="nk-tb-col">
                      <div className="user-card">
                        <div className="user-avatar bg-primary-dim">
                          <span>
                            {(en.learnerName || "L")
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="user-info">
                          <span className="tb-lead">
                            {en.learnerName || en.learnerId}
                          </span>
                          <span className="text-soft small">
                            {en.learnerEmail || en.learnerId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="nk-tb-col tb-col-md">
                      <span className="badge badge-dim bg-outline-primary text-capitalize">
                        {en.status || "pending"}
                      </span>
                    </td>

                    <td className="nk-tb-col tb-col-md">
                      <span className="text-capitalize">
                        {en.source || "admin"}
                      </span>
                    </td>

                    <td className="nk-tb-col tb-col-md">
                      <span>{startDate}</span>
                    </td>
                    <td className="nk-tb-col tb-col-md">
                      <span>{expiryDate}</span>
                    </td>

                    <td className="nk-tb-col tb-col-xl">
                      <span
                        title={en.notes || ""}
                        className="small text-break"
                      >
                        {notes}
                      </span>
                    </td>

                    <td className="nk-tb-col tb-col-md">
                      <span className="small text-soft">{enrolledAt}</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="card-inner border-top">
        <div className="nk-block-between-md g-3">
          <div className="g">
            <ul className="pagination justify-content-center justify-content-md-start">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page - 1)}
                >
                  Prev
                </button>
              </li>
              {renderPageNumbers()}
              <li
                className={`page-item ${
                  page === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
          <div className="g">
            <div className="pagination-goto d-flex justify-content-center justify-content-md-start gx-3">
              <div>Page</div>
              <div>{page}</div>
              <div>of {totalPages}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentsTable;
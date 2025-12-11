// src/features/batches/components/BatchesTable.jsx
import React from "react";
import BatchStatusBadge from "./BatchStatusBadge";

const BatchesTable = ({
  batches,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onViewBatch,
  onQuickStatusChange,
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p += 1) {
      pages.push(
        <li
          key={p}
          className={`page-item ${p === currentPage ? "active" : ""}`}
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
    <div className="nk-block">
      <div className="card card-stretch">
        <div className="card-inner-group">
          <div className="card-inner p-0">
            <table className="nk-tb-list nk-tb-ulist">
              <thead>
                <tr className="nk-tb-item nk-tb-head">
                  <th className="nk-tb-col">
                    <span className="sub-text">Course</span>
                  </th>
                  <th className="nk-tb-col">
                    <span className="sub-text">Batch Name</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">Code</span>
                  </th>
                  <th className="nk-tb-col tb-col-lg">
                    <span className="sub-text">Educator</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">Mode</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">Start Date</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">End Date</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">Capacity</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">Enrolled</span>
                  </th>
                  <th className="nk-tb-col tb-col-md">
                    <span className="sub-text">Status</span>
                  </th>
                  <th className="nk-tb-col nk-tb-col-tools text-end">
                    <span className="sub-text">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="nk-tb-item">
                    <td colSpan={11} className="text-center py-4">
                      Loading batches…
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr className="nk-tb-item">
                    <td colSpan={11} className="text-center text-danger py-4">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && batches.length === 0 && (
                  <tr className="nk-tb-item">
                    <td colSpan={11} className="text-center py-4">
                      No batches found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  batches.map((batch) => {
                    const id = batch.id || batch._id;
                    const startDate = batch.startDate
                      ? new Date(batch.startDate).toLocaleDateString()
                      : "-";
                    const endDate = batch.endDate
                      ? new Date(batch.endDate).toLocaleDateString()
                      : "-";

                    return (
                      <tr className="nk-tb-item" key={id}>
                        <td className="nk-tb-col">
                          <div className="project-info">
                            <h6 className="title mb-0">
                              {batch.courseName ||
                                batch.courseTitle ||
                                batch.courseId ||
                                "-"}
                            </h6>
                          </div>
                        </td>
                        <td className="nk-tb-col">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-start"
                            onClick={() => onViewBatch(id)}
                          >
                            {batch.name}
                          </button>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <span className="text-soft">
                            {batch.code || "-"}
                          </span>
                        </td>
                        <td className="nk-tb-col tb-col-lg">
                          <span>{batch.educatorName || "—"}</span>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <span className="text-capitalize">
                            {batch.mode || "online"}
                          </span>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <span>{startDate}</span>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <span>{endDate}</span>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <span>{batch.capacity ?? "-"}</span>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <span>{batch.enrollmentCount ?? 0}</span>
                        </td>
                        <td className="nk-tb-col tb-col-md">
                          <BatchStatusBadge status={batch.status} />
                        </td>
                        <td className="nk-tb-col nk-tb-col-tools">
                          <ul className="nk-tb-actions gx-1">
                            <li>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => onViewBatch(id)}
                              >
                                View / Manage
                              </button>
                            </li>
                            <li>
                              <div className="dropdown">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-trigger dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                >
                                  <em className="icon ni ni-more-h" />
                                </button>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <ul className="link-list-opt no-bdr">
                                    {["draft", "published", "ongoing", "completed", "cancelled"].map(
                                      (s) => (
                                        <li key={s}>
                                          <button
                                            type="button"
                                            className="dropdown-item"
                                            onClick={() =>
                                              onQuickStatusChange(id, s)
                                            }
                                          >
                                            <span className="text-capitalize">
                                              Mark as {s}
                                            </span>
                                          </button>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="card-inner">
            <div className="nk-block-between-md g-3">
              <div className="g">
                <ul className="pagination justify-content-center justify-content-md-start">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => onPageChange(currentPage - 1)}
                    >
                      Prev
                    </button>
                  </li>
                  {renderPageNumbers()}
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => onPageChange(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </div>
              <div className="g">
                <div className="pagination-goto d-flex justify-content-center justify-content-md-start gx-3">
                  <div>Page</div>
                  <div className="form-control-wrap">
                    <span>{currentPage}</span>
                  </div>
                  <div>of {totalPages}</div>
                </div>
              </div>
            </div>
          </div>
          {/* End pagination */}
        </div>
      </div>
    </div>
  );
};

export default BatchesTable;

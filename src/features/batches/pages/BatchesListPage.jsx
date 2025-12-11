// src/features/batches/pages/BatchesListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBatches } from "../api/batchesApi";
import BatchFiltersBar from "../components/BatchFiltersBar";

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

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const BatchesListPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");
  const [courseQuery, setCourseQuery] = useState("");

  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBatches = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: pagination.limit,
      };
      if (search) params.q = search;
      if (status) params.status = status;
      if (mode) params.mode = mode;
      if (courseQuery) params.courseName = courseQuery;

      const { data } = await listBatches(params);
      setBatches(data.items || []);
      setPagination(
        data.pagination || {
          page,
          limit: pagination.limit,
          total: data.items?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load batches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, mode, courseQuery]);

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    loadBatches(page);
  };

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <BatchFiltersBar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            mode={mode}
            onModeChange={setMode}
            courseQuery={courseQuery}
            onCourseQueryChange={setCourseQuery}
            onCreateClick={() => navigate("/admin/batches/add")}
          />

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
                        <th className="nk-tb-col tb-col-md">
                          <span className="sub-text">Educator</span>
                        </th>
                        <th className="nk-tb-col tb-col-md">
                          <span className="sub-text">Mode</span>
                        </th>
                        <th className="nk-tb-col tb-col-md">
                          <span className="sub-text">Start</span>
                        </th>
                        <th className="nk-tb-col tb-col-md">
                          <span className="sub-text">End</span>
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
                          <td className="nk-tb-col text-center" colSpan={11}>
                            Loading batches…
                          </td>
                        </tr>
                      )}

                      {error && !loading && (
                        <tr className="nk-tb-item">
                          <td
                            className="nk-tb-col text-center text-danger"
                            colSpan={11}
                          >
                            {error}
                          </td>
                        </tr>
                      )}

                      {!loading && !error && batches.length === 0 && (
                        <tr className="nk-tb-item">
                          <td
                            className="nk-tb-col text-center"
                            colSpan={11}
                            style={{ padding: "1rem" }}
                          >
                            No batches found.
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        !error &&
                        batches.map((batch) => {
                          const id = batch.id || batch._id;
                          return (
                            <tr className="nk-tb-item" key={id}>
                              <td className="nk-tb-col">
                                <div className="project-info">
                                  <h6 className="title mb-0">
                                    {batch.courseName || "-"}
                                  </h6>
                                  <span className="text-soft small">
                                    {batch.courseCode || ""}
                                  </span>
                                </div>
                              </td>
                              <td className="nk-tb-col">
                                <span className="fw-medium">
                                  {batch.name}
                                </span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span>{batch.code || "-"}</span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span>
                                  {batch.educatorName ||
                                    batch.educatorEmail ||
                                    "—"}
                                </span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span className="text-capitalize">
                                  {batch.mode || "-"}
                                </span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span>{formatDate(batch.startDate)}</span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span>{formatDate(batch.endDate)}</span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span>{batch.capacity ?? "-"}</span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span>{batch.enrollmentCount ?? 0}</span>
                              </td>
                              <td className="nk-tb-col tb-col-md">
                                <span
                                  className={`${statusBadgeClass(
                                    batch.status
                                  )} text-capitalize`}
                                >
                                  {batch.status || "draft"}
                                </span>
                              </td>
                              <td className="nk-tb-col nk-tb-col-tools text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() =>
                                    navigate(`/admin/batches/${id}`)
                                  }
                                >
                                  View / Manage
                                </button>
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
                        <li className="page-item">
                          <button
                            type="button"
                            className="page-link"
                            onClick={() =>
                              handlePageChange(pagination.page - 1)
                            }
                            disabled={pagination.page <= 1}
                          >
                            Prev
                          </button>
                        </li>
                        {Array.from({
                          length: pagination.totalPages || 1,
                        }).map((_, idx) => {
                          const page = idx + 1;
                          return (
                            <li
                              key={page}
                              className={`page-item ${
                                page === pagination.page ? "active" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="page-link"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          );
                        })}
                        <li className="page-item">
                          <button
                            type="button"
                            className="page-link"
                            onClick={() =>
                              handlePageChange(pagination.page + 1)
                            }
                            disabled={
                              pagination.page >= pagination.totalPages
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
                          <select
                            className="form-select"
                            value={pagination.page}
                            onChange={(e) =>
                              handlePageChange(Number(e.target.value) || 1)
                            }
                          >
                            {Array.from({
                              length: pagination.totalPages || 1,
                            }).map((_, idx) => (
                              <option key={idx + 1} value={idx + 1}>
                                {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>of {pagination.totalPages || 1}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* End Pagination */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchesListPage;

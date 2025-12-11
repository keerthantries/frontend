// src/features/batches/components/BulkEnrollPanel.jsx
import React, { useState } from "react";
import LearnerSelect from "./LearnerSelect";

const BulkEnrollPanel = ({ onBulkEnroll, loading }) => {
  const [learnerIds, setLearnerIds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [resultSummary, setResultSummary] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResultSummary(null);

    if (!learnerIds.length) {
      setError("Please select at least one learner.");
      return;
    }

    try {
      const result = await onBulkEnroll({
        learnerIds,
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        notes: notes || null,
      });
      setResultSummary(result);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Failed to bulk enroll learners. Please try again."
      );
    }
  };

  const failures = resultSummary?.results?.filter(
    (r) => r.status === "error"
  );

  return (
    <div className="card card-bordered">
      <div className="card-inner">
        <h6 className="title mb-2">Bulk Enroll</h6>
        <p className="text-soft small mb-3">
          Enroll multiple learners at once into this batch.
        </p>

        {error && (
          <div className="alert alert-danger py-1 mb-2">{error}</div>
        )}

        {resultSummary && (
          <div className="alert alert-info py-2 mb-3">
            <div className="small mb-1">
              Total: {resultSummary.total} | Success:{" "}
              {resultSummary.successCount} | Failed:{" "}
              {resultSummary.failureCount}
            </div>
            {failures && failures.length > 0 && (
              <ul className="small mb-0 ps-3">
                {failures.map((f, idx) => (
                  <li key={idx}>
                    {f.learnerId}: {f.message || "Unknown error"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-12">
            <label className="form-label">
              Learners <span className="text-danger">*</span>
            </label>
            <LearnerSelect
              multiple
              value={learnerIds}
              onChange={setLearnerIds}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Expiry Date</label>
            <input
              type="date"
              className="form-control"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="col-12">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="col-12">
            <button
              type="submit"
              className="btn btn-outline-primary"
              disabled={loading}
            >
              {loading ? "Bulk enrolling…" : "Bulk Enroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEnrollPanel;
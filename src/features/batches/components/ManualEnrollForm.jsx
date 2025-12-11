// src/features/batches/components/ManualEnrollForm.jsx
import React, { useState } from "react";
import LearnerSelect from "./LearnerSelect";

const ManualEnrollForm = ({ onEnroll, loading }) => {
  const [learnerId, setLearnerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!learnerId) {
      setError("Please select a learner.");
      return;
    }

    try {
      await onEnroll({
        learnerId,
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        notes: notes || null,
      });
      setSuccess("Learner enrolled successfully.");
      setNotes("");
      // keep selected learner & dates
      setTimeout(() => setSuccess(""), 1500);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Failed to enroll learner. Please try again."
      );
    }
  };

  return (
    <div className="card card-bordered mb-3">
      <div className="card-inner">
        <h6 className="title mb-2">Manual Enroll</h6>
        <p className="text-soft small mb-3">
          Enroll a single learner into this batch.
        </p>

        {error && (
          <div className="alert alert-danger py-1 mb-2">{error}</div>
        )}
        {success && (
          <div className="alert alert-success py-1 mb-2">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-12">
            <label className="form-label">
              Learner <span className="text-danger">*</span>
            </label>
            <LearnerSelect
              multiple={false}
              value={learnerId}
              onChange={setLearnerId}
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
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Enrolling…" : "Enroll Learner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEnrollForm;

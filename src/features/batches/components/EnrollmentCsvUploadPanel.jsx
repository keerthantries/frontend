// src/features/batches/components/EnrollmentCsvUploadPanel.jsx
import React, { useState } from "react";
import { searchLearners } from "../api/lookupApi";
import { bulkEnrollLearners } from "../api/batchesApi";

// Simple CSV parser (no complex quoting)
function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

const EnrollmentCsvUploadPanel = ({ batchId, onAfterImport }) => {
  const [file, setFile] = useState(null);
  const [adminStartDate, setAdminStartDate] = useState("");
  const [adminExpiryDate, setAdminExpiryDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setError("");
    setResult(null);

    try {
      setImporting(true);
      const text = await file.text();
      const rows = parseCsv(text);

      if (!rows.length) {
        setError("CSV file is empty or invalid.");
        return;
      }

      // Map emails to learnerIds using searchLearners
      const learnerIds = [];
      const failed = [];

      for (const row of rows) {
        const email =
          row.learnerEmail ||
          row.email ||
          row.LearnerEmail ||
          row["learner_email"];
        if (!email) {
          failed.push({
            learnerId: null,
            email: null,
            status: "error",
            message: "Missing learnerEmail column.",
          });
          continue;
        }

        // search learner by email
        const { data: learners } = await searchLearners({
          q: email,
          page: 1,
          limit: 1,
        });

        const learner = learners && learners.length ? learners[0] : null;
        if (!learner) {
          failed.push({
            learnerId: null,
            email,
            status: "error",
            message: "Learner not found",
          });
        } else {
          learnerIds.push({
            id: learner.id || learner._id,
            email,
            row,
          });
        }
      }

      if (!learnerIds.length) {
        setError(
          "No valid learners found in CSV. Check emails and try again."
        );
        return;
      }

      // We support both:
      // - Admin-level dates & notes (apply to all)
      // - Row-level overrides from CSV: startDate / expiryDate / notes
      //
      // Because backend bulk API takes ONE set of dates for all learners,
      // we'll use ADMIN fields as primary, and CSV row values only for
      // display in result panel (not for actual API call), to keep it simple.
      //
      // If you later upgrade backend to support per-learner dates in bulk,
      // you can adjust payload here.

      const payload = {
        learnerIds: learnerIds.map((l) => l.id),
        startDate: adminStartDate ? new Date(adminStartDate).toISOString() : null,
        expiryDate: adminExpiryDate
          ? new Date(adminExpiryDate).toISOString()
          : null,
        notes: adminNotes || null,
      };

      const { data } = await bulkEnrollLearners(batchId, payload);

      // combine backend results & local email mapping
      const combinedResults =
        data?.results?.map((r) => {
          const match = learnerIds.find((l) => l.id === r.leaderId || l.id === r.learnerId);
          return {
            ...r,
            email: match?.email || null,
          };
        }) || [];

      const allFailed = [...failed, ...combinedResults.filter((r) => r.status === "error")];

      setResult({
        total: data?.total ?? learnerIds.length,
        successCount: data?.successCount ?? 0,
        failureCount: data?.failureCount ?? allFailed.length,
        failures: allFailed,
      });

      if (typeof onAfterImport === "function") {
        onAfterImport();
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to process CSV file."
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card card-bordered mb-3">
      <div className="card-inner">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="card-title mb-0">Bulk Enroll via CSV</h6>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            className="small text-primary"
          >
            <em className="icon ni ni-download-cloud" /> CSV Format
          </a>
        </div>
        <p className="text-soft small mb-2">
          CSV columns: <code>learnerEmail,startDate,expiryDate,notes</code>.
          Admin dates below will apply to all learners (CSV row dates are only
          for reference for now).
        </p>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">CSV File</label>
            <input
              type="file"
              className="form-control"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Start Date (all)</label>
            <input
              type="date"
              className="form-control"
              value={adminStartDate}
              onChange={(e) => setAdminStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Expiry Date (all)</label>
            <input
              type="date"
              className="form-control"
              value={adminExpiryDate}
              onChange={(e) => setAdminExpiryDate(e.target.value)}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Notes (optional, all)</label>
            <textarea
              className="form-control"
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mb-2">{error}</div>
        )}

        {result && (
          <div className="alert alert-info py-2 mb-3">
            <div className="d-flex justify-content-between">
              <div>
                <strong>Imported:</strong> {result.total} &nbsp;|&nbsp;
                <strong>Success:</strong> {result.successCount} &nbsp;|&nbsp;
                <strong>Failed:</strong> {result.failureCount}
              </div>
            </div>
            {result.failures && result.failures.length > 0 && (
              <div className="mt-2">
                <strong>Failed Learners:</strong>
                <ul className="small mb-0 mt-1">
                  {result.failures.map((f, idx) => (
                    <li key={idx}>
                      {f.email || f.learnerId || "Unknown"} –{" "}
                      {f.message || "Error"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleUpload}
          disabled={importing}
        >
          {importing ? "Processing…" : "Upload & Enroll"}
        </button>
      </div>
    </div>
  );
};

export default EnrollmentCsvUploadPanel;

// src/features/batches/components/BatchMultiEnrollPanel.jsx
import React, { useEffect, useState } from "react";
import { searchLearners } from "../api/lookupApi";
import { bulkEnrollLearners } from "../api/batchesApi";

const BatchMultiEnrollPanel = ({ batchId, onEnrolled }) => {
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [search, setSearch] = useState("");
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const loadUnassigned = async () => {
    if (!showUnassigned) return;

    try {
      setLoading(true);
      setError("");

      const { data } = await searchLearners({
        q: search,
        page: 1,
        limit: 100,
        unassignedOnly: true, // key flag
      });

      setLearners(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load unassigned learners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnassigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnassigned]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEnrollSelected = async () => {
    if (!selectedIds.length) {
      setError("Select at least one learner to enroll.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await bulkEnrollLearners(batchId, {
        learnerIds: selectedIds,
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        notes: notes || null,
      });

      showSuccess(`Enrolled ${selectedIds.length} learner(s) successfully.`);
      setSelectedIds([]);
      setStartDate("");
      setExpiryDate("");
      setNotes("");

      // reload list so newly enrolled learners disappear
      await loadUnassigned();

      if (onEnrolled) onEnrolled();
    } catch (err) {
      console.error(err);
      setError("Failed to bulk enroll learners.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card card-bordered mb-3">
      <div className="card-inner">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="card-title mb-0">
            Multi-select Enroll (Unassigned Learners)
          </h6>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="toggle-unassigned"
              checked={showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="toggle-unassigned">
              Show Unassigned List
            </label>
          </div>
        </div>

        <p className="small text-soft mb-2">
          This list shows learners who are <strong>not assigned</strong> to any batch
          (backend uses <code>unassignedOnly=true</code>).
        </p>

        {error && <div className="alert alert-danger py-1 mb-2 small">{error}</div>}
        {successMsg && (
          <div className="alert alert-success py-1 mb-2 small">{successMsg}</div>
        )}

        {/* Search bar */}
        <div className="mb-2 d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search unassigned learners…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={loadUnassigned}
            disabled={loading}
          >
            Search
          </button>
        </div>

        {showUnassigned && (
          <>
            <div className="mb-2 small text-soft">
              Selected: {selectedIds.length}
            </div>

            {/* Learners list */}
            <div
              className="border rounded-3 p-2 mb-2"
              style={{ maxHeight: 260, overflowY: "auto" }}
            >
              {loading && (
                <div className="text-center small text-muted py-2">
                  Loading unassigned learners…
                </div>
              )}

              {!loading && !learners.length && (
                <div className="text-center small text-muted py-2">
                  No unassigned learners found.
                </div>
              )}

              {!loading &&
                learners.map((u) => {
                  const id = u.id || u._id;
                  const label = u.fullName || u.name || u.email || "Learner";
                  const checked = selectedIds.includes(id);

                  return (
                    <div
                      key={id}
                      className="d-flex align-items-center justify-content-between py-1 px-2 rounded-2 mb-1"
                      style={{
                        backgroundColor: checked ? "#f4f6ff" : "transparent",
                      }}
                    >
                      <div>
                        <div className="fw-semibold small">{label}</div>
                        {u.email && (
                          <div className="small text-soft">{u.email}</div>
                        )}
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelected(id)}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Common enrollment fields */}
            <div className="row g-2 mb-2">
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
            </div>

            <div className="mb-2">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEnrollSelected}
              disabled={saving || !selectedIds.length}
            >
              {saving ? "Enrolling…" : "Enroll Selected Learners"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BatchMultiEnrollPanel;

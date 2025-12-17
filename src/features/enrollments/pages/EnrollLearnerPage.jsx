// src/features/enrollments/pages/EnrollLearnerPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Layers3,
  Search,
  User,
  Users,
  Calendar,
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import {
  enrollLearnerToBatch,
  searchUnassignedLearners,
} from "../api/enrollmentsApi";
import { fetchBatches } from "../../batches/api/batchesApi";

const EnrollLearnerPage = () => {
  const navigate = useNavigate();

  // --- 1. User & Permissions ---
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const role = currentUser?.role;
  const canEnroll =
    role === "admin" || role === "subOrgAdmin" || role === "educator";

  // --- 2. State ---
  const [batchSearch, setBatchSearch] = useState("");
  const [batchOptions, setBatchOptions] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedBatchLabel, setSelectedBatchLabel] = useState(null);

  const [learnerSearch, setLearnerSearch] = useState("");
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedLearnerLabel, setSelectedLearnerLabel] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- 3. API Actions ---

  const loadBatchOptions = async (q = "") => {
    setLoadingBatches(true);
    try {
      const { items } = await fetchBatches({
        q,
        status: "published",
        page: 1,
        limit: 20,
      });
      setBatchOptions(items || []);
    } catch (err) {
      console.error("Error loading batch options:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadLearnerOptions = async (q = "") => {
    if (!selectedBatchId) return;
    setLoadingLearners(true);
    try {
      const items = await searchUnassignedLearners({
        q,
        page: 1,
        limit: 50,
      });
      setLearnerOptions(items || []);
    } catch (err) {
      console.error("Error loading learner options:", err);
    } finally {
      setLoadingLearners(false);
    }
  };

  // --- 4. Effects (Debouncing) ---

  // Initial load
  useEffect(() => {
    loadBatchOptions("");
  }, []);

  // Debounce Batch Search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBatchOptions(batchSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [batchSearch]);

  // Debounce Learner Search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLearnerOptions(learnerSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [learnerSearch, selectedBatchId]);

  // --- 5. Handlers ---

  const handleBatchSearch = (e) => setBatchSearch(e.target.value);
  const handleLearnerSearch = (e) => setLearnerSearch(e.target.value);

  const handleBatchChange = (e) => {
    const value = e.target.value;
    setSelectedBatchId(value);
    
    // Reset learner selection when batch changes
    setSelectedLearnerId("");
    setSelectedLearnerLabel(null);
    setLearnerOptions([]);
    setLearnerSearch("");

    const found = batchOptions.find((b) => b.id === value);
    if (found) {
      const label = `${found.name}`;
      const sub = found.courseTitle || found.course?.title || "Course";
      setSelectedBatchLabel({ name: label, course: sub });
    } else {
      setSelectedBatchLabel(null);
    }
  };

  const handleLearnerChange = (e) => {
    const value = e.target.value;
    setSelectedLearnerId(value);
    const found = learnerOptions.find((u) => u.id === value);
    if (found) {
      const label = found.name;
      const sub = found.email;
      setSelectedLearnerLabel({ name: label, email: sub });
    } else {
      setSelectedLearnerLabel(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEnroll) {
      setError("You do not have permission to enroll learners.");
      return;
    }
    if (!selectedBatchId) return setError("Please select a batch.");
    if (!selectedLearnerId) return setError("Please select a learner.");

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await enrollLearnerToBatch(selectedBatchId, {
        learnerId: selectedLearnerId,
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        notes: notes || null,
      });

      setSuccess("Learner successfully enrolled.");
      setNotes(""); 
    } catch (err) {
      console.error("Enroll error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to enroll.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nk-block">
      {/* HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <div className="nk-block-title">
              <button
                type="button"
                className="btn btn-sm btn-outline-light me-2"
                onClick={() => navigate("/admin/enrolments")}
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Enrollment
              </button>
              <span className="h4 align-middle mb-0">
                <Users size={20} className="me-1" />
                Enroll a Learner
              </span>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Select a batch and a learner (unassigned) and enroll them in a single step.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-3" role="alert">
          <div className="d-flex align-items-center justify-content-between">
            <div>{success}</div>
            {selectedBatchId && (
              <button
                className="btn btn-xs btn-outline-success ms-3"
                onClick={() => navigate(`/admin/batches/${selectedBatchId}/enrollments`)}
              >
                View Batch List
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="nk-block">
        <div className="card card-bordered premium-card h-100">
          <div className="card-inner">
            
            {!canEnroll && (
              <div className="alert alert-warning mb-3">
                Only Admin, SubOrgAdmin or Educator roles can perform this action.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                
                {/* 1. SELECT BATCH */}
                <div className="col-12">
                  <h6 className="title overline-title text-soft">1. Select Batch</h6>
                  
                  <div className="p-3 bg-lighter rounded-3 border border-light mt-2">
                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label">Batch <span className="text-danger">*</span></label>
                        <div className="form-control-wrap">
                          <select
                            className="form-select"
                            value={selectedBatchId}
                            onChange={handleBatchChange}
                            disabled={saving}
                          >
                            <option value="">Choose a batch...</option>
                            {batchOptions.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-note d-flex align-items-start mt-2">
                          <Info size={14} className="me-1 mt-1 flex-shrink-0 text-soft" />
                          <span className="text-soft small">Only <strong>published</strong> or <strong>ongoing</strong> batches are listed here.</span>
                        </div>
                      </div>

                      <div className="col-md-5">
                         <label className="form-label">Search Batches</label>
                         <div className="form-control-wrap">
                            <div className="form-icon form-icon-left">
                              {loadingBatches ? <span className="spinner-border spinner-border-sm text-soft"/> : <Search size={16}/>}
                            </div>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Search by batch / course..." 
                              value={batchSearch}
                              onChange={handleBatchSearch}
                              disabled={saving} // Removed loading disabled check
                            />
                         </div>
                      </div>

                      {/* Selected Batch Feedback Card */}
                      {selectedBatchLabel && (
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-white rounded border border-success border-opacity-25">
                            <div className="user-avatar bg-success-dim text-success me-3">
                              <Layers3 size={20} />
                            </div>
                            <div>
                              <h6 className="title mb-0 text-dark">{selectedBatchLabel.name}</h6>
                              <span className="sub-text small">{selectedBatchLabel.course}</span>
                            </div>
                            <div className="ms-auto text-success">
                              <CheckCircle2 size={18} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SELECT LEARNER */}
                <div className="col-12">
                  <h6 className="title overline-title text-soft">2. Select Learner (unassigned)</h6>

                  <div className="p-3 bg-lighter rounded-3 border border-light mt-2">
                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label">Learner <span className="text-danger">*</span></label>
                        <div className="form-control-wrap">
                          <select
                            className="form-select"
                            value={selectedLearnerId}
                            onChange={handleLearnerChange}
                            disabled={!selectedBatchId || saving}
                          >
                            <option value="">
                              {!selectedBatchId ? "Select a batch first..." : "Choose learner..."}
                            </option>
                            {learnerOptions.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} — {u.email}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-note d-flex align-items-start mt-2">
                          <Info size={14} className="me-1 mt-1 flex-shrink-0 text-soft" />
                          <span className="text-soft small">Showing only <strong>unassigned</strong> learners to prevent duplicates.</span>
                        </div>
                      </div>

                      <div className="col-md-5">
                         <label className="form-label">Search Learners</label>
                         <div className="form-control-wrap">
                            <div className="form-icon form-icon-left">
                              {loadingLearners ? <span className="spinner-border spinner-border-sm text-soft"/> : <Search size={16}/>}
                            </div>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Search by name / email..." 
                              value={learnerSearch}
                              onChange={handleLearnerSearch}
                              disabled={!selectedBatchId || saving} 
                            />
                         </div>
                      </div>

                      {/* Selected Learner Feedback Card */}
                      {selectedLearnerLabel && (
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-white rounded border border-success border-opacity-25">
                            <div className="user-avatar bg-info-dim text-info me-3">
                              <User size={20} />
                            </div>
                            <div>
                              <h6 className="title mb-0 text-dark">{selectedLearnerLabel.name}</h6>
                              <span className="sub-text small">{selectedLearnerLabel.email}</span>
                            </div>
                            <div className="ms-auto text-success">
                              <CheckCircle2 size={18} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DETAILS */}
                <div className="col-12">
                  <h6 className="title overline-title text-soft">3. Enrollment Details</h6>

                  <div className="row g-3 mt-1">
                    <div className="col-md-4">
                      <label className="form-label">Start Date</label>
                      <div className="form-control-wrap">
                        <input
                          type="date"
                          className="form-control"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <div className="form-note small text-soft mt-1">Leave empty to use batch start date.</div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Expiry Date</label>
                      <div className="form-control-wrap">
                        <input
                          type="date"
                          className="form-control"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <div className="form-note small text-soft mt-1">Leave empty to use batch end date.</div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Notes</label>
                      <div className="form-control-wrap">
                         <input
                           type="text"
                           className="form-control"
                           placeholder="Optional note..."
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                           disabled={saving}
                         />
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="col-12 mt-4">
                  <div className="nk-block-between nk-block-tools pt-3 border-top">
                    <div className="nk-block-des text-soft small">
                       Enrollments are stored per batch.
                    </div>
                    <ul className="nk-block-tools g-3">
                      <li>
                        <button
                          type="button"
                          className="btn btn-outline-light"
                          onClick={() => navigate("/admin/enrolments")}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </li>
                      <li>
                        <button
                          type="submit"
                          className="btn btn-primary d-inline-flex align-items-center"
                          disabled={saving || !canEnroll || !selectedBatchId || !selectedLearnerId}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1"/> Enrolling...
                            </>
                          ) : (
                            <>
                              <ClipboardList size={16} className="me-1"/>
                              Enroll Learner
                              <ArrowRight size={16} className="ms-1"/>
                            </>
                          )}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollLearnerPage;
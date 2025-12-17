// src/features/enrollments/pages/BatchEnrollmentsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Users,
  UserPlus,
  Search,
  Calendar,
  AlertCircle,
  BookOpen,
  Wifi,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";

import { fetchBatchById } from "../../batches/api/batchesApi";
// Import User API for name resolution
import { fetchUserById } from "../../userManagement/api/usersApi"; 
import {
  fetchBatchEnrollments,
  enrollLearnerToBatch,
  searchUnassignedLearners,
  updateEnrollment, //
  deleteEnrollment  //
} from "../api/enrollmentsApi";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const BatchEnrollmentsPage = () => {
  const params = useParams();
  const batchId = params.batchId || params.id;
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const role = currentUser?.role;
  const canModify =
    role === "admin" || role === "subOrgAdmin" || role === "educator";

  // --- STATE ---
  const [batch, setBatch] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(false);

  const [enrollments, setEnrollments] = useState([]);
  
  // Cache for fetched user details (Learners AND Admins/Enrollers)
  // Maps ID -> { name, email }
  const [userDetailsMap, setUserDetailsMap] = useState({});

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({ status: "all" });
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingEnrollmentId, setEditingEnrollmentId] = useState(null);

  // Form Fields
  const [learnerSearch, setLearnerSearch] = useState("");
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [loadingLearners, setLoadingLearners] = useState(false);
  
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedLearnerName, setSelectedLearnerName] = useState(""); 
  
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("confirmed");
  
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────
  // LOADERS
  // ─────────────────────────────
  const loadBatch = async () => {
    try {
      setLoadingBatch(true);
      const data = await fetchBatchById(batchId);
      setBatch(data || null);
    } catch (err) {
      console.error("BatchEnrollmentsPage loadBatch error:", err);
      // Silent fail or minor toast usually, but here we set error
      // setError(err?.response?.data?.message || "Failed to load batch.");
    } finally {
      setLoadingBatch(false);
    }
  };

  const loadEnrollments = async ({ page = pagination.page } = {}) => {
    try {
      setLoadingEnrollments(true);
      setError("");
      
      // Fetching data from API
      const { items, pagination: pag } = await fetchBatchEnrollments(batchId, {
        status: filters.status,
        page,
        limit: pagination.limit,
      });
      
      setEnrollments(items || []);
      setPagination({
        page: pag?.page || page,
        limit: pag?.limit || pagination.limit,
        total: pag?.total || items?.length || 0,
        totalPages: pag?.totalPages || 1,
      });
    } catch (err) {
      console.error("BatchEnrollmentsPage loadEnrollments error:", err);
      setError("Failed to load enrollments.");
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // ─────────────────────────────
  // DATA ENRICHMENT (Fetch Names for Learners AND Enrollers)
  // ─────────────────────────────
  useEffect(() => {
    const fetchMissingUserDetails = async () => {
      // 1. Identify missing Learners
      const missingLearnerIds = enrollments
        .filter(en => !en.learnerName && en.learnerId && !userDetailsMap[en.learnerId])
        .map(en => en.learnerId);

      // 2. Identify missing Enrollers (Admins/Educators)
      // Checks if 'enrolledByName' is missing, 'enrolledBy' exists, and we haven't fetched it yet.
      const missingEnrollerIds = enrollments
        .filter(en => !en.enrolledByName && en.enrolledBy && !userDetailsMap[en.enrolledBy])
        .map(en => en.enrolledBy);

      // Combine and Unique
      const allMissingIds = [...new Set([...missingLearnerIds, ...missingEnrollerIds])];

      if (allMissingIds.length === 0) return;

      const newDetails = {};
      
      // Fetch concurrently
      await Promise.all(allMissingIds.map(async (id) => {
        try {
          const user = await fetchUserById(id); //
          if (user) {
            newDetails[id] = {
              name: user.name || user.fullName || "Unknown",
              email: user.email
            };
          }
        } catch (err) {
          console.warn(`Could not fetch details for user ID: ${id}`, err);
          newDetails[id] = { name: "Unknown User", email: "N/A" };
        }
      }));

      if (Object.keys(newDetails).length > 0) {
        setUserDetailsMap(prev => ({ ...prev, ...newDetails }));
      }
    };

    if (enrollments.length > 0) {
      fetchMissingUserDetails();
    }
  }, [enrollments, userDetailsMap]);

  // Initial Load
  useEffect(() => {
    loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    loadEnrollments({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, filters.status]);

  // ─────────────────────────────
  // FILTERS / PAGINATION
  // ─────────────────────────────
  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > (pagination.totalPages || 1)) return;
    loadEnrollments({ page: nextPage });
  };

  // ─────────────────────────────
  // ACTIONS (CRUD)
  // ─────────────────────────────
  
  // 1. OPEN MODAL (CREATE)
  const openCreateModal = () => {
    if (!canModify) return setError("Permission denied.");
    setError(""); setSuccess("");
    setModalMode("create");
    setEditingEnrollmentId(null);
    
    // Reset Form
    setSelectedLearnerId("");
    setSelectedLearnerName("");
    setLearnerSearch("");
    setLearnerOptions([]);
    setStartDate("");
    setExpiryDate("");
    setNotes("");
    setStatus("confirmed"); 
    
    setShowModal(true);
  };

  // 2. OPEN MODAL (EDIT)
  const openEditModal = (enrollment) => {
    if (!canModify) return setError("Permission denied.");
    setError(""); setSuccess("");
    setModalMode("edit");
    setEditingEnrollmentId(enrollment.id);

    // Resolve Name for the modal
    const details = userDetailsMap[enrollment.learnerId] || {};
    const resolvedName = enrollment.learnerName || details.name || enrollment.learnerEmail;

    // Pre-fill Form
    setSelectedLearnerId(enrollment.learnerId);
    setSelectedLearnerName(resolvedName);
    
    const start = enrollment.startDate ? new Date(enrollment.startDate).toISOString().split('T')[0] : "";
    const end = enrollment.expiryDate ? new Date(enrollment.expiryDate).toISOString().split('T')[0] : "";
    
    setStartDate(start);
    setExpiryDate(end);
    setNotes(enrollment.notes || "");
    setStatus(enrollment.status || "confirmed");

    setShowModal(true);
  };

  // 3. DELETE
  const handleDelete = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to remove this learner from the batch?")) return;
    try {
        await deleteEnrollment(batchId, enrollmentId); //
        setSuccess("Enrollment removed successfully.");
        loadEnrollments(); // Refresh Data
        loadBatch();       // Update Counts
    } catch (err) {
        console.error("Delete error:", err);
        setError("Failed to delete enrollment.");
    }
  };

  // 4. SUBMIT FORM (CREATE OR UPDATE)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === 'create' && !selectedLearnerId) {
      return setError("Please select a learner.");
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        notes: notes || null,
        status: status 
      };

      if (modalMode === 'create') {
         await enrollLearnerToBatch(batchId, {
           learnerId: selectedLearnerId,
           ...payload
         }); //
         setSuccess("Learner enrolled successfully.");
      } else {
         await updateEnrollment(batchId, editingEnrollmentId, payload); //
         setSuccess("Enrollment updated successfully.");
      }

      setShowModal(false);
      loadEnrollments(); // Refresh List (Update Status/Data)
      if (modalMode === 'create') loadBatch(); // Update Counts
    } catch (err) {
      console.error("Form submit error:", err);
      setError(err?.response?.data?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  // Helper: Search Learners for Create Mode
  const handleSearchLearners = async (e) => {
    e.preventDefault();
    setLoadingLearners(true);
    try {
      const items = await searchUnassignedLearners({
        q: learnerSearch,
        page: 1,
        limit: 50,
      }); //
      setLearnerOptions(items || []);
    } catch (err) {
      console.error("searchUnassignedLearners error:", err);
    } finally {
      setLoadingLearners(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
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
                onClick={() => navigate(`/admin/batches/${batchId}`)}
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Batch
              </button>
              <span className="h4 align-middle mb-0">
                <ClipboardList size={20} className="me-1" />
                Manage Enrollments
              </span>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Manage learners assigned to this batch. Capacity & status rules
                are enforced by the backend.
              </p>
            </div>
          </div>

          {canModify && (
            <div className="nk-block-head-content">
              <div className="nk-block-tools">
                <ul className="nk-block-tools g-3">
                  <li>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={openCreateModal}
                    >
                      <UserPlus size={16} className="me-1" />
                      Enroll Learner
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-3" role="alert">
          {success}
        </div>
      )}

      {/* BATCH SUMMARY CARD */}
      <div className="nk-block mb-3">
        <div className="card card-bordered">
          <div className="card-inner">
             <div className="d-flex flex-column flex-md-row justify-content-between align-items-start">
                {/* Left: Batch & Course Info */}
                <div className="mb-3 mb-md-0">
                    <h5 className="title mb-1">{batch?.name || "Loading Batch..."}</h5>
                    <div className="d-flex flex-wrap gap-3 text-soft small">
                        <div className="d-flex align-items-center">
                            <BookOpen size={14} className="me-1" />
                            <span className="fw-medium text-dark me-1">Course:</span> 
                            {batch?.courseTitle || batch?.courseName || batch?.course?.title || "—"}
                        </div>
                        <div className="d-flex align-items-center">
                            <Wifi size={14} className="me-1" />
                            <span className="fw-medium text-dark me-1">Mode:</span> 
                            <span className="text-capitalize">{batch?.mode || "—"}</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="fw-medium text-dark me-1">Status:</span> 
                            <span className={`badge badge-dot ${batch?.status === 'published' ? 'bg-success' : 'bg-warning'} text-capitalize`}>
                                {batch?.status || "—"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats & Dates */}
                <div className="text-md-end">
                    <div className="badge badge-dim bg-outline-primary mb-1 p-2 px-3" style={{fontSize: '0.9em'}}>
                        <Users size={14} className="me-1" />
                        <span className="fw-bold">{batch?.enrollmentCount || 0}</span> 
                        <span className="text-soft mx-1">/</span> 
                        {batch?.capacity ? batch.capacity : "Unlimited"} Enrolled
                    </div>
                    <div className="text-soft small mt-1">
                        <Calendar size={12} className="me-1" />
                        {formatDate(batch?.startDate)} – {formatDate(batch?.endDate)}
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* FILTERS + TABLE */}
      <div className="nk-block">
        <div className="card card-bordered">
          
          {/* Toolbar */}
          <div className="card-inner border-bottom py-2">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                 <span className="text-soft small me-2">Filter By Status:</span>
                 <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "140px" }}
                    value={filters.status}
                    onChange={handleStatusChange}
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
              </div>
              <div className="text-end small text-soft d-none d-md-block">
                * Dates shown are enrollment specific or (Batch Default)
              </div>
            </div>
          </div>

          <div className="card-inner p-0">
            <div className="nk-tb-list nk-tb-ulist">
              <div className="nk-tb-item nk-tb-head">
                <div className="nk-tb-col">
                  <span className="sub-text">Learner Name</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Status</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Dates (Start - End)</span>
                </div>
                <div className="nk-tb-col tb-col-md">
                  <span className="sub-text">Enrolled By</span>
                </div>
                <div className="nk-tb-col nk-tb-col-tools text-end">
                  <span className="sub-text">Actions</span>
                </div>
              </div>

              {loadingEnrollments ? (
                <div className="nk-tb-item">
                  <div className="nk-tb-col text-center py-4">
                    <div className="spinner-border spinner-border-sm me-1" />
                    Loading enrollments...
                  </div>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="nk-tb-item">
                  <div className="nk-tb-col text-center py-4">
                    <AlertCircle size={18} className="me-1 text-soft" />
                    No enrollments found for this filter.
                  </div>
                </div>
              ) : (
                enrollments.map((en) => {
                    // Date Fallback Logic
                    const start = en.startDate || batch?.startDate;
                    const end = en.expiryDate || batch?.endDate;
                    const isDefaultDates = !en.startDate && !en.expiryDate;

                    // --- RESOLVE LEARNER NAME ---
                    const learnerDetails = userDetailsMap[en.learnerId] || {};
                    const learnerName = en.learnerName || learnerDetails.name || "Unknown Learner";
                    const learnerEmail = en.learnerEmail || learnerDetails.email || (en.learnerId ? `ID: ${en.learnerId}` : "No Email");

                    // --- RESOLVE ENROLLED BY NAME ---
                    // Try direct name -> Try Map lookup -> Fallback to "System"
                    const enrollerDetails = userDetailsMap[en.enrolledBy] || {};
                    const enrollerName = en.enrolledByName || enrollerDetails.name || (en.enrolledBy ? "System/Admin" : "System");

                    return (
                      <div className="nk-tb-item" key={en.id}>
                        {/* 1. LEARNER */}
                        <div className="nk-tb-col">
                          <div className="user-card">
                            <div className="user-avatar xs bg-primary-dim">
                              <span>
                                {(learnerName || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="user-info">
                              <span className="tb-lead">
                                {learnerName}
                              </span>
                              <span className="sub-text">
                                {learnerEmail}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. STATUS */}
                        <div className="nk-tb-col tb-col-md">
                          <span
                            className={`badge badge-dot ${
                              en.status === "confirmed"
                                ? "bg-success"
                                : en.status === "pending"
                                ? "bg-warning"
                                : en.status === "cancelled"
                                ? "bg-danger"
                                : "bg-info"
                            } text-capitalize`}
                          >
                            {en.status}
                          </span>
                        </div>

                        {/* 3. DATES */}
                        <div className="nk-tb-col tb-col-md">
                          <div className="small">
                             <span className="tb-amount">{formatDate(start)} <span className="text-soft">-</span> {formatDate(end)}</span>
                             {isDefaultDates && <span className="text-soft ms-1" style={{fontSize: '0.8em'}}>(Default)</span>}
                          </div>
                        </div>

                        {/* 4. ENROLLED BY (FIXED) */}
                        <div className="nk-tb-col tb-col-md">
                          <span className="tb-sub">{enrollerName}</span>
                          <span className="sub-text">{formatDate(en.enrolledAt)}</span>
                        </div>

                        {/* 5. ACTIONS */}
                        <div className="nk-tb-col nk-tb-col-tools">
                            <ul className="nk-tb-actions gx-1">
                              {canModify && (
                                <>
                                    <li className="nk-tb-action-hidden">
                                        <button className="btn btn-trigger btn-icon" onClick={() => openEditModal(en)} title="Edit Details">
                                            <Edit size={16} />
                                        </button>
                                    </li>
                                    <li className="nk-tb-action-hidden">
                                        <button className="btn btn-trigger btn-icon text-danger" onClick={() => handleDelete(en.id)} title="Remove">
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                    <li>
                                        <div className="drodown">
                                            <button className="btn btn-icon btn-trigger dropdown-toggle" data-bs-toggle="dropdown">
                                                <MoreVertical size={16} />
                                            </button>
                                            <div className="dropdown-menu dropdown-menu-end">
                                                <ul className="link-list-opt no-bdr">
                                                    <li><a href="#edit" onClick={(e) => { e.preventDefault(); openEditModal(en); }}><Edit size={14} className="me-2"/> Edit</a></li>
                                                    <li><a href="#remove" onClick={(e) => { e.preventDefault(); handleDelete(en.id); }} className="text-danger"><Trash2 size={14} className="me-2"/> Remove</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </li>
                                </>
                              )}
                            </ul>
                        </div>
                      </div>
                    );
                })
              )}
            </div>
          </div>

          {/* PAGINATION */}
          <div className="card-inner border-top d-flex justify-content-between align-items-center">
            <div className="small text-soft">
              Page {pagination.page} of {pagination.totalPages || 1} •{" "}
              Total {pagination.total} enrollments
            </div>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Prev
                </button>
              </li>
              <li
                className={`page-item ${
                  pagination.page >= (pagination.totalPages || 1)
                    ? "disabled"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────
          MODAL (Create / Edit)
         ───────────────────────────── */}
      {showModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title d-flex align-items-center">
                    {modalMode === 'create' ? <UserPlus size={18} className="me-2" /> : <Edit size={18} className="me-2" />}
                    {modalMode === 'create' ? "Enroll Learner" : "Edit Enrollment"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeModal}
                    disabled={saving}
                  />
                </div>

                <div className="modal-body">
                  <form onSubmit={handleFormSubmit}>
                    
                    {/* SECTION: LEARNER SELECTION (Only Create) / INFO (Edit) */}
                    <div className="row g-3">
                      <div className="col-12">
                        <h6 className="title overline-title text-soft">Learner Details</h6>
                      </div>

                      {modalMode === 'create' ? (
                          <>
                            <div className="col-md-7">
                                <label className="form-label">Find Learner</label>
                                <div className="input-group">
                                    <div className="input-group-text"><Search size={16}/></div>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Name, email..." 
                                        value={learnerSearch} 
                                        onChange={(e) => setLearnerSearch(e.target.value)}
                                        disabled={saving}
                                    />
                                    <button className="btn btn-outline-secondary" type="button" onClick={handleSearchLearners} disabled={loadingLearners || saving}>
                                        {loadingLearners ? "..." : "Search"}
                                    </button>
                                </div>
                                <div className="form-note small text-soft">Only unassigned learners appear here.</div>
                            </div>
                            <div className="col-md-5">
                                <label className="form-label">Select Result</label>
                                <select 
                                    className="form-select" 
                                    value={selectedLearnerId} 
                                    onChange={(e) => setSelectedLearnerId(e.target.value)}
                                    disabled={saving || learnerOptions.length === 0}
                                >
                                    <option value="">{learnerOptions.length ? "Choose..." : "No results"}</option>
                                    {learnerOptions.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                                    ))}
                                </select>
                            </div>
                          </>
                      ) : (
                          // Edit Mode: Static Info
                          <div className="col-12">
                              <div className="alert alert-light d-flex align-items-center">
                                  <div className="user-avatar bg-primary-dim me-3">
                                      <span>{(selectedLearnerName || "L").charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                      <span className="d-block fw-bold text-dark">{selectedLearnerName}</span>
                                      <span className="small text-soft">Learner ID: {selectedLearnerId}</span>
                                  </div>
                              </div>
                          </div>
                      )}
                    </div>

                    <hr className="my-4" />

                    {/* SECTION: CONFIGURATION */}
                    <div className="row g-3">
                        <div className="col-12">
                            <h6 className="title overline-title text-soft">Configuration</h6>
                        </div>

                        <div className="col-md-4">
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <div className="form-control-wrap">
                                    <select 
                                        className="form-select" 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value)}
                                        disabled={saving}
                                    >
                                        <option value="confirmed">Confirmed</option>
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="form-note small text-soft">Manually override state.</div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    disabled={saving}
                                />
                                <div className="form-note small text-soft">Leave blank for Batch Start ({formatDate(batch?.startDate)})</div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="form-group">
                                <label className="form-label">Expiry Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={expiryDate} 
                                    onChange={(e) => setExpiryDate(e.target.value)} 
                                    disabled={saving}
                                />
                                <div className="form-note small text-soft">Leave blank for Batch End ({formatDate(batch?.endDate)})</div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2" 
                                    placeholder="Optional remarks..."
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)} 
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-0 px-0 pb-0 mt-3">
                        <div className="d-flex justify-content-between w-100 align-items-center">
                            <div className="text-soft small">Enrollment will respect batch capacity rules.</div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-outline-light" onClick={closeModal} disabled={saving}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <><span className="spinner-border spinner-border-sm me-1"/> Saving...</> : (modalMode === 'create' ? "Enroll" : "Update")}
                                </button>
                            </div>
                        </div>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default BatchEnrollmentsPage;
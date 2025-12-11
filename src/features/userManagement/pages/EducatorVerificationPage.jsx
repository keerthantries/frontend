// src/features/userManagement/pages/EducatorVerificationPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchEducatorProfile,
  updateEducatorProfile,
  uploadEducatorDocument,
  deleteEducatorDocument,
  verifyEducator,
} from "../api/educatorsApi";

import {
  ArrowLeft,
  User,
  Mail,
  Building2,
  FileText,
  FilePlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

const defaultEducatorProfile = {
  title: "",
  bio: "",
  highestQualification: "",
  yearsOfExperience: "",
  expertiseAreas: "",
  languages: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

const EducatorVerificationPage = () => {
  const { id } = useParams(); // educator userId
  const navigate = useNavigate();

  const [educator, setEducator] = useState(null);
  const [profile, setProfile] = useState(defaultEducatorProfile);
  const [documents, setDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifiedAt, setVerifiedAt] = useState(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // current user (for role checks)
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    currentUser = null;
  }
  const currentRole = currentUser?.role;
  const isAdmin = currentRole === "admin";
  const isSubOrgAdmin = currentRole === "subOrgAdmin";

  useEffect(() => {
    let isMounted = true;

    async function loadEducator() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const data = await fetchEducatorProfile(id);
        if (!isMounted) return;

        setEducator(data);

        const ep = data.educatorProfile || {};
        setProfile({
          title: ep.title || "",
          bio: ep.bio || "",
          highestQualification: ep.highestQualification || "",
          yearsOfExperience:
            ep.yearsOfExperience != null ? String(ep.yearsOfExperience) : "",
          expertiseAreas: (ep.expertiseAreas || []).join(", "),
          languages: (ep.languages || []).join(", "),
          linkedinUrl: ep.linkedinUrl || "",
          portfolioUrl: ep.portfolioUrl || "",
        });

        setDocuments(data.documents || []);
        setVerificationStatus(data.verificationStatus || "pending");
        setVerificationNotes(data.verificationNotes || "");
        setVerifiedAt(data.verifiedAt || null);
      } catch (err) {
        console.error("Error loading educator profile:", err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load educator details.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEducator();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isAdmin && !isSubOrgAdmin) {
      setError("Only Admin or Sub-Org Admin can update educator profile.");
      return;
    }

    setSavingProfile(true);
    setError("");
    setSuccess("");

    const payload = {
      title: profile.title.trim(),
      bio: profile.bio.trim(),
      highestQualification: profile.highestQualification.trim(),
      yearsOfExperience: profile.yearsOfExperience
        ? Number(profile.yearsOfExperience)
        : null,
      expertiseAreas: profile.expertiseAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      languages: profile.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      linkedinUrl: profile.linkedinUrl.trim(),
      portfolioUrl: profile.portfolioUrl.trim(),
    };

    try {
      const res = await updateEducatorProfile(id, payload);
      // assume backend returns updated educator
      const updated = res?.data || res?.educator || res;
      if (updated) {
        setEducator((prev) => ({ ...prev, educatorProfile: payload }));
      }
      setSuccess("Educator profile updated successfully.");
    } catch (err) {
      console.error("Error saving educator profile:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update educator profile.";
      setError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const [docForm, setDocForm] = useState({
    file: null,
    type: "certification",
    title: "",
    description: "",
  });

  const handleDocFieldChange = (e) => {
    const { name, value } = e.target;
    setDocForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDocForm((prev) => ({ ...prev, file }));
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.file) {
      setError("Please choose a file to upload.");
      return;
    }

    if (!isAdmin && !isSubOrgAdmin) {
      // you can allow educator self-upload by relaxing this check later
      setError("Only Admin or Sub-Org Admin can upload documents here.");
      return;
    }

    setUploadingDoc(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", docForm.file);
      formData.append("type", docForm.type);
      formData.append("title", docForm.title);
      formData.append("description", docForm.description);

      const res = await uploadEducatorDocument(id, formData);
      const newDoc = res?.data || res?.document || res?.doc || null;

      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev]);
      }

      setDocForm({
        file: null,
        type: "certification",
        title: "",
        description: "",
      });
      setSuccess("Document uploaded successfully.");
    } catch (err) {
      console.error("Error uploading document:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload document.";
      setError(message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;

    setError("");
    setSuccess("");

    try {
      await deleteEducatorDocument(id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId && d._id !== docId));
      setSuccess("Document deleted.");
    } catch (err) {
      console.error("Error deleting document:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete document.";
      setError(message);
    }
  };

  const handleSaveVerification = async (e) => {
    e.preventDefault();

    if (!isAdmin && !isSubOrgAdmin) {
      setError("Only Admin or Sub-Org Admin can update verification status.");
      return;
    }

    if (!verificationStatus) {
      setError("Please choose a verification status.");
      return;
    }

    setSavingVerification(true);
    setError("");
    setSuccess("");

    try {
      const res = await verifyEducator(id, {
        status: verificationStatus,
        notes: verificationNotes,
      });

      const updated = res?.data || res?.educator || res;
      const newStatus = updated?.verificationStatus || verificationStatus;
      const newNotes = updated?.verificationNotes || verificationNotes;

      setVerificationStatus(newStatus);
      setVerificationNotes(newNotes);
      setVerifiedAt(updated?.verifiedAt || new Date().toISOString());
      setSuccess("Verification status updated.");
    } catch (err) {
      console.error("Error updating verification:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update verification status.";
      setError(message);
    } finally {
      setSavingVerification(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const renderStatusBadge = () => {
    const s = (verificationStatus || "").toLowerCase();
    let cls = "badge bg-secondary";
    if (s === "approved") cls = "badge bg-success-dim text-success";
    else if (s === "pending") cls = "badge bg-warning-dim text-warning";
    else if (s === "rejected") cls = "badge bg-danger-dim text-danger";

    return (
      <span className={cls} style={{ fontSize: "0.75rem" }}>
        {verificationStatus || "pending"}
      </span>
    );
  };

  if (loading && !educator) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <div className="text-soft mt-2 small">Loading educator...</div>
      </div>
    );
  }

  if (error && !educator) {
    return <p className="text-danger">{error}</p>;
  }

  if (!educator) return null;

  const initials =
    educator.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "E";

  const organizationName =
    educator.orgName ||
    educator.organizationName ||
    educator.subOrgName ||
    educator.subOrgId ||
    "Main Org";

  return (
    <>
      {/* PAGE HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <div className="d-flex align-items-center gap-2 mb-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-light border-0 p-1 me-1"
                onClick={() => navigate(-1)}
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="nk-block-title page-title mb-0">
                Educator Verification /{" "}
                <strong className="text-primary small">
                  {educator.name || "Educator"}
                </strong>
              </h3>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Review educator profile, documents and set verification status.
              </p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="align-self-center d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={16} className="text-success" />
                Status: {renderStatusBadge()}
              </span>
              <button
                type="button"
                className="btn btn-outline-light btn-sm d-inline-flex align-items-center"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} className="me-1" />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="alert alert-danger mb-3 d-flex align-items-start" role="alert">
          <AlertCircle size={18} className="me-2 mt-1" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-3 d-flex align-items-start" role="alert">
          <CheckCircle2 size={18} className="me-2 mt-1" />
          <div>{success}</div>
        </div>
      )}

      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner">
            {/* Educator summary header */}
            <div className="d-flex align-items-center mb-4">
              <div className="user-avatar bg-primary-dim me-3">
                <span>{initials}</span>
              </div>
              <div>
                <h5 className="mb-1 d-flex align-items-center gap-1">
                  <User size={18} className="text-primary" />
                  {educator.name || "-"}
                </h5>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <Mail size={14} className="text-primary" />
                  {educator.email || "-"}
                </div>
                <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                  <Building2 size={14} className="text-primary" />
                  Role: {educator.role || educator.userRole || "-"} · Org:{" "}
                  {organizationName}
                </div>
              </div>
            </div>

            {/* Progress / Steps */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">Profile completeness</div>
                        <div className="fw-bold">
                          {profile.bio && profile.highestQualification
                            ? "Good"
                            : "Incomplete"}
                        </div>
                      </div>
                      <span className="badge bg-outline-primary">Step 1</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">Documents uploaded</div>
                        <div className="fw-bold">
                          {documents.length} file
                          {documents.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span className="badge bg-outline-primary">Step 2</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">Verification status</div>
                        <div className="fw-bold">{renderStatusBadge()}</div>
                      </div>
                      <span className="badge bg-outline-primary">Step 3</span>
                    </div>
                    <div className="small text-muted mt-1">
                      {verifiedAt && <>Verified at: {formatDateTime(verifiedAt)}</>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs nav-tabs-s2 mb-3">
              <li className="nav-item">
                <button
                  type="button"
                  className={"nav-link" + (activeTab === "profile" ? " active" : "")}
                  onClick={() => setActiveTab("profile")}
                >
                  Profile & Bio
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={
                    "nav-link" + (activeTab === "experience" ? " active" : "")
                  }
                  onClick={() => setActiveTab("experience")}
                >
                  Qualifications & Experience
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={
                    "nav-link" + (activeTab === "documents" ? " active" : "")
                  }
                  onClick={() => setActiveTab("documents")}
                >
                  Documents
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={
                    "nav-link" + (activeTab === "verification" ? " active" : "")
                  }
                  onClick={() => setActiveTab("verification")}
                >
                  Verification Decision
                </button>
              </li>
            </ul>

            {/* TAB CONTENTS */}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="gy-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          value={profile.title}
                          onChange={handleProfileChange}
                          placeholder="Assistant Professor, Senior Trainer..."
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Highest Qualification</label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="highestQualification"
                          className="form-control"
                          value={profile.highestQualification}
                          onChange={handleProfileChange}
                          placeholder="M.Tech CSE, PhD in Physics..."
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Short Bio</label>
                      <div className="form-control-wrap">
                        <textarea
                          name="bio"
                          className="form-control"
                          rows="4"
                          value={profile.bio}
                          onChange={handleProfileChange}
                          placeholder="Write a short professional summary for this educator..."
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}

            {/* EXPERIENCE TAB */}
            {activeTab === "experience" && (
              <form onSubmit={handleSaveProfile} className="gy-3">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <div className="form-control-wrap">
                        <input
                          type="number"
                          min="0"
                          name="yearsOfExperience"
                          className="form-control"
                          value={profile.yearsOfExperience}
                          onChange={handleProfileChange}
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">
                        Expertise Areas (comma separated)
                      </label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="expertiseAreas"
                          className="form-control"
                          value={profile.expertiseAreas}
                          onChange={handleProfileChange}
                          placeholder="Data Structures, React, Node.js"
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">
                        Languages (comma separated)
                      </label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="languages"
                          className="form-control"
                          value={profile.languages}
                          onChange={handleProfileChange}
                          placeholder="English, Telugu"
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">LinkedIn URL</label>
                      <div className="form-control-wrap">
                        <input
                          type="url"
                          name="linkedinUrl"
                          className="form-control"
                          value={profile.linkedinUrl}
                          onChange={handleProfileChange}
                          placeholder="https://linkedin.com/in/..."
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Portfolio / Website</label>
                      <div className="form-control-wrap">
                        <input
                          type="url"
                          name="portfolioUrl"
                          className="form-control"
                          value={profile.portfolioUrl}
                          onChange={handleProfileChange}
                          placeholder="https://..."
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Experience"}
                  </button>
                </div>
              </form>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === "documents" && (
              <div className="row g-3">
                {/* Upload side */}
                <div className="col-md-5">
                  <h6 className="title mb-2 d-flex align-items-center gap-1">
                    <FilePlus size={18} className="text-primary" />
                    Upload Document
                  </h6>
                  <form onSubmit={handleUploadDocument} className="gy-2">
                    <div className="form-group">
                      <label className="form-label">File</label>
                      <div className="form-control-wrap">
                        <input
                          type="file"
                          className="form-control"
                          onChange={handleDocFileChange}
                          disabled={uploadingDoc}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <div className="form-control-wrap">
                        <select
                          name="type"
                          className="form-select"
                          value={docForm.type}
                          onChange={handleDocFieldChange}
                          disabled={uploadingDoc}
                        >
                          <option value="idProof">ID Proof</option>
                          <option value="degree">Degree / Qualification</option>
                          <option value="experience">Experience Letter</option>
                          <option value="certification">Certification</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          value={docForm.title}
                          onChange={handleDocFieldChange}
                          disabled={uploadingDoc}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <div className="form-control-wrap">
                        <textarea
                          name="description"
                          className="form-control"
                          rows="2"
                          value={docForm.description}
                          onChange={handleDocFieldChange}
                          disabled={uploadingDoc}
                        />
                      </div>
                    </div>

                    <div className="mt-2 d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary d-inline-flex align-items-center gap-1"
                        disabled={uploadingDoc}
                      >
                        {uploadingDoc ? (
                          "Uploading..."
                        ) : (
                          <>
                            <FilePlus size={16} />
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List side */}
                <div className="col-md-7">
                  <h6 className="title mb-2 d-flex align-items-center gap-1">
                    <FileText size={18} className="text-primary" />
                    Uploaded Documents
                  </h6>
                  {documents.length === 0 ? (
                    <p className="text-soft small mb-0">
                      No documents uploaded yet.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-middle">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Uploaded At</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => {
                            const docId = doc.id || doc._id;
                            const typeLabel =
                              doc.type || doc.documentType || "-";
                            const uploadedAt = formatDateTime(doc.uploadedAt);
                            return (
                              <tr key={docId}>
                                <td>
                                  <div className="d-flex flex-column">
                                    <span className="fw-bold">
                                      {doc.title || "-"}
                                    </span>
                                    {doc.description && (
                                      <span className="small text-muted">
                                        {doc.description}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-outline-primary text-capitalize">
                                    {typeLabel}
                                  </span>
                                </td>
                                <td>
                                  <span className="small">{uploadedAt}</span>
                                </td>
                                <td className="text-end">
                                  <div className="d-flex gap-1 justify-content-end">
                                    {doc.fileUrl && (
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-outline-primary btn-xs d-inline-flex align-items-center gap-1"
                                      >
                                        <FileText size={14} />
                                        View
                                      </a>
                                    )}
                                    {(isAdmin || isSubOrgAdmin) && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-xs d-inline-flex align-items-center gap-1"
                                        onClick={() =>
                                          handleDeleteDocument(docId)
                                        }
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VERIFICATION TAB */}
            {activeTab === "verification" && (
              <form onSubmit={handleSaveVerification} className="gy-3">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <div className="form-control-wrap d-flex align-items-center gap-2">
                        {(verificationStatus || "").toLowerCase() ===
                        "approved" ? (
                          <ShieldCheck size={18} className="text-success" />
                        ) : (verificationStatus || "").toLowerCase() ===
                          "rejected" ? (
                          <ShieldX size={18} className="text-danger" />
                        ) : (
                          <AlertCircle size={18} className="text-warning" />
                        )}
                        <select
                          className="form-select"
                          value={verificationStatus}
                          onChange={(e) =>
                            setVerificationStatus(e.target.value)
                          }
                          disabled={
                            savingVerification || (!isAdmin && !isSubOrgAdmin)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-note">
                        Only Admin / Sub-Org Admin can change status.
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="form-group">
                      <label className="form-label">
                        Verification Notes (visible to admins)
                      </label>
                      <div className="form-control-wrap">
                        <textarea
                          className="form-control"
                          rows="3"
                          value={verificationNotes}
                          onChange={(e) =>
                            setVerificationNotes(e.target.value)
                          }
                          disabled={
                            savingVerification || (!isAdmin && !isSubOrgAdmin)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary d-inline-flex align-items-center gap-1"
                    disabled={
                      savingVerification || (!isAdmin && !isSubOrgAdmin)
                    }
                  >
                    {savingVerification ? (
                      "Saving..."
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Save Verification Decision
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EducatorVerificationPage;

// src/features/userManagement/pages/EducatorVerificationPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  UploadCloud,
  Eye,
  Trash2,
  Clock,
  Briefcase,
  Tag,
  Globe2,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchEducatorProfile,
  updateEducatorProfile,
  uploadEducatorDocument,
  deleteEducatorDocument,
  verifyEducator,
  uploadEducatorAvatar, 
} from "../api/educatorsApi";

const QUALIFICATIONS = [
  "B.Tech / B.E",
  "M.Tech / M.E",
  "MCA",
  "B.Sc",
  "M.Sc",
  "Ph.D",
  "Diploma",
  "Certification Program",
];

const WORK_TYPES = [
  { value: "fullTime", label: "Full Time" },
  { value: "partTime", label: "Part Time" },
];

const SKILL_CATEGORY_SUGGESTIONS = [
  "Software Engineering",
  "Data Science & AI",
  "DevOps & Cloud",
  "UI/UX & Design",
  "Cybersecurity",
  "Business & Management",
  "Soft Skills / Communication",
];

const EXPERTISE_SUGGESTIONS = [
  "HTML",
  "CSS",
  "JavaScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "SQL",
  "Python",
  "Django",
  "Machine Learning",
  "Data Structures",
  "System Design",
  "DevOps",
  "Docker",
  "Kubernetes",
];

const LANGUAGE_SUGGESTIONS = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
];

const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const defaultEducatorProfile = {
  title: "",
  bio: "",
  highestQualification: "",
  yearsOfExperience: "",
  workType: "fullTime",
  skillCategory: "",
  expertiseAreas: [],
  languages: [],
  linkedinUrl: "",
  portfolioUrl: "",
  teachesCourses: "",
  availability: WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, start: "", end: "" };
    return acc;
  }, {}),
};

const EducatorVerificationPage = () => {
  const { id } = useParams();
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const [expertiseInput, setExpertiseInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [availTemplate, setAvailTemplate] = useState({ start: "", end: "" });

  const [docForm, setDocForm] = useState({
    file: null,
    type: "certification",
    title: "",
    description: "",
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const avatarInputRef = useRef(null);

  // current user
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {
    currentUser = null;
  }
  const currentRole = currentUser?.role;
  const isAdmin = currentRole === "admin";
  const isSubOrgAdmin = currentRole === "subOrgAdmin";
  const canEdit = isAdmin || isSubOrgAdmin;

  const safeDocuments = Array.isArray(documents) ? documents : [];

  // ---------------- LOAD EDUCATOR ----------------
  useEffect(() => {
    let isMounted = true;

    async function loadEducator() {
      setLoading(true);
      setError("");
      setSuccess("");
      setValidationErrors([]);

      try {
        const data = await fetchEducatorProfile(id);
        if (!isMounted) return;

        setEducator(data);

        const ep = data.educatorProfile || {};
        const availability = WEEK_DAYS.reduce((acc, day) => {
          acc[day] = { enabled: false, start: "", end: "" };
          return acc;
        }, {});
        if (Array.isArray(ep.availableSlots)) {
          ep.availableSlots.forEach((slot) => {
            const day = (slot.day || "").toLowerCase();
            if (availability[day]) {
              availability[day] = {
                enabled: true,
                start: slot.start || "",
                end: slot.end || "",
              };
            }
          });
        }

        setProfile({
          title: ep.title || "",
          bio: ep.bio || "",
          highestQualification: ep.highestQualification || "",
          yearsOfExperience:
            ep.yearsOfExperience != null ? String(ep.yearsOfExperience) : "",
          workType: ep.workType || "fullTime",
          skillCategory: ep.skillCategory || "",
          expertiseAreas: ep.expertiseAreas || [],
          languages: ep.languages || [],
          linkedinUrl: ep.linkedinUrl || "",
          portfolioUrl: ep.portfolioUrl || "",
          teachesCourses: (ep.teachesCourses || []).join(", "),
          availability,
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

  // ---------------- HELPERS ----------------
  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const addTagToField = (field, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setProfile((prev) => {
      const set = new Set(prev[field] || []);
      set.add(trimmed);
      return { ...prev, [field]: Array.from(set) };
    });
  };

  const removeTagFromField = (field, value) => {
    setProfile((prev) => {
      const set = new Set(prev[field] || []);
      set.delete(value);
      return { ...prev, [field]: Array.from(set) };
    });
  };

  const handleExpertiseKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagToField("expertiseAreas", expertiseInput);
      setExpertiseInput("");
    }
  };

  const handleLanguageKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagToField("languages", languageInput);
      setLanguageInput("");
    }
  };

  const toggleDayEnabled = (day) => {
    setProfile((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          enabled: !prev.availability[day].enabled,
        },
      },
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setProfile((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  const applyTemplateToDays = (days) => {
    if (!availTemplate.start || !availTemplate.end) return;
    setProfile((prev) => {
      const availability = { ...prev.availability };
      days.forEach((day) => {
        availability[day] = {
          enabled: true,
          start: availTemplate.start,
          end: availTemplate.end,
        };
      });
      return { ...prev, availability };
    });
  };

  const applyToWeekdays = () => {
    applyTemplateToDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  };

  const applyToAllDays = () => {
    applyTemplateToDays([...WEEK_DAYS]);
  };

  const buildAvailableSlotsPayload = () => {
    const slots = [];
    WEEK_DAYS.forEach((day) => {
      const cfg = profile.availability[day];
      if (cfg?.enabled && cfg.start && cfg.end) {
        slots.push({ day, start: cfg.start, end: cfg.end });
      }
    });
    return slots;
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
    if (s === "approved") cls = "badge bg-success";
    else if (s === "pending") cls = "badge bg-warning text-dark";
    else if (s === "rejected") cls = "badge bg-danger";
    return <span className={cls}>{verificationStatus || "pending"}</span>;
  };

  const completeness = (() => {
    let score = 0;
    let total = 7;
    if (profile.title) score++;
    if (profile.bio) score++;
    if (profile.highestQualification) score++;
    if (profile.yearsOfExperience) score++;
    if (profile.expertiseAreas && profile.expertiseAreas.length) score++;
    if (profile.languages && profile.languages.length) score++;
    if (profile.workType) score++;
    return Math.round((score / total) * 100);
  })();

  const getDocUrl = (doc) =>
    doc.fileUrl || doc.url || doc.secureUrl || "";

  const isImageDoc = (doc) => {
    const mime = (doc.mimeType || "").toLowerCase();
    const url = getDocUrl(doc).toLowerCase();
    return (
      mime.startsWith("image/") ||
      url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".webp")
    );
  };

  // ---------------- VALIDATION ----------------
  const validateCoreProfile = (requireDocsForApproval = false) => {
    const errors = [];

    if (!profile.title.trim()) errors.push("Title is required.");
    if (!profile.highestQualification.trim())
      errors.push("Highest qualification is required.");
    if (!profile.yearsOfExperience)
      errors.push("Years of experience is required.");
    if (!profile.skillCategory.trim())
      errors.push("Skill category is required.");
    if (!profile.workType) errors.push("Work type (full/part time) is required.");
    if (!profile.expertiseAreas || profile.expertiseAreas.length === 0)
      errors.push("At least one area of expertise is required.");
    if (!profile.languages || profile.languages.length === 0)
      errors.push("At least one language is required.");

    const slots = buildAvailableSlotsPayload();
    if (!slots.length)
      errors.push("At least one availability slot is required.");

    if (requireDocsForApproval && safeDocuments.length === 0) {
      errors.push("At least one verification document is required for approval.");
    }

    setValidationErrors(errors);
    return errors;
  };

  // ---------------- PROFILE SAVE ----------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      setError("Only Admin or Sub-Org Admin can update educator profile.");
      return;
    }

    const errors = validateCoreProfile(false);
    if (errors.length) {
      setError("Please fill all required fields before saving the profile.");
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
      workType: profile.workType,
      skillCategory: profile.skillCategory.trim(),
      expertiseAreas: profile.expertiseAreas || [],
      languages: profile.languages || [],
      linkedinUrl: profile.linkedinUrl.trim(),
      portfolioUrl: profile.portfolioUrl.trim(),
      teachesCourses: profile.teachesCourses,
      availableSlots: buildAvailableSlotsPayload(),
    };

    try {
      const res = await updateEducatorProfile(id, payload);
      const updated = res?.data || res?.educator || res;
      if (updated?.educatorProfile) {
        setEducator((prev) => ({
          ...prev,
          educatorProfile: updated.educatorProfile,
        }));
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

  // ---------------- DOCS UPLOAD ----------------
  const handleDocFieldChange = (e) => {
    const { name, value } = e.target;
    setDocForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocInputChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDocForm((prev) => ({ ...prev, file }));
  };

  const handleDropFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setDocForm((prev) => ({ ...prev, file }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (!canEdit) {
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
      const newDoc = res?.data || res?.document || res?.doc || res || null;

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
      setDocuments((prev) =>
        prev.filter((d) => d.id !== docId && d._id !== docId)
      );
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

  // ---------------- AVATAR UPLOAD ----------------
  const handleAvatarClick = () => {
    if (!canEdit || uploadingAvatar) return;
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please upload a valid image file for profile picture.");
    return;
  }

  setUploadingAvatar(true);
  setError("");
  setSuccess("");

  try {
    const url = URL.createObjectURL(file);
    setAvatarPreviewUrl(url);

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await uploadEducatorAvatar(id, formData);
    const data = res?.data || res;

    setEducator((prev) => ({
      ...prev,
      avatarUrl: data?.avatarUrl || data?.avatar_url || prev?.avatarUrl,
    }));

  setSuccess("Profile photo updated.");
  } catch (err) {
    console.error("Error uploading avatar:", err);
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to upload profile picture.";
    setError(message);
    setAvatarPreviewUrl("");
  } finally {
    setUploadingAvatar(false);
  }
};


  // ---------------- VERIFICATION SAVE ----------------
  const handleSaveVerification = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      setError("Only Admin or Sub-Org Admin can update verification status.");
      return;
    }
    if (!verificationStatus) {
      setError("Please choose a verification status.");
      return;
    }

    const requireDocs = verificationStatus === "approved";
    const errors = validateCoreProfile(requireDocs);
    if (requireDocs && errors.length) {
      setError(
        "Cannot approve educator until all mandatory fields and at least one document are provided."
      );
      return;
    }

    setSavingVerification(true);
    setError("");
    setSuccess("");

    try {
      const res = await verifyEducator(id, {
        status: verificationStatus,
        reviewReason: verificationNotes,
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

  // ---------------- RENDER PRE-STATE ----------------
  if (loading && !educator) {
    return (
      <div className="nk-block">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <div className="text-soft mt-2 small">Loading educator...</div>
        </div>
      </div>
    );
  }

  if (error && !educator) {
    return (
      <div className="nk-block">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!educator) return null;

  const initials =
    (educator.name ||
      educator.fullName ||
      educator.userName ||
      "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "E";

  const organizationName =
    educator.orgName ||
    educator.organizationName ||
    educator.subOrgName ||
    "Main Org";

  const avatarUrl = avatarPreviewUrl || educator.avatarUrl || "";

  // ---------------- RENDER ----------------
  return (
    <>
      {/* PAGE HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              Educator Verification /{" "}
              <strong className="text-primary small">
                {educator.name || "Educator"}
              </strong>
            </h3>
            <div className="nk-block-des text-soft">
              <p>
                Review educator profile, skills, availability and documents, then verify.
              </p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
              <span className="small d-flex align-items-center gap-1">
                <ShieldCheck size={16} className="me-1" />
                <span className="text-muted">Status:</span>
                {renderStatusBadge()}
              </span>
              <Link
                to={`/admin/users/${id}`}
                className="btn btn-outline-light px-4 py-2 d-inline-flex align-items-center gap-1"
              >
                <UserIcon size={16} />
                <span>View User</span>
              </Link>
              <button
                type="button"
                className="btn btn-primary px-4 py-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS */}
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
      {validationErrors.length > 0 && (
        <div className="alert alert-warning mb-3" role="alert">
          <div className="fw-semibold mb-1">
            Please complete the required fields:
          </div>
          <ul className="mb-0 ps-3">
            {validationErrors.map((msg, idx) => (
              <li key={idx} className="small">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner">
            {/* HEADER SUMMARY + AVATAR */}
            <div className="d-flex flex-wrap align-items-center mb-4">
              <div className="me-3 d-flex flex-column align-items-center">
                {avatarUrl ? (
                  <div className="user-avatar xl bg-transparent">
                    <img
                      src={avatarUrl}
                      alt={educator.name || "Avatar"}
                      className="rounded-circle img-fluid"
                    />
                  </div>
                ) : (
                  <div className="user-avatar xl bg-primary-dim">
                    <span>{initials}</span>
                  </div>
                )}
                {canEdit && (
                  <>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-primary mt-2 d-inline-flex align-items-center gap-1"
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                    >
                      <ImageIcon size={14} />
                      <span>
                        {uploadingAvatar ? "Uploading..." : "Change photo"}
                      </span>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>
              <div>
                <h5 className="mb-1">{educator.name || "-"}</h5>
                <div className="text-muted small">
                  {educator.email || "-"}
                </div>
                <div className="text-muted small">
                  Role: {educator.role || educator.userRole || "-"} · Org:{" "}
                  {organizationName}
                </div>
              </div>
            </div>

            {/* PROGRESS CARDS */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card bg-light border-0 h-100">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="small text-muted">
                          Profile completeness
                        </div>
                        <div className="fw-bold">{completeness}% Complete</div>
                      </div>
                      <span className="badge bg-outline-primary">Step 1</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-light border-0 h-100">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="small text-muted">
                          Documents uploaded
                        </div>
                        <div className="fw-bold">
                          {safeDocuments.length} file
                          {safeDocuments.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span className="badge bg-outline-primary">Step 2</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-light border-0 h-100">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="small text-muted">
                          Verification status
                        </div>
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

            {/* TABS */}
            <ul className="nav nav-tabs nav-tabs-s2 mb-3">
              <li className="nav-item">
                <button
                  type="button"
                  className={"nav-link" + (activeTab === "profile" ? " active" : "")}
                  onClick={() => setActiveTab("profile")}
                >
                  Profile
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={"nav-link" + (activeTab === "experience" ? " active" : "")}
                  onClick={() => setActiveTab("experience")}
                >
                  Skills &amp; Experience
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={"nav-link" + (activeTab === "availability" ? " active" : "")}
                  onClick={() => setActiveTab("availability")}
                >
                  Availability
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={"nav-link" + (activeTab === "documents" ? " active" : "")}
                  onClick={() => setActiveTab("documents")}
                >
                  Documents
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={"nav-link" + (activeTab === "verification" ? " active" : "")}
                  onClick={() => setActiveTab("verification")}
                >
                  Verification Decision
                </button>
              </li>
            </ul>

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="gy-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">
                        Title <span className="text-danger">*</span>
                      </label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          value={profile.title}
                          onChange={handleProfileFieldChange}
                          placeholder="Senior Software Engineer, Trainer..."
                          disabled={savingProfile || !canEdit}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">
                        Highest Qualification <span className="text-danger">*</span>
                      </label>
                      <div className="form-control-wrap">
                        <select
                          name="highestQualification"
                          className="form-select"
                          value={profile.highestQualification}
                          onChange={handleProfileFieldChange}
                          disabled={savingProfile || !canEdit}
                        >
                          <option value="">Select qualification</option>
                          {QUALIFICATIONS.map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label d-flex align-items-center">
                        <Briefcase size={14} className="me-1" />
                        Work Type <span className="text-danger ms-1">*</span>
                      </label>
                      <div className="form-control-wrap">
                        <div className="d-flex flex-wrap gap-2">
                          {WORK_TYPES.map((opt) => (
                            <div key={opt.value} className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="workType"
                                id={`workType-${opt.value}`}
                                value={opt.value}
                                checked={profile.workType === opt.value}
                                onChange={handleProfileFieldChange}
                                disabled={savingProfile || !canEdit}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`workType-${opt.value}`}
                              >
                                {opt.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label d-flex align-items-center">
                        <Tag size={14} className="me-1" />
                        Skill Category <span className="text-danger ms-1">*</span>
                      </label>
                      <div className="form-control-wrap">
                        <input
                          list="skillCategorySuggestions"
                          name="skillCategory"
                          className="form-control"
                          value={profile.skillCategory}
                          onChange={handleProfileFieldChange}
                          placeholder="e.g. Software Engineering"
                          disabled={savingProfile || !canEdit}
                        />
                        <datalist id="skillCategorySuggestions">
                          {SKILL_CATEGORY_SUGGESTIONS.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </div>
                      <div className="form-note">
                        Type your own category or choose a suggested one.
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
                          rows={4}
                          value={profile.bio}
                          onChange={handleProfileFieldChange}
                          placeholder="Describe the educator's background and teaching style..."
                          disabled={savingProfile || !canEdit}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile || !canEdit}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}

            {/* SKILLS & EXPERIENCE TAB */}
            {activeTab === "experience" && (
              <form onSubmit={handleSaveProfile} className="gy-3">
                {/* top row */}
                <div className="row g-3 mb-2">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">
                        Years of Experience <span className="text-danger">*</span>
                      </label>
                      <div className="form-control-wrap">
                        <input
                          type="number"
                          min="0"
                          name="yearsOfExperience"
                          className="form-control"
                          value={profile.yearsOfExperience}
                          onChange={handleProfileFieldChange}
                          placeholder="e.g., 5"
                          disabled={savingProfile || !canEdit}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="form-group">
                      <label className="form-label">
                        Teaches Courses (comma separated identifiers)
                      </label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="teachesCourses"
                          className="form-control"
                          value={profile.teachesCourses}
                          onChange={handleProfileFieldChange}
                          placeholder="react-basics, node-advanced, dsa-level1"
                          disabled={savingProfile || !canEdit}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expertise block */}
                <div className="mb-3">
                  <div className="form-group mb-2">
                    <label className="form-label d-flex align-items-center mb-1">
                      <Tag size={14} className="me-1" />
                      Areas of Expertise <span className="text-danger ms-1">*</span>
                    </label>
                    <p className="text-soft small mb-2">
                      Add technologies, subjects and tools. Press Enter to add each one.
                    </p>

                    <div className="form-control-wrap mb-2">
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {(profile.expertiseAreas || []).map((skill) => (
                          <span
                            key={skill}
                            className="badge bg-primary-dim text-primary d-inline-flex align-items-center"
                          >
                            <span className="me-1">{skill}</span>
                            {canEdit && (
                              <button
                                type="button"
                                className="btn btn-xs btn-icon btn-trigger p-0 border-0"
                                onClick={() =>
                                  removeTagFromField("expertiseAreas", skill)
                                }
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type a skill and press Enter (e.g., React, Node.js)"
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyDown={handleExpertiseKeyDown}
                        disabled={savingProfile || !canEdit}
                      />
                    </div>
                    <div className="small text-soft mb-1">
                      Suggestions (click to add):
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {EXPERTISE_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="btn btn-xs btn-outline-light rounded-pill"
                          onClick={() => addTagToField("expertiseAreas", s)}
                          disabled={savingProfile || !canEdit}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Languages block */}
                <div className="mb-3">
                  <div className="form-group mb-2">
                    <label className="form-label d-flex align-items-center mb-1">
                      <Globe2 size={14} className="me-1" />
                      Languages <span className="text-danger ms-1">*</span>
                    </label>
                    <p className="text-soft small mb-2">
                      Add all languages the educator can comfortably teach in.
                    </p>

                    <div className="form-control-wrap mb-2">
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {(profile.languages || []).map((lang) => (
                          <span
                            key={lang}
                            className="badge bg-success-dim text-success d-inline-flex align-items-center"
                          >
                            <span className="me-1">{lang}</span>
                            {canEdit && (
                              <button
                                type="button"
                                className="btn btn-xs btn-icon btn-trigger p-0 border-0"
                                onClick={() =>
                                  removeTagFromField("languages", lang)
                                }
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type a language and press Enter"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        onKeyDown={handleLanguageKeyDown}
                        disabled={savingProfile || !canEdit}
                      />
                    </div>

                    <div className="small text-soft mb-1">
                      Suggestions (click to add):
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {LANGUAGE_SUGGESTIONS.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          className="btn btn-xs btn-outline-light rounded-pill"
                          onClick={() => addTagToField("languages", lang)}
                          disabled={savingProfile || !canEdit}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Social links */}
                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">LinkedIn URL</label>
                      <div className="form-control-wrap">
                        <input
                          type="url"
                          name="linkedinUrl"
                          className="form-control"
                          value={profile.linkedinUrl}
                          onChange={handleProfileFieldChange}
                          placeholder="https://linkedin.com/in/..."
                          disabled={savingProfile || !canEdit}
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
                          onChange={handleProfileFieldChange}
                          placeholder="https://..."
                          disabled={savingProfile || !canEdit}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile || !canEdit}
                  >
                    {savingProfile ? "Saving..." : "Save Skills & Experience"}
                  </button>
                </div>
              </form>
            )}

            {/* AVAILABILITY TAB */}
            {activeTab === "availability" && (
              <form onSubmit={handleSaveProfile} className="gy-3">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-1">
                    <Clock size={16} className="me-1 text-primary" />
                    <span className="small text-soft">
                      Define weekly availability. Use quick apply to fill days, then adjust.
                    </span>
                  </div>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label small mb-1">
                        Default Start Time
                      </label>
                      <input
                        type="time"
                        className="form-control form-control-sm"
                        value={availTemplate.start}
                        onChange={(e) =>
                          setAvailTemplate((prev) => ({
                            ...prev,
                            start: e.target.value,
                          }))
                        }
                        disabled={savingProfile || !canEdit}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small mb-1">
                        Default End Time
                      </label>
                      <input
                        type="time"
                        className="form-control form-control-sm"
                        value={availTemplate.end}
                        onChange={(e) =>
                          setAvailTemplate((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                        disabled={savingProfile || !canEdit}
                      />
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-light btn-sm"
                          onClick={applyToWeekdays}
                          disabled={
                            !availTemplate.start ||
                            !availTemplate.end ||
                            !canEdit
                          }
                        >
                          Apply to Weekdays
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-light btn-sm"
                          onClick={applyToAllDays}
                          disabled={
                            !availTemplate.start ||
                            !availTemplate.end ||
                            !canEdit
                          }
                        >
                          Apply to All Days
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-2">
                  {WEEK_DAYS.map((day) => {
                    const cfg = profile.availability[day];
                    const label =
                      day.charAt(0).toUpperCase() + day.slice(1);
                    return (
                      <div key={day} className="col-md-6 col-lg-4">
                        <div className="card card-bordered">
                          <div className="card-inner small">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`day-${day}`}
                                  checked={cfg.enabled}
                                  onChange={() => toggleDayEnabled(day)}
                                  disabled={savingProfile || !canEdit}
                                />
                                <label
                                  className="form-check-label fw-semibold"
                                  htmlFor={`day-${day}`}
                                >
                                  {label}
                                </label>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="time"
                                className="form-control form-control-sm"
                                value={cfg.start}
                                onChange={(e) =>
                                  handleAvailabilityChange(
                                    day,
                                    "start",
                                    e.target.value
                                  )
                                }
                                disabled={!cfg.enabled || !canEdit}
                              />
                              <span className="text-soft">to</span>
                              <input
                                type="time"
                                className="form-control form-control-sm"
                                value={cfg.end}
                                onChange={(e) =>
                                  handleAvailabilityChange(
                                    day,
                                    "end",
                                    e.target.value
                                  )
                                }
                                disabled={!cfg.enabled || !canEdit}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile || !canEdit}
                  >
                    {savingProfile ? "Saving..." : "Save Availability"}
                  </button>
                </div>
              </form>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === "documents" && (
              <div className="row g-4">
                <div className="col-md-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-inner">
                      <h6 className="title mb-2">Upload Document</h6>
                      <p className="text-soft small mb-3">
                        Upload certifications, ID proofs or other supporting documents.
                      </p>
                      <form onSubmit={handleUploadDocument} className="gy-3">
                        <div className="form-group">
                          <label className="form-label">
                            Document File <span className="text-danger">*</span>
                          </label>
                          <div
                            className={
                              "border rounded-3 p-3 text-center small d-flex flex-column align-items-center justify-content-center nk-upload-zone " +
                              (isDragOver ? "bg-light" : "")
                            }
                            onDrop={handleDropFile}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                          >
                            <UploadCloud className="mb-2" size={22} />
                            <p className="mb-1 fw-semibold">
                              Drag &amp; drop file here
                            </p>
                            <p className="mb-2 text-soft">
                              or click to browse from your computer
                            </p>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm mb-2"
                              onClick={() =>
                                !uploadingDoc &&
                                canEdit &&
                                document.querySelector("#doc-file-input") &&
                                document.querySelector("#doc-file-input").click()
                              }
                              disabled={uploadingDoc || !canEdit}
                            >
                              Choose file
                            </button>
                            <input
                              id="doc-file-input"
                              type="file"
                              className="d-none"
                              onChange={handleDocInputChange}
                              disabled={uploadingDoc || !canEdit}
                            />
                            <div className="text-soft small">
                              PDF, Images, Docs up to ~10MB
                            </div>
                            {docForm.file && (
                              <div className="badge bg-light text-muted mt-2">
                                {docForm.file.name}
                              </div>
                            )}
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
                              disabled={uploadingDoc || !canEdit}
                            >
                              <option value="certification">Certification</option>
                              <option value="idProof">ID Proof</option>
                              <option value="experienceProof">
                                Experience Proof
                              </option>
                              <option value="resume">Resume / CV</option>
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
                              placeholder="Document title"
                              disabled={uploadingDoc || !canEdit}
                            />
                          </div>
                        </div>

                        <div className="form-group mb-1">
                          <label className="form-label">Description</label>
                          <div className="form-control-wrap">
                            <textarea
                              name="description"
                              className="form-control"
                              rows={2}
                              value={docForm.description}
                              onChange={handleDocFieldChange}
                              placeholder="Short description (optional)"
                              disabled={uploadingDoc || !canEdit}
                            />
                          </div>
                        </div>

                        <div className="mt-3 d-flex justify-content-end">
                          <button
                            type="submit"
                            className="btn btn-primary d-inline-flex align-items-center gap-1"
                            disabled={uploadingDoc || !canEdit}
                          >
                            {uploadingDoc ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud size={16} />
                                <span>Upload</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="col-md-7">
                  <h6 className="title mb-2">Uploaded Documents</h6>
                  {safeDocuments.length === 0 ? (
                    <p className="text-soft small">
                      No documents uploaded yet.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-middle align-middle">
                        <thead>
                          <tr>
                            <th className="text-nowrap">Preview</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th className="text-nowrap">Uploaded At</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeDocuments.map((doc) => {
                            const docId = doc.id || doc._id;
                            const url = getDocUrl(doc);
                            const uploadedAt = formatDateTime(doc.uploadedAt);
                            return (
                              <tr key={docId}>
                                <td className="w-25">
                                  {url ? (
                                    isImageDoc(doc) ? (
                                      <img
                                        src={url}
                                        alt={doc.title || "Document"}
                                        className="img-fluid rounded-3 shadow-sm"
                                      />
                                    ) : (
                                      <span className="badge bg-light text-muted">
                                        File
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-soft small">-</span>
                                  )}
                                </td>
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
                                    {doc.type || doc.documentType || "-"}
                                  </span>
                                </td>
                                <td>
                                  <span className="small">{uploadedAt}</span>
                                </td>
                                <td className="text-end">
                                  <div className="d-flex gap-2 justify-content-end">
                                    {url && (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                                      >
                                        <Eye size={14} />
                                        <span>View</span>
                                      </a>
                                    )}
                                    {canEdit && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                                        onClick={() => handleDeleteDocument(docId)}
                                      >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
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
                      <label className="form-label">
                        Status <span className="text-danger">*</span>
                      </label>
                      <div className="form-control-wrap">
                        <select
                          className="form-select"
                          value={verificationStatus}
                          onChange={(e) => setVerificationStatus(e.target.value)}
                          disabled={!canEdit || savingVerification}
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
                          rows={4}
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          disabled={!canEdit || savingVerification}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canEdit || savingVerification}
                  >
                    {savingVerification
                      ? "Saving..."
                      : "Save Verification Decision"}
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

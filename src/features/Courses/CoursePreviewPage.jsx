// src/features/Courses/CoursePreviewPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchCourseById,
  fetchCurriculum,
  updateCourse,
} from "./api/coursesApi";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";

/* Helpers */
const getLessonPlayableUrl = (lesson) => {
  if (!lesson) return "";
  const raw =
    lesson.videoUrl ||
    (lesson.resourceUrl &&
      !String(lesson.resourceUrl).startsWith("mock://local/") &&
      lesson.resourceUrl);
  return raw || "";
};

const getYoutubeEmbedUrl = (url) => {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]+)/i);
  if (!match) return "";
  return `https://www.youtube.com/embed/${match[1]}`;
};

const getPriceLabel = (course) => {
  if (!course) return "-";
  const pricing = course.pricing || {};
  const isFree = pricing.isFree ?? course.isFree ?? false;
  const rawPrice = pricing.price ?? course.price ?? 0;
  const numPrice = Number(rawPrice);

  if (isFree || !numPrice || numPrice === 0) return "Free";
  try {
    return `₹${numPrice.toLocaleString("en-IN")}`;
  } catch {
    return `₹${numPrice}`;
  }
};

const getApprovalLabel = (course) => {
  const raw =
    course?.approvalStatus ||
    (course?.approval && (course.approval.state || course.approval.status)) ||
    "";
  const normalized = String(raw || "").toLowerCase();

  if (!normalized || normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "in-review" || normalized === "review") return "In Review";

  return raw || "Pending";
};

const CoursePreviewPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // toast state
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const toastTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [courseData, curriculum] = await Promise.all([
          fetchCourseById(courseId),
          fetchCurriculum(courseId),
        ]);
        if (!isMounted) return;

        const loadedCourse = courseData?.data ?? courseData;
        const loadedCurriculum = curriculum?.data ?? curriculum;

        setCourse(loadedCourse || null);

        const secs =
          (Array.isArray(loadedCurriculum)
            ? loadedCurriculum
            : loadedCurriculum?.sections) || [];
        setSections(secs);

        if (secs.length) {
          const firstSec = secs[0];
          setActiveSectionId(firstSec.id);
          const firstLesson = (firstSec.lessons || [])[0];
          setActiveLessonId(firstLesson ? firstLesson.id : null);
        } else {
          setActiveSectionId(null);
          setActiveLessonId(null);
        }
      } catch (err) {
        console.error("CoursePreview load error:", err);
        if (!isMounted) return;
        const message =
          err?.response?.data?.message || err?.message || "Failed to load course.";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [courseId]);

  const getSectionDurationMinutes = (section) =>
    (section.lessons || []).reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0);
  const totalDurationMinutes = sections.reduce(
    (sum, s) => sum + getSectionDurationMinutes(s),
    0
  );
  const previewLessons = sections.reduce(
    (sum, s) => sum + (s.lessons || []).filter((l) => l.isPreview).length,
    0
  );

  const formatDuration = (minutes) => {
    const mins = minutes || 0;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hours > 0) return `${hours}h ${rem}m`;
    return `${rem}m`;
  };

  const handleCreateBatch = (mode) => {
    if (!course) return;
    navigate("/admin/batches/add", {
      state: {
        courseId: course.id || courseId,
        courseTitle: course.title,
        preferredMode: mode,
      },
    });
  };

  const handleBack = () => navigate("/admin/courses");

  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  const activeLesson =
    activeSection?.lessons?.find((l) => l.id === activeLessonId) || null;

  /* Render hero preview media (read-only) */
  const renderPreviewMedia = () => {
    const lesson = activeLesson;
    const url = lesson ? getLessonPlayableUrl(lesson) : null;

    if (lesson && url) {
      const type = lesson.type || "video";

      if (type === "video") {
        const yt = getYoutubeEmbedUrl(url);
        if (yt) {
          return (
            <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-dark">
              <iframe
                src={yt}
                title={lesson.title || "Lesson video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-100 h-100"
              />
            </div>
          );
        }

        return (
          <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-dark">
            <video
              src={url}
              controls
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />
          </div>
        );
      }

      if (type === "pdf") {
        return (
          <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-light">
            <iframe src={url} title={lesson.title || "PDF preview"} className="w-100 h-100 border-0" />
          </div>
        );
      }

      if (type === "text") {
        return (
          <div className="border rounded-4 p-3 bg-light">
            <div className="small text-muted mb-2">Text lesson resource link:</div>
            <a href={url} target="_blank" rel="noreferrer">
              Open content
            </a>
          </div>
        );
      }

      return (
        <div className="border rounded-4 p-3 bg-light">
          <div className="small text-muted mb-2">Resource link for this lesson:</div>
          <a href={url} target="_blank" rel="noreferrer">
            Open resource
          </a>
        </div>
      );
    }

    const thumb = course?.thumbnailUrl || course?.thumbnail;
    if (thumb) {
      return (
        <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-light">
          <img
            src={thumb}
            alt="Course thumbnail"
            className="img-fluid w-100 h-100"
            style={{ objectFit: "cover" }}
          />
        </div>
      );
    }

    return (
      <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-light">
        <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 text-muted">
          <i className="bi bi-image fs-1 mb-2" />
          <span className="small">Thumbnail or lesson video will appear here</span>
        </div>
      </div>
    );
  };

  /* ========== Toast helper (uses existing .toast styles in your CSS) ========== */
  const showToast = (message, variant = "success", ms = 2500) => {
    setToast({ show: true, message, variant });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, ms);
  };

  /* ========== Approval actions: only change approval fields (do NOT change publish status) ========== */
  const handleApprove = async () => {
    if (!course) return;
    try {
      const payload = {
        approvalStatus: "approved",
        approval: { state: "approved" },
      };
      const updated = await updateCourse(courseId, payload);
      // Merge returned updated data (or fallback to payload)
      setCourse((prev) => ({ ...(prev || {}), ...(updated || payload) }));
      showToast("Course marked Approved", "success");
      window.dispatchEvent(new CustomEvent("course:updated", { detail: updated || { id: courseId, ...payload } }));
    } catch (err) {
      console.error("approve error", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to approve course";
      showToast(msg, "danger");
    }
  };

  const handleReject = async () => {
    if (!course) return;
    try {
      const payload = {
        approvalStatus: "rejected",
        approval: { state: "rejected" },
      };
      const updated = await updateCourse(courseId, payload);
      setCourse((prev) => ({ ...(prev || {}), ...(updated || payload) }));
      showToast("Course marked Rejected", "warning");
      window.dispatchEvent(new CustomEvent("course:updated", { detail: updated || { id: courseId, ...payload } }));
    } catch (err) {
      console.error("reject error", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to reject course";
      showToast(msg, "danger");
    }
  };

  /* Status change handler: attempt to update backend status (keeps mapping behaviour off unless needed) */
  const handleStatusChange = async (nextStatusRaw) => {
    if (!course) return;
    const next = String(nextStatusRaw || "").toLowerCase();
    // if backend doesn't accept 'suspended', map it to 'archived' (you can remove mapping if backend accepts suspended)
    const backendStatus = next === "suspended" ? "archived" : next;
    try {
      const payload = { status: backendStatus };
      const updated = await updateCourse(courseId, payload);
      setCourse((prev) => ({ ...(prev || {}), ...(updated || payload) }));
      showToast(`Status updated: ${next}`, "success");
      window.dispatchEvent(new CustomEvent("course:updated", { detail: updated || { id: courseId, ...payload } }));
    } catch (err) {
      console.error("status change error", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to update status";
      showToast(msg, "danger");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="p-4">Loading preview…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="p-4">
              <div className="alert alert-danger mb-3">{error}</div>
              <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body p-4">Course not found.</div>
        </div>
      </div>
    );
  }

  const priceLabel = getPriceLabel(course);
  const approvalLabel = getApprovalLabel(course);
  const languageLabel = course.language || "English";
  const levelLabel = course.level || "Beginner";
  const displayCourseId = course.id || course._id || courseId;

  const courseDescription =
    course.shortDescription ||
    course.fullDescription ||
    course.description ||
    "This course description can be managed from the course settings.";

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* PAGE HEADER */}
          <div className="nk-block-head nk-block-head-sm mb-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h4 className="mb-1 d-flex align-items-center gap-2">
                  <BookOpen size={20} />
                  <span>Course Preview</span>
                </h4>
                <div className="text-muted small">See how this course appears with current sections and lessons.</div>
                <div className="text-muted small">Course ID: <code>{displayCourseId}</code></div>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <div className="me-2">
                  <select
                    className="form-select form-select-sm"
                    value={(course.status || "draft")}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    title="Change course status"
                  >
                    <option value="published">Published</option>
                    <option value="suspended">Suspended</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-secondary shadow-sm rounded d-flex align-items-center gap-2 px-3 py-2"
                  onClick={handleBack}
                >
                  <ArrowLeft size={18} />
                  <span>Back to Courses</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="nk-block">
            <div className="row g-4 align-items-start">
              {/* LEFT COLUMN: HERO + ABOUT */}
              <div className="col-12 col-xl-8">
                <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                  <div className="card-body p-3 p-md-4">
                    {/* Hero media (play selected lesson or thumbnail) */}
                    <div className="mb-3">{renderPreviewMedia()}</div>

                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <div>
                        <div className="small fw-semibold">{course.title}</div>
                        <div className="small text-muted">{course.subtitle || "Course"}</div>
                      </div>
                      <div className="d-flex flex-column text-end">
                        <div className="h5 mb-0">{priceLabel}</div>
                        <div className="small text-muted">
                          {course.pricing?.discountPercentage ? `${course.pricing.discountPercentage}% off` : null}
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="row g-2 mb-2">
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                          <span className="text-muted small">Total Lessons</span>
                          <span className="fw-bold">{totalLessons}</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                          <span className="text-muted small">Total Duration</span>
                          <span className="fw-bold">{formatDuration(totalDurationMinutes)}</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                          <span className="text-muted small">Preview Lessons</span>
                          <span className="fw-bold">{previewLessons}</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                          <span className="text-muted small">Sections</span>
                          <span className="fw-bold">{sections.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* META CHIPS */}
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="badge rounded-pill bg-light text-muted small">Status: <span className="ms-1 text-capitalize">{course.status || "draft"}</span></span>
                      <span className="badge rounded-pill bg-light text-muted small">Approval: <span className="ms-1">{approvalLabel}</span></span>
                      <span className="badge rounded-pill bg-light text-muted small">{priceLabel}</span>
                      <span className="badge rounded-pill bg-light text-muted small">{languageLabel} • <span className="text-capitalize">{levelLabel}</span></span>
                    </div>
                  </div>
                </div>

                {/* ABOUT (READ-ONLY) */}
                <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">About Course</h5>
                      <small className="text-muted">Students see this on the course landing page</small>
                    </div>
                    <div className="small" style={{ whiteSpace: "pre-wrap" }}>{courseDescription}</div>
                    <div className="d-flex justify-content-end mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => navigate(`/admin/courses/${courseId}/curriculum`)}
                      >
                        Edit Curriculum
                      </button>
                    </div>
                  </div>
                </div>

                {/* Learning outcomes / requirements / tags (read-only) */}
                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                    <div className="card-body p-3 p-md-4">
                      <h6 className="mb-2">What you’ll learn</h6>
                      <ul className="list-unstyled gy-1">
                        {course.learningOutcomes.map((item, idx) => <li key={idx}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {course.requirements && course.requirements.length > 0 && (
                  <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                    <div className="card-body p-3 p-md-4">
                      <h6 className="mb-2">Requirements / Prerequisites</h6>
                      <ul className="list-unstyled gy-1">
                        {course.requirements.map((item, idx) => <li key={idx}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                    <div className="card-body p-3 p-md-4">
                      <div className="mt-1">
                        <span className="text-soft small me-1">Tags:</span>
                        {course.tags.map((tag) => (
                          <span key={tag} className="badge bg-outline-primary text-primary me-1 mb-1">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN – COURSE CONTENT (read-only + selection + playback) */}
              <div className="col-12 col-xl-4">
                <div className="card border-0 shadow-sm vp-course-content-card">
                  <div className="card-header bg-white border-0 pt-3 pb-2 px-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 d-flex align-items-center gap-2"><Layers size={18} /><span>Course Content</span></h6>
                      <span className="badge rounded-pill bg-light text-muted small">{sections.length} Modules • {totalLessons} Lessons</span>
                    </div>
                    <div className="mt-1 small text-muted">Total duration: {formatDuration(totalDurationMinutes)}</div>
                  </div>

                  <div className="card-body pt-2 pb-3 px-3 vp-course-content-body">
                    {sections.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <Layers size={32} className="mb-2 opacity-75" />
                        <div className="small fw-medium mb-1">No sections yet.</div>
                        <small className="text-center px-3">Add sections and lessons from the curriculum editor.</small>
                      </div>
                    ) : (
                      <div className="vp-course-content-scroll">
                        {sections.map((section) => {
                          const lessons = section.lessons || [];
                          return (
                            <div key={section.id} className="mb-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{section.title || "Untitled Section"}</strong>
                                <span className="small text-soft">{lessons.length} lessons</span>
                              </div>

                              <ul className="list-unstyled small mb-2 mt-1">
                                {lessons.map((lesson) => (
                                  <li
                                    key={lesson.id}
                                    className={`d-flex justify-content-between align-items-start py-1 px-2 ${lesson.id === activeLessonId ? "bg-light rounded" : ""}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      setActiveSectionId(section.id);
                                      setActiveLessonId(lesson.id);
                                    }}
                                  >
                                    <div>
                                      <span>{lesson.title}</span>
                                      <div className="small text-muted">
                                        <span className="text-capitalize">{lesson.type || "video"}</span>
                                        {lesson.isPreview && <span className="badge bg-outline-success ms-2">Preview</span>}
                                      </div>
                                    </div>
                                    <div className="small text-muted">{(lesson.durationMinutes || 0) + "m"}</div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn p-2 btn-outline-primary w-100"
                        onClick={() => navigate(`/admin/courses/${courseId}/curriculum`)}
                      >
                        Add/Edit lessons (Go to Curriculum Page)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Create batch quick actions */}
                <div className="mt-3 d-grid gap-2">
                  <button className="btn btn-outline-primary" onClick={() => handleCreateBatch("online")}>Create Online Batch</button>
                  <button className="btn btn-outline-primary" onClick={() => handleCreateBatch("offline")}>Create Offline Batch</button>
                  <button className="btn btn-outline-primary" onClick={() => handleCreateBatch("hybrid")}>Create Hybrid Batch</button>
                </div>
              </div>
              {/* END RIGHT COLUMN */}
            </div>
          </div>
          
          {/* Toast container - placed slightly lower so it doesn't overlap header. width limited */}
          <div
            className="toast-container position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1200, top: "72px", right: "1rem", maxWidth: "340px" }}
          >
            <div
              className={`toast align-items-center ${toast.variant === "danger" ? "bg-danger text-white" : toast.variant === "warning" ? "bg-warning text-dark" : "bg-success text-white"} ${toast.show ? "show" : ""}`}
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div className="d-flex">
                <div className="toast-body">{toast.message}</div>
                <button
                  type="button"
                  className={`btn-close ${toast.variant === "warning" ? "" : "btn-close-white"} me-2 m-auto`}
                  aria-label="Close"
                  onClick={() => setToast((t) => ({ ...t, show: false }))}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CoursePreviewPage;

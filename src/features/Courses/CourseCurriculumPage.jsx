// src/features/Courses/pages/CourseCurriculumPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchCurriculum,
  createSection,
  createLesson,
  updateSection,
  deleteSection,
  updateLesson,
  deleteLesson,
  getCourseById,
  updateLessonMaterial,
  updateCourse,
} from "./api/coursesApi";

import {
  ArrowLeft,
  Save as SaveIcon,
  Plus,
  Layers,
  BookOpen,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from "lucide-react";

import "./CourseCurriculumPage.css";

const LESSON_TYPES = [
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF / Document" },
  { value: "text", label: "Text / Article" },
  { value: "quiz", label: "Quiz" },
];

// Helper: get playable URL from a lesson (from backend)
const getLessonPlayableUrl = (lesson) => {
  if (!lesson) return "";
  
  // 1. Prioritize videoUrl for video types
  if (lesson.type === "video") {
     if (lesson.videoUrl) return lesson.videoUrl;
     // Fallback to resourceUrl if videoUrl is empty
     if (lesson.resourceUrl && !String(lesson.resourceUrl).startsWith("mock://")) {
       return lesson.resourceUrl;
     }
  }

  // 2. Default check for other types
  const raw =
    lesson.videoUrl ||
    (lesson.resourceUrl &&
      !String(lesson.resourceUrl).startsWith("mock://local/") &&
      lesson.resourceUrl);
  return raw || "";
};

// Helper: detect YouTube & build embed URL
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be")
    ) {
      let videoId = "";
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.replace("/", "");
      } else {
        videoId = u.searchParams.get("v") || "";
      }
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    return null;
  }
  return null;
};

// Shared helpers for course meta labels
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
    (course?.approval &&
      (course.approval.state || course.approval.status)) ||
    "";
  const normalized = String(raw || "").toLowerCase();

  if (!normalized || normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "in-review" || normalized === "review")
    return "In Review";

  return raw || "Pending";
};

const CourseCurriculumPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);

  const [lessonDraft, setLessonDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // About-course editing (admin)
  const [aboutDraft, setAboutDraft] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);

  // Modals state
  const [sectionModal, setSectionModal] = useState({
    mode: null, // "create" | "rename"
    sectionId: null,
    title: "",
  });

  const [lessonModal, setLessonModal] = useState({
    sectionId: null,
    title: "",
  });

  const [deleteModal, setDeleteModal] = useState({
    type: null, // "section" | "lesson"
    id: null,
    label: "",
  });

  // Load course + curriculum
  useEffect(() => {
    const load = async () => {
      try {
        if (!courseId) return;
        setLoading(true);
        setError("");

        const [courseRes, curRes] = await Promise.all([
          getCourseById(courseId),
          fetchCurriculum(courseId),
        ]);

        const loadedCourse = courseRes?.data || courseRes;
        if (!loadedCourse) {
          setCourse(null);
          setSections([]);
          setError("Course not found");
          return;
        }

        setCourse(loadedCourse);

        const desc =
          loadedCourse.description ||
          loadedCourse.fullDescription ||
          loadedCourse.shortDescription ||
          "";
        setAboutDraft(desc);

        const loadedSections =
          (curRes?.data && curRes.data.sections) || curRes.sections || [];
        setSections(loadedSections);
      } catch (err) {
        console.error(err);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  // Compute active section & lesson from IDs
  const activeSection =
    sections.find((s) => s.id === activeSectionId) || null;
  const activeLesson =
    activeSection?.lessons?.find((l) => l.id === activeLessonId) || null;

  // Keep active section/lesson in sync with sections list
  useEffect(() => {
    if (!sections.length) {
      setActiveSectionId(null);
      setActiveLessonId(null);
      setLessonDraft(null);
      return;
    }

    const currentSection =
      sections.find((s) => s.id === activeSectionId) || sections[0];

    if (currentSection && currentSection.id !== activeSectionId) {
      setActiveSectionId(currentSection.id);
    }

    if (!currentSection.lessons || !currentSection.lessons.length) {
      setActiveLessonId(null);
      setLessonDraft(null);
      return;
    }

    const currentLesson =
      currentSection.lessons.find((l) => l.id === activeLessonId) ||
      currentSection.lessons[0];

    if (currentLesson && currentLesson.id !== activeLessonId) {
      setActiveLessonId(currentLesson.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Sync lessonDraft whenever activeLesson changes
  useEffect(() => {
    if (!activeLesson) {
      setLessonDraft(null);
      return;
    }

    const url = getLessonPlayableUrl(activeLesson);

    setLessonDraft({
      id: activeLesson.id,
      title: activeLesson.title || "",
      type: activeLesson.type || "video",
      durationMinutes:
        typeof activeLesson.durationMinutes === "number"
          ? String(activeLesson.durationMinutes)
          : "",
      isPreview: !!activeLesson.isPreview,
      resourceUrl: url || "",
    });
  }, [activeLessonId, activeSectionId, sections]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 1800);
  };

  const getSectionDuration = (section) =>
    (section.lessons || []).reduce(
      (sum, l) => sum + (l.durationMinutes || 0),
      0
    );

  const totalLessons = sections.reduce(
    (sum, s) => sum + (s.lessons?.length || 0),
    0
  );
  const totalDurationMinutes = sections.reduce(
    (sum, s) =>
      sum +
      (s.lessons || []).reduce(
        (ls, l) => ls + (l.durationMinutes || 0),
        0
      ),
    0
  );
  const previewLessons = sections.reduce(
    (sum, s) =>
      sum +
      (s.lessons || []).filter((l) => l.isPreview).length,
    0
  );

  const formatDuration = (minutes) => {
    const mins = minutes || 0;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hours > 0) return `${hours}h ${rem}m`;
    return `${rem}m`;
  };

  /* ========== SECTION HANDLERS ========== */

  const handleAddSection = async (titleFromUi) => {
    if (!courseId) return;
    const defaultTitle = `Section ${sections.length + 1}`;
    const title = (titleFromUi && titleFromUi.trim()) || defaultTitle;

    try {
      setSaving(true);
      const { data: newSection } = await createSection(courseId, title);
      const updated = [...sections, { ...newSection, lessons: [] }];
      setSections(updated);
      setActiveSectionId(newSection.id);
      setActiveLessonId(null);
      setLessonDraft(null);
      showSuccess("Section added");
    } catch (err) {
      console.error(err);
      setError("Failed to add section");
    } finally {
      setSaving(false);
    }
  };

  const handleRenameSection = async (sectionId, newTitle) => {
    const trimmed = (newTitle || "").trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      const { data: updated } = await updateSection(sectionId, {
        title: trimmed,
      });

      setSections((prev) =>
        prev.map((sec) =>
          sec.id === sectionId ? { ...sec, ...updated } : sec
        )
      );
      showSuccess("Section name updated");
    } catch (err) {
      console.error(err);
      setError("Failed to rename section");
    } finally {
      setSaving(false);
    }
  };

  const moveSection = async (sectionId, direction) => {
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const withOrder = updated.map((sec, idx) => ({
      ...sec,
      order: idx + 1,
    }));

    setSections(withOrder);

    try {
      setSaving(true);
      await Promise.all(
        withOrder.map((sec) => updateSection(sec.id, { order: sec.order }))
      );
      showSuccess("Section order updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update section order");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      setSaving(true);
      await deleteSection(sectionId);
      const remaining = sections.filter((s) => s.id !== sectionId);
      setSections(remaining);

      if (activeSectionId === sectionId) {
        const next = remaining[0] || null;
        setActiveSectionId(next ? next.id : null);
        setActiveLessonId(null);
        setLessonDraft(null);
      }
      showSuccess("Section deleted");
    } catch (err) {
      console.error(err);
      setError("Failed to delete section");
    } finally {
      setSaving(false);
    }
  };

  /* ========== LESSON HANDLERS ========== */

  const handleAddLesson = async (sectionId, titleFromUi) => {
    if (!courseId) return;
    const section = sections.find((s) => s.id === sectionId);
    const defaultTitle = `Lesson ${(section?.lessons?.length || 0) + 1}`;
    const title = (titleFromUi && titleFromUi.trim()) || defaultTitle;

    try {
      setSaving(true);
      const { data: newLesson } = await createLesson(courseId, sectionId, {
        title,
        type: "video",
      });

      setSections((prev) =>
        prev.map((sec) =>
          sec.id === sectionId
            ? { ...sec, lessons: [...(sec.lessons || []), newLesson] }
            : sec
        )
      );

      setActiveSectionId(sectionId);
      setActiveLessonId(newLesson.id);
      showSuccess("Lesson added");
    } catch (err) {
      console.error(err);
      setError("Failed to add lesson");
    } finally {
      setSaving(false);
    }
  };

  const persistLessonField = async (lessonId, field, value) => {
    if (!lessonId) return;
    try {
      setSaving(true);

      // Map "resourceUrl" from UI → proper backend fields
      let payload = {};
      if (field === "resourceUrl") {
        const normalized = typeof value === "string" ? value.trim() : value;
        const isVideo = lessonDraft?.type === "video";

        if (isVideo) {
          // Video: must provide videoUrl + videoSource (cannot be null)
          // Detect if youtube, else default to sharepoint (since external not supported)
          const isYoutube = normalized && (normalized.includes("youtube.com") || normalized.includes("youtu.be"));
          payload = {
            videoUrl: normalized || "", // Ensures not null/undefined
            videoSource: isYoutube ? "youtube" : "sharepoint", 
            resourceUrl: null
          };
        } else {
          // Text/PDF: use resourceUrl
          payload = { 
            resourceUrl: normalized || null,
            videoUrl: null
            // do NOT send videoSource: null, as it causes 400 error
          };
        }
      } else if (field === "durationMinutes") {
        payload = { [field]: value ?? 0 };
      } else {
        payload = { [field]: value };
      }

      const { data: updated } = await updateLesson(lessonId, payload);

      // Update sections with latest lesson from backend
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          lessons: (sec.lessons || []).map((l) =>
            l.id === lessonId ? updated : l
          ),
        }))
      );

      // Keep draft in sync with updated lesson
      setLessonDraft((prev) => {
        if (!prev || prev.id !== lessonId) return prev;

        // Re-calculate the URL to display
        const freshUrl = getLessonPlayableUrl(updated);

        return {
          ...prev,
          title: updated.title ?? prev.title,
          type: updated.type ?? prev.type,
          durationMinutes:
            typeof updated.durationMinutes === "number"
              ? String(updated.durationMinutes)
              : prev.durationMinutes,
          isPreview: !!updated.isPreview,
          resourceUrl: freshUrl, // Force update URL
        };
      });

      showSuccess("Lesson updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleLessonDraftChange = (field, value) => {
    setLessonDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUploadMaterial = async (lessonId, file) => {
    if (!file) return;
    try {
      setSaving(true);

      const { data: updated } = await updateLessonMaterial(lessonId, file);

      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          lessons: (sec.lessons || []).map((l) =>
            l.id === lessonId ? updated : l
          ),
        }))
      );

      // If backend sends a URL after upload, we can try to use it.
      setLessonDraft((prev) => {
        if (!prev || prev.id !== lessonId) return prev;

        const url = getLessonPlayableUrl(updated);
        return {
          ...prev,
          resourceUrl: url || prev.resourceUrl,
        };
      });

      showSuccess("Material linked");
    } catch (err) {
      console.error(err);
      setError("Failed to attach material");
    } finally {
      setSaving(false);
    }
  };

  const moveLesson = async (sectionId, lessonId, direction) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.lessons) return;

    const lessons = section.lessons;
    const index = lessons.findIndex((l) => l.id === lessonId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    const updatedLessons = [...lessons];
    const temp = updatedLessons[index];
    updatedLessons[index] = updatedLessons[newIndex];
    updatedLessons[newIndex] = temp;

    const withOrder = updatedLessons.map((l, idx) => ({
      ...l,
      order: idx + 1,
    }));

    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, lessons: withOrder } : sec
      )
    );

    try {
      setSaving(true);
      await Promise.all(
        withOrder.map((l) => updateLesson(l.id, { order: l.order }))
      );
      showSuccess("Lesson order updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update lesson order");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      setSaving(true);
      await deleteLesson(lessonId);
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          lessons: (sec.lessons || []).filter((l) => l.id !== lessonId),
        }))
      );
      if (activeLessonId === lessonId) {
        setActiveLessonId(null);
        setLessonDraft(null);
      }
      showSuccess("Lesson deleted");
    } catch (err) {
      console.error(err);
      setError("Failed to delete lesson");
    } finally {
      setSaving(false);
    }
  };

  /* ========== ABOUT COURSE (EDITABLE) ========== */

  const handleSaveAbout = async () => {
    if (!courseId) return;
    const trimmed = (aboutDraft || "").trim();

    try {
      setAboutSaving(true);
      setError("");

      const payload = {
        description: trimmed || null,
        fullDescription: trimmed || null,
      };

      const { data: updated } = await updateCourse(courseId, payload);

      setCourse((prev) => ({
        ...prev,
        ...(updated || payload),
      }));

      showSuccess("Course description updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update course description");
    } finally {
      setAboutSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/courses");
  };

  /* ========== MODAL HELPERS ========== */

  const openCreateSectionModal = () => {
    const defaultTitle = `Section ${sections.length + 1}`;
    setSectionModal({
      mode: "create",
      sectionId: null,
      title: defaultTitle,
    });
  };

  const openRenameSectionModal = (section) => {
    setSectionModal({
      mode: "rename",
      sectionId: section.id,
      title: section.title || "Untitled section",
    });
  };

  const handleSectionModalSubmit = async (e) => {
    e.preventDefault();
    if (!sectionModal.mode) return;

    if (sectionModal.mode === "create") {
      await handleAddSection(sectionModal.title);
    } else if (sectionModal.mode === "rename") {
      await handleRenameSection(sectionModal.sectionId, sectionModal.title);
    }

    setSectionModal({ mode: null, sectionId: null, title: "" });
  };

  const openCreateLessonModal = (section) => {
    const count = section.lessons?.length || 0;
    const defaultTitle = `Lesson ${count + 1}`;
    setLessonModal({
      sectionId: section.id,
      title: defaultTitle,
    });
  };

  const handleLessonModalSubmit = async (e) => {
    e.preventDefault();
    if (!lessonModal.sectionId) return;

    await handleAddLesson(lessonModal.sectionId, lessonModal.title);
    setLessonModal({ sectionId: null, title: "" });
  };

  const openDeleteModal = (type, id, label) => {
    setDeleteModal({ type, id, label });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.type || !deleteModal.id) return;

    if (deleteModal.type === "section") {
      await handleDeleteSection(deleteModal.id);
    } else if (deleteModal.type === "lesson") {
      await handleDeleteLesson(deleteModal.id);
    }

    setDeleteModal({ type: null, id: null, label: "" });
  };

  /* ========== RENDER ========== */

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="p-4">Loading curriculum…</div>
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
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleBack}
              >
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
          <div className="nk-content-body p-4">
            Course not found.
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleBack}
              >
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const courseDescription =
    (aboutDraft && aboutDraft.trim()) ||
    course.description ||
    course.fullDescription ||
    course.shortDescription ||
    "This course description can be managed from the course settings.";

  // Hero uses the currently edited lesson resource
  const heroUrl = (lessonDraft?.resourceUrl || "").trim();
  const youTubeEmbed = heroUrl ? getYouTubeEmbedUrl(heroUrl) : null;
  const isVideoFile =
    heroUrl && /\.(mp4|webm|ogg|mov|mkv)$/i.test(heroUrl);

  const priceLabel = getPriceLabel(course);
  const approvalLabel = getApprovalLabel(course);
  const languageLabel = course.language || "English";
  const levelLabel = course.level || "Beginner";

  return (
    <>
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            {/* PAGE HEADER */}
            <div className="nk-block-head nk-block-head-sm mb-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1 d-flex align-items-center gap-2">
                    <BookOpen size={20} />
                    <span>Course Curriculum</span>
                  </h4>
                  <div className="text-muted small">
                    Organise sections and lessons for{" "}
                    <strong>{course.title}</strong>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2"
                    onClick={handleBack}
                    disabled={saving}
                  >
                    <span>Back to Courses</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2"
                    onClick={() =>
                      showSuccess("All recent changes are saved.")
                    }
                    disabled={saving}
                  >
                    <span>{saving ? "Saving…" : "Saved"}</span>
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-3 py-2">{error}</div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="nk-block">
              <div className="row g-4 align-items-start">
                {/* LEFT COLUMN */}
                <div className="col-12 col-xl-8">
                  {/* HERO + METRICS CARD */}
                  <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                    <div className="card-body p-3 p-md-4">
                      {/* Hero: video or thumbnail */}
                      <div className="mb-3">
                        <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-light vp-hero-video position-relative">
                          {heroUrl ? (
                            <>
                              {youTubeEmbed ? (
                                <iframe
                                  src={youTubeEmbed}
                                  title="Lesson video"
                                  className="w-100 h-100 border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : isVideoFile ? (
                                <video
                                  className="w-100 h-100"
                                  style={{ objectFit: "cover" }}
                                  src={heroUrl}
                                  controls
                                />
                              ) : (
                                <iframe
                                  src={heroUrl}
                                  title="Lesson resource"
                                  className="w-100 h-100 border-0"
                                />
                              )}
                            </>
                          ) : course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt="Course thumbnail"
                              className="img-fluid w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 text-muted">
                              <PlayCircleHint />
                            </div>
                          )}
                        </div>

                        {heroUrl && activeLesson && (
                          <div className="mt-2 small text-muted">
                            Previewing:{" "}
                            <strong>
                              {activeLesson.title || "Current lesson"}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Title & subtitle */}
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center p-2">
                            <i className="bi bi-person text-muted" />
                          </div>
                          <div>
                            <div className="small fw-semibold">
                              {course.title}
                            </div>
                            <div className="small text-muted">
                              {course.subtitle || "Course"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="row g-2 mb-2">
                        <div className="col-6 col-md-3">
                          <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                            <span className="text-muted small">
                              Total Lessons
                            </span>
                            <span className="fw-bold">{totalLessons}</span>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                            <span className="text-muted small">
                              Total Duration
                            </span>
                            <span className="fw-bold">
                              {formatDuration(totalDurationMinutes)}
                            </span>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                            <span className="text-muted small">
                              Preview Lessons
                            </span>
                            <span className="fw-bold">{previewLessons}</span>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="border rounded-3 px-3 py-2 h-100 d-flex flex-column justify-content-center vp-metric-card">
                            <span className="text-muted small">Sections</span>
                            <span className="fw-bold">
                              {sections.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* META chips */}
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        <span className="badge rounded-pill bg-light text-muted small">
                          Status:
                          <span className="ms-1 text-capitalize">
                            {course.status || "draft"}
                          </span>
                        </span>
                        <span className="badge rounded-pill bg-light text-muted small">
                          Approval:
                          <span className="ms-1">{approvalLabel}</span>
                        </span>
                        <span className="badge rounded-pill bg-light text-muted small">
                          {priceLabel}
                        </span>
                        <span className="badge rounded-pill bg-light text-muted small">
                          {languageLabel} •{" "}
                          <span className="text-capitalize">
                            {levelLabel}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ABOUT COURSE CARD – EDITABLE */}
                  <div className="card border-0 shadow-sm mb-3 vp-card-rounded">
                    <div className="card-body p-3 p-md-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">About Course</h5>
                        <small className="text-muted">
                          Shown on the public course page
                        </small>
                      </div>
                      <textarea
                        className="form-control small"
                        rows={4}
                        value={courseDescription}
                        onChange={(e) => setAboutDraft(e.target.value)}
                        placeholder="Describe what this course is about, who it's for, and what students will learn."
                      />
                      <div className="d-flex justify-content-end mt-3">
                        <button
                          type="button"
                          className="btn btn-primary d-flex align-items-center gap-2 px-3 p-2"
                          onClick={handleSaveAbout}
                          disabled={aboutSaving}
                        >
                          <span>
                            {aboutSaving ? "Saving…" : "Save Description"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CURRICULUM EDITOR (lesson details) */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Curriculum Editor</h6>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 vp-dashed-btn px-3 p-3"
                      onClick={openCreateSectionModal}
                      disabled={saving}
                    >
                      <span>Add Section</span>
                    </button>
                  </div>

                  {/* LESSON EDITOR / STATES */}
                  {!sections.length && (
                    <div className="card border-0 shadow-sm vp-card-rounded">
                      <div className="card-body text-center py-5">
                        <div className="mb-3 d-flex justify-content-center">
                          <div className="rounded-circle bg-light p-3 d-inline-flex">
                            <Layers size={32} className="text-muted" />
                          </div>
                        </div>
                        <h6 className="mb-1">No sections yet</h6>
                        <p className="text-muted small mb-0">
                          Click <strong>Add Section</strong> to start building
                          your curriculum.
                        </p>
                      </div>
                    </div>
                  )}

                  {sections.length > 0 && !activeLesson && activeSection && (
                    <div className="card border-0 shadow-sm vp-card-rounded">
                      <div className="card-body text-center py-5">
                        <div className="mb-3 d-flex justify-content-center">
                          <div className="rounded-circle bg-light p-3 d-inline-flex">
                            <BookOpen size={32} className="text-muted" />
                          </div>
                        </div>
                        <h6 className="mb-1">Select a lesson</h6>
                        <p className="text-muted small mb-0">
                          Choose a lesson from the{" "}
                          <strong>Course Content</strong> panel on the right
                          to edit its details here.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeLesson && activeSection && lessonDraft && (
                    <div className="card border-0 shadow-sm vp-card-rounded">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <div className="text-muted small mb-1">
                              Editing Lesson
                            </div>
                            <h6 className="mb-0">
                              {lessonDraft.title || "Untitled lesson"}
                            </h6>
                            <div className="text-muted small">
                              In section:{" "}
                              <strong>
                                {activeSection.title || "Untitled section"}
                              </strong>
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-outline-light btn-sm"
                              onClick={() =>
                                moveLesson(
                                  activeSection.id,
                                  activeLesson.id,
                                  "up"
                                )
                              }
                              disabled={
                                (activeSection.lessons || []).findIndex(
                                  (l) => l.id === activeLesson.id
                                ) === 0 || saving
                              }
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-light btn-sm"
                              onClick={() =>
                                moveLesson(
                                  activeSection.id,
                                  activeLesson.id,
                                  "down"
                                )
                              }
                              disabled={
                                (activeSection.lessons || []).findIndex(
                                  (l) => l.id === activeLesson.id
                                ) ===
                                  (activeSection.lessons || []).length - 1 ||
                                saving
                              }
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() =>
                                openDeleteModal(
                                  "lesson",
                                  activeLesson.id,
                                  lessonDraft.title || "this lesson"
                                )
                              }
                              disabled={saving}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Lesson title */}
                        <div className="mb-3">
                          <label className="form-label">
                            Lesson Title{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={lessonDraft.title}
                            placeholder="Enter lesson title"
                            onChange={(e) =>
                              handleLessonDraftChange(
                                "title",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              persistLessonField(
                                lessonDraft.id,
                                "title",
                                lessonDraft.title.trim() ||
                                  "Untitled lesson"
                              )
                            }
                          />
                        </div>

                        {/* Lesson type & duration */}
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label">
                              Lesson Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={lessonDraft.type}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleLessonDraftChange("type", value);
                                persistLessonField(
                                  lessonDraft.id,
                                  "type",
                                  value
                                );
                              }}
                            >
                              {LESSON_TYPES.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              value={lessonDraft.durationMinutes}
                              onChange={(e) =>
                                handleLessonDraftChange(
                                  "durationMinutes",
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                persistLessonField(
                                  lessonDraft.id,
                                  "durationMinutes",
                                  lessonDraft.durationMinutes
                                    ? Number(lessonDraft.durationMinutes)
                                    : 0
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Preview toggle */}
                        <div className="mb-3">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`preview-${lessonDraft.id}`}
                              checked={!!lessonDraft.isPreview}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                handleLessonDraftChange(
                                  "isPreview",
                                  checked
                                );
                                persistLessonField(
                                  lessonDraft.id,
                                  "isPreview",
                                  checked
                                );
                              }}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`preview-${lessonDraft.id}`}
                            >
                              Mark as free preview
                            </label>
                          </div>
                          <small className="text-muted">
                            Preview lessons can be watched by anyone
                            before enrolling.
                          </small>
                        </div>

                        {/* Resource URL */}
                        <div className="mb-3">
                          <label className="form-label">
                            Resource / Video URL (optional)
                          </label>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="https://youtube.com/... or https://cdn.yoursite.com/video.mp4"
                            value={lessonDraft.resourceUrl}
                            onChange={(e) =>
                              handleLessonDraftChange(
                                "resourceUrl",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              persistLessonField(
                                lessonDraft.id,
                                "resourceUrl",
                                lessonDraft.resourceUrl
                              )
                            }
                          />
                          <small className="text-muted">
                            Paste a direct link to a video, PDF, or any
                            external resource.
                          </small>
                        </div>

                        {/* Upload material */}
                        <div className="mb-3">
                          <label className="form-label">
                            Upload / Replace file (optional)
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) =>
                              handleUploadMaterial(
                                lessonDraft.id,
                                e.target.files?.[0] || null
                              )
                            }
                            disabled={saving}
                          />
                          <div className="small text-muted mt-1">
                            {(() => {
                              const currentUrl =
                                activeLesson?.videoUrl ||
                                activeLesson?.resourceUrl;
                              return currentUrl
                                ? `Current: ${currentUrl}`
                                : "No file or link attached yet";
                            })()}
                          </div>
                        </div>

                        {/* Explicit SAVE button */}
                        <div className="mt-2 d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3"
                            onClick={() =>
                              persistLessonField(
                                lessonDraft.id,
                                "resourceUrl",
                                lessonDraft.resourceUrl.trim() || null
                              )
                            }
                            disabled={saving}
                          >
                            <SaveIcon size={16} />
                            <span>{saving ? "Saving…" : "Save Lesson"}</span>
                          </button>
                        </div>

                        {saving && (
                          <div className="text-muted small mt-2">
                            Saving changes…
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN – COURSE CONTENT CARD */}
                <div className="col-12 col-xl-4">
                  <div className="card border-0 shadow-sm vp-course-content-card">
                    {/* Header */}
                    <div className="card-header bg-white border-0 pt-3 pb-2 px-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 d-flex align-items-center gap-2">
                          <Layers size={18} />
                          <span>Course Content</span>
                        </h6>
                        <span className="badge rounded-pill bg-light text-muted small">
                          {sections.length} Modules • {totalLessons} Lessons
                        </span>
                      </div>
                      <div className="mt-1 small text-muted">
                        Total duration: {formatDuration(totalDurationMinutes)}
                      </div>
                    </div>

                    <div className="card-body pt-2 pb-3 px-3 vp-course-content-body">
                      {/* Empty state */}
                      {!sections.length && (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                          <Layers className="mb-2 opacity-75" size={32} />
                          <p className="small fw-medium mb-1">
                            No sections created yet
                          </p>
                          <small className="text-center px-3">
                            Start with your first module using{" "}
                            <strong>Add Section</strong>.
                          </small>
                        </div>
                      )}

                      {/* Sections */}
                      {sections.length > 0 && (
                        <div className="vp-course-content-scroll">
                          {sections.map((section, idx) => {
                            const lessons = section.lessons || [];
                            const isSectionActive =
                              section.id === activeSectionId ||
                              (!activeSectionId && idx === 0);
                            const sectionDuration = formatDuration(
                              getSectionDuration(section)
                            );

                            return (
                              <div key={section.id} className="mb-3">
                                {/* Section pill */}
                                <div
                                  className={`d-flex align-items-center justify-content-between px-3 py-2 mb-1 vp-section-pill ${
                                    isSectionActive ? "active" : ""
                                  }`}
                                  onClick={() => {
                                    setActiveSectionId(section.id);
                                    if (lessons.length) {
                                      setActiveLessonId(lessons[0].id);
                                    } else {
                                      setActiveLessonId(null);
                                    }
                                  }}
                                >
                                  <div className="d-flex flex-column flex-grow-1">
                                    <span className="fw-semibold text-truncate">
                                      {section.title || "Untitled Section"}
                                    </span>
                                    <span className="vp-section-pill-sub">
                                      {lessons.length} Lessons
                                    </span>
                                  </div>

                                  <div className="d-flex align-items-center gap-2 ms-2">
                                    <span className="vp-section-duration-pill">
                                      {sectionDuration}
                                    </span>

                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-light border-0"
                                      title="Rename section"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameSectionModal(section);
                                      }}
                                      disabled={saving}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-light border-0"
                                      title="Move up"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveSection(section.id, "up");
                                      }}
                                      disabled={idx === 0 || saving}
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-light border-0"
                                      title="Move down"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveSection(section.id, "down");
                                      }}
                                      disabled={
                                        idx === sections.length - 1 || saving
                                      }
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-light border-0 text-danger"
                                      title="Delete section"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(
                                          "section",
                                          section.id,
                                          section.title ||
                                            "this section and all its lessons"
                                        );
                                      }}
                                      disabled={saving}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Lessons inside section */}
                                {lessons.length > 0 ? (
                                  lessons.map((lesson, lessonIdx) => (
                                    <div
                                      key={lesson.id}
                                      className={`d-flex align-items-center justify-content-between px-3 py-2 vp-lesson-pill ${
                                        lesson.id === activeLessonId
                                          ? "active"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        setActiveLessonId(lesson.id)
                                      }
                                    >
                                      <div className="d-flex align-items-center flex-grow-1">
                                        <span className="vp-lesson-bullet me-2" />
                                        <div className="d-flex flex-column">
                                          <span className="text-truncate">
                                            {lesson.title ||
                                              "Untitled Lesson"}
                                          </span>
                                          <div className="small text-muted d-flex align-items-center gap-2">
                                            <span className="text-capitalize">
                                              {lesson.type || "video"}
                                            </span>
                                            {lesson.isPreview && (
                                              <span className="badge bg-outline-success">
                                                Preview
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="d-flex align-items-center gap-1 ms-2">
                                        <small className="text-muted">
                                          {(lesson.durationMinutes || 0) + "m"}
                                        </small>
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-outline-light border-0"
                                          title="Move up"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveLesson(
                                              section.id,
                                              lesson.id,
                                              "up"
                                            );
                                          }}
                                          disabled={
                                            lessonIdx === 0 || saving
                                          }
                                        >
                                          <ArrowUp size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-outline-light border-0"
                                          title="Move down"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveLesson(
                                              section.id,
                                              lesson.id,
                                              "down"
                                            );
                                          }}
                                          disabled={
                                            lessonIdx ===
                                              lessons.length - 1 || saving
                                          }
                                        >
                                          <ArrowDown size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-outline-light border-0"
                                          title="Delete lesson"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(
                                              "lesson",
                                              lesson.id,
                                              lesson.title ||
                                                "this lesson"
                                            );
                                          }}
                                          disabled={saving}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-2">

                                  </div>
                                )}

                                {/* Add lesson button */}
                                <button
                                  className="btn btn-outline-primary btn-sm w-100 p-2 mt-1 d-flex align-items-center  gap-2"
                                  onClick={() => openCreateLessonModal(section)}
                                  disabled={saving}
                                >
                                  <span>Add Lesson</span>
                                </button>
                              </div>
                            );
                          })}

                          {/* Bottom Add Section */}
                          <button
                            type="button"
                            className="btn btn-light w-100 p-3 mt-1 vp-dashed-btn d-flex align-items-center justify-content-center gap-2"
                            onClick={openCreateSectionModal}
                            disabled={saving}
                          >
                            <Plus size={16} />
                            <span>Add New Section</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* END RIGHT COLUMN */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {successMsg && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1080 }}
        >
          <div className="toast show align-items-center text-bg-success border-0 shadow">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setSuccessMsg("")}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION CREATE / RENAME MODAL */}
      {sectionModal.mode && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(15,23,42,0.45)",
            zIndex: 1070,
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">
                  {sectionModal.mode === "create"
                    ? "Add Section"
                    : "Rename Section"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setSectionModal({
                      mode: null,
                      sectionId: null,
                      title: "",
                    })
                  }
                />
              </div>
              <form onSubmit={handleSectionModalSubmit}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Section title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sectionModal.title}
                      onChange={(e) =>
                        setSectionModal((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                      setSectionModal({
                        mode: null,
                        sectionId: null,
                        title: "",
                      })
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    <SaveIcon size={16} />
                    <span>{saving ? "Saving…" : "Save"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LESSON CREATE MODAL */}
      {lessonModal.sectionId && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(15,23,42,0.45)",
            zIndex: 1070,
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">Add Lesson</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setLessonModal({ sectionId: null, title: "" })
                  }
                />
              </div>
              <form onSubmit={handleLessonModalSubmit}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Lesson title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={lessonModal.title}
                      onChange={(e) =>
                        setLessonModal((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                      setLessonModal({ sectionId: null, title: "" })
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    <SaveIcon size={16} />
                    <span>{saving ? "Creating…" : "Create Lesson"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModal.type && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(15,23,42,0.45)",
            zIndex: 1070,
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Trash2 size={18} />
                  <span>Confirm delete</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setDeleteModal({ type: null, id: null, label: "" })
                  }
                />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to delete{" "}
                  <strong>{deleteModal.label}</strong>? This action cannot be
                  undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() =>
                    setDeleteModal({ type: null, id: null, label: "" })
                  }
                  disabled={saving}
                >
                  <XCircle size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-2"
                  onClick={handleDeleteConfirm}
                  disabled={saving}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** Small helper component just for the hero empty state */
const PlayCircleHint = () => (
  <div className="text-center text-muted small d-flex flex-column align-items-center justify-content-center w-100 h-100 px-3">
    <PlayCircle size={40} className="mb-2 opacity-75" />
    <span className="fw-medium mb-1">Lesson preview will appear here</span>
    <span>Attach a video or resource link to a lesson to see it here.</span>
  </div>
);

export default CourseCurriculumPage;
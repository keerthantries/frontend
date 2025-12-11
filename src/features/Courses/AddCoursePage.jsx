// src/features/Courses/AddCoursePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse } from "./api/coursesApi";
import { FiTrash2 } from "react-icons/fi";

const CATEGORY_OPTIONS = [
  { value: "fullstack", label: "Full Stack Development" },
  { value: "frontend", label: "Frontend Development" },
  { value: "backend", label: "Backend Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "testing", label: "Test Automation" },
  { value: "cybersecurity", label: "Cyber Security" },
  { value: "ai", label: "AI / ML" },
  { value: "others", label: "Others" },
];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all-levels", label: "All Levels" },
];

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "telugu", label: "Telugu" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const AddCoursePage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [level, setLevel] = useState("beginner");
  const [language, setLanguage] = useState("english");

  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");

  const [learningOutcomes, setLearningOutcomes] = useState([
    "Understand the fundamentals.",
  ]);
  const [requirements, setRequirements] = useState([
    "Basic understanding of.",
  ]);

  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [status, setStatus] = useState("draft");

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailBase64, setThumbnailBase64] = useState("");

  const [tags, setTags] = useState("");
  const [estimatedDurationHours, setEstimatedDurationHours] = useState("");
  const [totalLessonsPlanned, setTotalLessonsPlanned] = useState("");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Auto-generate slug from title
  useEffect(() => {
    if (!title) {
      setSlug("");
      return;
    }
    setSlug(
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
    );
  }, [title]);

  // Thumbnail preview + Base64
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview("");
      setThumbnailBase64("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setThumbnailPreview(base64);
      setThumbnailBase64(base64);
    };
    reader.readAsDataURL(thumbnailFile);
  }, [thumbnailFile]);

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Course title is required";
    } else if (title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!shortDescription.trim()) {
      newErrors.shortDescription = "Short description is required";
    }

    if (!category) newErrors.category = "Category is required";

    if (category === "others" && !customCategory.trim()) {
      newErrors.customCategory = "Please specify the course category";
    }

    if (!level) newErrors.level = "Level is required";
    if (!language) newErrors.language = "Language is required";

    if (!isFree) {
      if (!price || Number(price) <= 0) {
        newErrors.price =
          "Price must be greater than 0 or mark course as free";
      }
    }

    if (discountPercentage) {
      const d = Number(discountPercentage);
      if (d < 0 || d > 100) {
        newErrors.discountPercentage = "Discount must be between 0 and 100";
      }
    }

    if (!learningOutcomes.some((item) => item.trim().length > 0)) {
      newErrors.learningOutcomes = "Add at least one learning outcome";
    }

    if (!thumbnailFile) {
      newErrors.thumbnail = "Course thumbnail is required";
    }

    if (!status) {
      newErrors.status = "Status is required";
    }

    return newErrors;
  };

  const handleOutcomeChange = (index, value) => {
    const updated = [...learningOutcomes];
    updated[index] = value;
    setLearningOutcomes(updated);
  };

  const handleAddOutcome = () => {
    setLearningOutcomes([...learningOutcomes, ""]);
  };

  const handleRemoveOutcome = (index) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index, value) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const handleAddRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const handleRemoveRequirement = (index) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const buildPayload = () => {
    const selectedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      slug: slug.trim() || null,
      category,
      customCategory:
        category === "others" ? customCategory.trim() || null : null,
      level,
      language,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim() || null,
      learningOutcomes: learningOutcomes
        .map((item) => item.trim())
        .filter(Boolean),
      requirements: requirements.map((item) => item.trim()).filter(Boolean),
      pricing: {
        isFree,
        price: isFree ? 0 : Number(price),
        discountPercentage: discountPercentage
          ? Number(discountPercentage)
          : 0,
      },
      status,
      // default approval for brand new course
      approvalStatus: "pending",
      estimatedDurationHours: estimatedDurationHours
        ? Number(estimatedDurationHours)
        : null,
      totalLessonsPlanned: totalLessonsPlanned
        ? Number(totalLessonsPlanned)
        : null,
      tags: selectedTags,
      seo: {
        metaTitle: metaTitle.trim() || title.trim(),
        metaDescription: metaDescription.trim() || shortDescription.trim(),
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const payload = buildPayload();

    try {
      setIsSubmitting(true);

      const { data: createdCourse } = await createCourse({
        ...payload,
        thumbnailUrl: thumbnailBase64 || null,
        thumbnailName: thumbnailFile ? thumbnailFile.name : null,
      });

      // Robust ID extraction
      const newCourseId =
        createdCourse?._id ||
        createdCourse?.id ||
        createdCourse?.courseId ||
        createdCourse?.data?._id ||
        createdCourse?.data?.id ||
        createdCourse?.data?.courseId;

      if (!newCourseId) {
        console.error(
          "No course id found on createCourse response",
          createdCourse
        );
        setSubmitError("Course created, but could not determine its ID.");
        return;
      }

      setSubmitSuccess("Course created successfully.");

      // Go to curriculum builder for this course
      navigate(`/admin/courses/${newCourseId}/curriculum`);
    } catch (err) {
      console.error("Create course error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create course";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/courses");
  };

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* PAGE HEADER */}
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between align-items-center">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title mb-1">
                  Create New Course
                </h3>
                <div className="nk-block-des text-soft">
                  <p className="mb-0">
                    Fill in the course details. After saving, you can add
                    sections and lessons.
                  </p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2 fw-semibold"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    style={{ borderRadius: "10px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-course-form"
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    disabled={isSubmitting}
                    style={{ borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                  >
                    {isSubmitting ? "Saving…" : "Save & Continue"}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {submitError && (
            <div className="alert alert-danger mb-3">{submitError}</div>
          )}

          {submitSuccess && (
            <div className="alert alert-success mb-3">
              {submitSuccess}
            </div>
          )}

          {/* MAIN FORM */}
          <div className="nk-block">
            <form
              id="add-course-form"
              onSubmit={handleSubmit}
              className="row g-gs"
            >
              {/* LEFT COLUMN: MAIN FORM */}
              <div className="col-xl-8">
                {/* Basic Information */}
                <div className="card card-bordered mb-3 shadow-sm rounded-3">
                  <div className="card-inner">
                    <h5 className="card-title mb-3">Basic Information</h5>
                    <div className="row g-3">
                      {/* Title */}
                      <div className="col-12">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Course Title <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.title ? "is-invalid" : ""
                              }`}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Full Stack Development with MERN"
                          />
                          {errors.title && (
                            <div className="invalid-feedback">
                              {errors.title}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subtitle */}
                      <div className="col-12">
                        <div className="form-group mb-2">
                          <label className="form-label">Subtitle</label>
                          <input
                            type="text"
                            className="form-control"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="A short supporting line for the title"
                          />
                        </div>
                      </div>

                      {/* Slug */}
                      <div className="col-md-6">
                        <div className="form-group mb-2">
                          <label className="form-label">Slug</label>
                          <input
                            type="text"
                            className="form-control"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="auto-generated-from-title"
                          />
                          <small className="text-muted">
                            Used in URLs (you can customize if needed).
                          </small>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="col-md-6">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Category <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${errors.category ? "is-invalid" : ""
                              }`}
                            value={category}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              if (e.target.value !== "others") {
                                setCustomCategory("");
                              }
                            }}
                          >
                            <option value="">Select Category</option>
                            {CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {errors.category && (
                            <div className="invalid-feedback">
                              {errors.category}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Custom Category (when Others selected) */}
                      {category === "others" && (
                        <div className="col-12">
                          <div className="form-group mb-2">
                            <label className="form-label">
                              Custom Category Name{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${errors.customCategory ? "is-invalid" : ""
                                }`}
                              value={customCategory}
                              onChange={(e) =>
                                setCustomCategory(e.target.value)
                              }
                              placeholder="e.g. Data Engineering, Cloud, etc."
                            />
                            {errors.customCategory && (
                              <div className="invalid-feedback">
                                {errors.customCategory}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Level */}
                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Level <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${errors.level ? "is-invalid" : ""
                              }`}
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                          >
                            {LEVEL_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {errors.level && (
                            <div className="invalid-feedback">
                              {errors.level}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Language <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${errors.language ? "is-invalid" : ""
                              }`}
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                          >
                            {LANGUAGE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {errors.language && (
                            <div className="invalid-feedback">
                              {errors.language}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Status <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${errors.status ? "is-invalid" : ""
                              }`}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {errors.status && (
                            <div className="invalid-feedback">
                              {errors.status}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Short Description */}
                      <div className="col-12">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Short Description{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <textarea
                            className={`form-control ${errors.shortDescription ? "is-invalid" : ""
                              }`}
                            rows={3}
                            value={shortDescription}
                            onChange={(e) =>
                              setShortDescription(e.target.value)
                            }
                            placeholder="A concise summary of the course"
                          />
                          {errors.shortDescription && (
                            <div className="invalid-feedback">
                              {errors.shortDescription}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Full Description */}
                      <div className="col-12">
                        <div className="form-group mb-1">
                          <label className="form-label">
                            Full Description (optional)
                          </label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={fullDescription}
                            onChange={(e) =>
                              setFullDescription(e.target.value)
                            }
                            placeholder="Detailed overview, structure, outcomes, and who this course is for"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Outcomes & Requirements */}
                <div className="card card-bordered mb-3 shadow-sm rounded-3">
                  <div className="card-inner">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="card-title mb-0">
                        What students will learn
                      </h5>
                    </div>

                    {/* Learning Outcomes */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label mb-0">
                          Learning Outcomes{" "}
                          <span className="text-danger">*</span>
                        </label>
                      </div>
                      {learningOutcomes.map((item, index) => (
                        <div
                          className="d-flex align-items-center mb-2"
                          key={index}
                        >
                          <input
                            type="text"
                            className="form-control"
                            value={item}
                            onChange={(e) =>
                              handleOutcomeChange(index, e.target.value)
                            }
                            placeholder="e.g. Build a full-stack app"
                          />
                          <button
                            type="button"
                            className="btn btn-dim btn-outline-danger btn-icon btn-sm ms-2 d-flex align-items-center justify-content-center"
                            onClick={() => handleRemoveOutcome(index)}
                            disabled={learningOutcomes.length === 1}
                            aria-label="Remove outcome"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                      {errors.learningOutcomes && (
                        <div className="text-danger small mb-1">
                          {errors.learningOutcomes}
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-dim btn-outline-primary btn-sm mt-1"
                        onClick={handleAddOutcome}
                      >
                        + Add Outcome
                      </button>
                    </div>

                    {/* Requirements */}
                    <div className="mt-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label mb-0">
                          Requirements
                        </label>
                      </div>
                      {requirements.map((item, index) => (
                        <div
                          className="d-flex align-items-center mb-2"
                          key={index}
                        >
                          <input
                            type="text"
                            className="form-control"
                            value={item}
                            onChange={(e) =>
                              handleRequirementChange(index, e.target.value)
                            }
                            placeholder="e.g. Basic JavaScript knowledge"
                          />
                          <button
                            type="button"
                            className="btn btn-dim btn-outline-danger btn-icon btn-sm ms-2 d-flex align-items-center justify-content-center"
                            onClick={() => handleRemoveRequirement(index)}
                            disabled={requirements.length === 1}
                            aria-label="Remove requirement"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-dim btn-outline-primary btn-sm mt-1"
                        onClick={handleAddRequirement}
                      >
                        + Add Requirement
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PRICING / THUMBNAIL / META */}
              <div className="col-xl-4">
                {/* Pricing */}
                <div className="card card-bordered mb-3 shadow-sm rounded-3">
                  <div className="card-inner">
                    <h5 className="card-title mb-3">Pricing</h5>

                    {/* Free toggle */}
                    <div className="mb-3">
                      <div className="p-3 rounded-3 bg-light d-flex align-items-center justify-content-between">
                        <span className="fw-medium mb-0">Free course</span>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="isFree"
                            checked={isFree}
                            onChange={(e) => setIsFree(e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {!isFree && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">
                            Price (₹) <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.price ? "is-invalid" : ""
                              }`}
                            value={price}
                            min="0"
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Enter course price"
                          />
                          {errors.price && (
                            <div className="invalid-feedback">
                              {errors.price}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Discount Percentage
                          </label>
                          <div className="input-group">
                            <input
                              type="number"
                              className={`form-control ${errors.discountPercentage ? "is-invalid" : ""
                                }`}
                              value={discountPercentage}
                              min="0"
                              max="100"
                              onChange={(e) =>
                                setDiscountPercentage(e.target.value)
                              }
                              placeholder="e.g. 10"
                            />
                            <span className="input-group-text">%</span>
                          </div>
                          {errors.discountPercentage && (
                            <div className="invalid-feedback d-block">
                              {errors.discountPercentage}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="mb-3">
                      <label className="form-label">
                        Estimated Duration (hours)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={estimatedDurationHours}
                        onChange={(e) =>
                          setEstimatedDurationHours(e.target.value)
                        }
                        min="0"
                        placeholder="e.g. 40"
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label">
                        Planned Lesson Count
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={totalLessonsPlanned}
                        onChange={(e) =>
                          setTotalLessonsPlanned(e.target.value)
                        }
                        min="0"
                        placeholder="e.g. 25"
                      />
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="card card-bordered mb-3 shadow-sm rounded-3">
                  <div className="card-inner">
                    <h5 className="card-title mb-3">Course Thumbnail</h5>
                    <div className="mb-2">
                      <input
                        type="file"
                        accept="image/*"
                        className={`form-control ${errors.thumbnail ? "is-invalid" : ""
                          }`}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setThumbnailFile(file || null);
                        }}
                      />
                      {errors.thumbnail && (
                        <div className="invalid-feedback">
                          {errors.thumbnail}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-light d-flex align-items-center justify-content-center">
                        {thumbnailPreview ? (
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="img-fluid w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="text-center text-muted small d-flex flex-column align-items-center justify-content-center w-100 h-100 px-3">
                            <span className="mb-1 fw-medium">
                              No image selected
                            </span>
                            <span>Upload a thumbnail for this course</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags & SEO */}
                <div className="card card-bordered shadow-sm rounded-3">
                  <div className="card-inner">
                    <h5 className="card-title mb-3">Meta & Tags</h5>

                    <div className="mb-3">
                      <label className="form-label">Tags</label>
                      <input
                        type="text"
                        className="form-control"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="comma,separated,tags"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Meta Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Overrides default page title (optional)"
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label">Meta Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={metaDescription}
                        onChange={(e) =>
                          setMetaDescription(e.target.value)
                        }
                        placeholder="Short description for SEO and social sharing"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* END RIGHT COLUMN */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCoursePage;

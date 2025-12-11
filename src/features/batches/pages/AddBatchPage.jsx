// src/features/batches/pages/AddBatchPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBatch } from "../api/batchesApi";
import { searchCourses, searchEducators } from "../api/lookupApi";

const MODE_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline (QR attendance)" },
  { value: "hybrid", label: "Hybrid" },
];

const DAYS_OF_WEEK = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const AddBatchPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("online");

  const [courseQuery, setCourseQuery] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [educatorQuery, setEducatorQuery] = useState("");
  const [educatorOptions, setEducatorOptions] = useState([]);
  const [selectedEducator, setSelectedEducator] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState(30);

  const [daysOfWeek, setDaysOfWeek] = useState(["Mon", "Wed", "Fri"]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [timeZone] = useState("Asia/Kolkata");

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingEducators, setLoadingEducators] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // load default courses / educators initially
  useEffect(() => {
    const init = async () => {
      try {
        setLoadingCourses(true);
        const { data } = await searchCourses({ page: 1, limit: 20 });
        setCourseOptions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }

      try {
        setLoadingEducators(true);
        const { data } = await searchEducators({ page: 1, limit: 20 });
        setEducatorOptions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEducators(false);
      }
    };
    init();
  }, []);

  const handleCourseSearch = async (value) => {
    setCourseQuery(value);
    try {
      setLoadingCourses(true);
      const { data } = await searchCourses({ q: value, page: 1, limit: 20 });
      setCourseOptions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleEducatorSearch = async (value) => {
    setEducatorQuery(value);
    try {
      setLoadingEducators(true);
      const { data } = await searchEducators({
        q: value,
        page: 1,
        limit: 20,
      });
      setEducatorOptions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEducators(false);
    }
  };

  const toggleDay = (day) => {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(
            (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
          )
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Batch name is required.";
    if (!selectedCourse) newErrors.course = "Select a course.";
    if (!selectedEducator) newErrors.educator = "Select an educator.";
    if (!capacity || Number(capacity) <= 0)
      newErrors.capacity = "Capacity must be greater than zero.";
    if (!daysOfWeek.length)
      newErrors.daysOfWeek = "Select at least one day for schedule.";
    if (!startTime) newErrors.startTime = "Start time is required.";
    if (!endTime) newErrors.endTime = "End time is required.";
    if (!mode) newErrors.mode = "Mode is required.";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const payload = {
      name: name.trim(),
      code: code.trim() || null,
      courseId: selectedCourse?.id || selectedCourse?._id,
      educatorId: selectedEducator?.id || selectedEducator?._id,
      subOrgId: selectedEducator?.subOrgId || null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      capacity: Number(capacity),
      schedule: {
        daysOfWeek,
        startTime,
        endTime,
        timeZone,
      },
      mode,
    };

    try {
      setSubmitting(true);
      const { data: created } = await createBatch(payload);
      const id = created.id || created._id;
      navigate(`/admin/batches/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create batch."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">Create New Batch</h3>
                <div className="nk-block-des text-soft">
                  <p>
                    Link a course with an educator, schedule, and capacity.
                    Attendance is mandatory for all modes.
                  </p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => navigate("/admin/batches")}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-batch-form"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Creating…" : "Create Batch"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="alert alert-danger mb-3 py-2">
              {submitError}
            </div>
          )}

          <div className="nk-block">
            <form
              id="add-batch-form"
              onSubmit={handleSubmit}
              className="row g-gs"
            >
              {/* LEFT COLUMN */}
              <div className="col-xl-8">
                <div className="card card-bordered mb-3">
                  <div className="card-inner">
                    <h5 className="card-title mb-3">Basic Details</h5>
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label">
                          Batch Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.name ? "is-invalid" : ""
                          }`}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Jan 2025 - MERN Evening"
                        />
                        {errors.name && (
                          <div className="invalid-feedback">
                            {errors.name}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Batch Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="e.g., BATCH-JAN25"
                        />
                      </div>
                    </div>

                    <hr className="my-4" />

                    <h6 className="mb-2">Course</h6>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-8">
                        <label className="form-label">
                          Search Course <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.course ? "is-invalid" : ""
                          }`}
                          placeholder="Type course name…"
                          value={courseQuery}
                          onChange={(e) =>
                            handleCourseSearch(e.target.value)
                          }
                        />
                        {errors.course && (
                          <div className="invalid-feedback">
                            {errors.course}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Select Course</label>
                        <select
                          className="form-select"
                          value={
                            selectedCourse ? selectedCourse.id || selectedCourse._id : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            const found = courseOptions.find(
                              (c) => (c.id || c._id) === value
                            );
                            setSelectedCourse(found || null);
                          }}
                        >
                          <option value="">
                            {loadingCourses ? "Loading…" : "Choose course"}
                          </option>
                          {courseOptions.map((c) => {
                            const id = c.id || c._id;
                            return (
                              <option key={id} value={id}>
                                {c.title || c.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {selectedCourse && (
                      <div className="alert alert-light mt-3 py-2 small">
                        <strong>Selected Course:</strong>{" "}
                        {selectedCourse.title || selectedCourse.name}{" "}
                        <span className="text-soft">
                          ({selectedCourse.category || "Category not set"})
                        </span>
                      </div>
                    )}

                    <hr className="my-4" />

                    <h6 className="mb-2">Educator</h6>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-8">
                        <label className="form-label">
                          Search Educator{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.educator ? "is-invalid" : ""
                          }`}
                          placeholder="Type educator name or email…"
                          value={educatorQuery}
                          onChange={(e) =>
                            handleEducatorSearch(e.target.value)
                          }
                        />
                        {errors.educator && (
                          <div className="invalid-feedback">
                            {errors.educator}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Select Educator</label>
                        <select
                          className="form-select"
                          value={
                            selectedEducator
                              ? selectedEducator.id || selectedEducator._id
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            const found = educatorOptions.find(
                              (u) => (u.id || u._id) === value
                            );
                            setSelectedEducator(found || null);
                          }}
                        >
                          <option value="">
                            {loadingEducators ? "Loading…" : "Choose educator"}
                          </option>
                          {educatorOptions.map((u) => {
                            const id = u.id || u._id;
                            return (
                              <option key={id} value={id}>
                                {u.name || u.fullName || u.email}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {selectedEducator && (
                      <div className="alert alert-light mt-3 py-2 small">
                        <strong>Selected Educator:</strong>{" "}
                        {selectedEducator.name ||
                          selectedEducator.fullName ||
                          selectedEducator.email}
                        {selectedEducator.subOrgName && (
                          <span className="text-soft">
                            {" "}
                            · {selectedEducator.subOrgName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="col-xl-4">
                <div className="card card-bordered mb-3">
                  <div className="card-inner">
                    <h6 className="card-title mb-3">Schedule</h6>

                    <div className="mb-2">
                      <label className="form-label">
                        Mode <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${
                          errors.mode ? "is-invalid" : ""
                        }`}
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                      >
                        {MODE_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      {errors.mode && (
                        <div className="invalid-feedback">
                          {errors.mode}
                        </div>
                      )}
                      <small className="text-soft d-block mt-1">
                        Online: reference course content. Offline: QR-based
                        attendance. Hybrid: both.
                      </small>
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label">
                        Capacity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${
                          errors.capacity ? "is-invalid" : ""
                        }`}
                        value={capacity}
                        min="1"
                        onChange={(e) => setCapacity(e.target.value)}
                      />
                      {errors.capacity && (
                        <div className="invalid-feedback">
                          {errors.capacity}
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <label className="form-label">
                        Days of Week{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex flex-wrap gap-1">
                        {DAYS_OF_WEEK.map((d) => {
                          const active = daysOfWeek.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              className={`btn btn-xs ${
                                active
                                  ? "btn-primary"
                                  : "btn-outline-light border"
                              }`}
                              onClick={() => toggleDay(d)}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                      {errors.daysOfWeek && (
                        <div className="text-danger small mt-1">
                          {errors.daysOfWeek}
                        </div>
                      )}
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label">
                          Start Time{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className={`form-control ${
                            errors.startTime ? "is-invalid" : ""
                          }`}
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                        {errors.startTime && (
                          <div className="invalid-feedback">
                            {errors.startTime}
                          </div>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="form-label">
                          End Time{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className={`form-control ${
                            errors.endTime ? "is-invalid" : ""
                          }`}
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                        {errors.endTime && (
                          <div className="invalid-feedback">
                            {errors.endTime}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-0">
                      <label className="form-label">Time Zone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={timeZone}
                        disabled
                      />
                      <small className="text-soft">
                        Fixed to Asia/Kolkata for this org.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="card card-bordered">
                  <div className="card-inner">
                    <h6 className="card-title mb-2">Attendance Info</h6>
                    <p className="small text-soft mb-0">
                      Attendance is mandatory for all batches:
                      <br />
                      <strong>Online:</strong> Will be tracked automatically
                      from video session / course progress (educator & learner
                      module APIs).
                      <br />
                      <strong>Offline:</strong> Learners will scan a QR code in
                      class to mark presence.
                      <br />
                      <strong>Hybrid:</strong> Combination of both modes.
                    </p>
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

export default AddBatchPage;

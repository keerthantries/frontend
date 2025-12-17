// src/features/batches/pages/AddBatchPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Layers3,
  Save,
  X,
  Search,
  BookOpen,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { createBatch, fetchBatchById, updateBatch } from "../api/batchesApi";
import { searchCourses, searchEducators } from "../api/lookupApi";
import { fetchSubOrgs } from "../../subOrgManagement/api/suborgApi";

const DEFAULT_TIME_ZONE = "Asia/Kolkata";
const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const AddBatchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Get the Batch ID from the URL
  const isEditMode = Boolean(id); // Check if we are editing

  // current user / role
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isSubOrgAdmin = currentUser?.role === "subOrgAdmin";
  const currentSubOrgId = currentUser?.subOrgId || "";

  // preselected (only used when Creating new)
  const preselectedCourseId = location.state?.courseId || "";
  const preselectedCourseTitle = location.state?.courseTitle || "";
  const preferredMode = location.state?.preferredMode || "online";

  // form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [courseId, setCourseId] = useState(preselectedCourseId || "");
  const [courseTitle, setCourseTitle] = useState(preselectedCourseTitle || "");
  const [educatorId, setEducatorId] = useState("");
  const [subOrgId, setSubOrgId] = useState(
    isSubOrgAdmin && currentSubOrgId ? currentSubOrgId : ""
  );
  const [mode, setMode] = useState(preferredMode || "online");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState(30);
  const [status, setStatus] = useState("draft");

  const [daysOfWeek, setDaysOfWeek] = useState(["Mon", "Wed", "Fri"]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);

  // lookups & loading
  const [courseSearch, setCourseSearch] = useState(preselectedCourseTitle || "");
  const [courseOptions, setCourseOptions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [educatorSearch, setEducatorSearch] = useState("");
  const [educatorOptions, setEducatorOptions] = useState([]);
  const [loadingEducators, setLoadingEducators] = useState(false);

  const [subOrgs, setSubOrgs] = useState([]);
  const [loadingSubOrgs, setLoadingSubOrgs] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false); // To block UI while fetching edit data
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Load sub-orgs if admin
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      setLoadingSubOrgs(true);
      try {
        const res = await fetchSubOrgs();
        const list = res?.data?.data || res?.data || [];
        if (!mounted) return;
        setSubOrgs(list);
      } catch (err) {
        console.error("Failed to load sub-orgs:", err);
      } finally {
        if (mounted) setLoadingSubOrgs(false);
      }
    })();
    return () => (mounted = false);
  }, [isAdmin]);

  // 2. Load Batch Data if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;
    let mounted = true;

    const loadBatch = async () => {
      setLoadingData(true);
      try {
        // fetchBatchById calls /api/admin/batches/:id
        const data = await fetchBatchById(id);
        
        if (!mounted) return;

        // Populate Basic Fields
        setName(data.name || "");
        setCode(data.code || "");
        setMode(data.mode || "online");
        setStatus(data.status || "draft");
        setCapacity(data.capacity !== undefined ? data.capacity : 30);
        setSubOrgId(data.subOrgId || "");

        // Populate Schedule
        if (data.schedule) {
          setDaysOfWeek(data.schedule.daysOfWeek || []);
          setStartTime(data.schedule.startTime || "");
          setEndTime(data.schedule.endTime || "");
          setTimeZone(data.schedule.timeZone || DEFAULT_TIME_ZONE);
        }

        // Populate Dates (Format YYYY-MM-DD)
        if (data.startDate) setStartDate(new Date(data.startDate).toISOString().split('T')[0]);
        if (data.endDate) setEndDate(new Date(data.endDate).toISOString().split('T')[0]);

        // Populate Course
        if (data.courseId) {
          setCourseId(data.courseId);
          // Try to get title from populated object, flat field, or fallback
          const title = data.course?.title || data.courseName || data.course?.name || ""; 
          setCourseTitle(title);
          setCourseSearch(title);
          // Synthesize an option so the select dropdown works even if we haven't searched yet
          if (title) {
            setCourseOptions([{ id: data.courseId, title }]);
          }
        }

        // Populate Educator
        if (data.educatorId) {
          setEducatorId(data.educatorId);
          const eduName = data.educator?.name || data.educatorName || data.educator?.fullName || "";
          setEducatorSearch(eduName);
          if (eduName) {
            setEducatorOptions([{ id: data.educatorId, name: eduName }]);
          }
        }

      } catch (err) {
        console.error("Failed to load batch details", err);
        setError("Failed to load batch details. Please try again.");
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    loadBatch();
    return () => (mounted = false);
  }, [id, isEditMode]);


  // --- Event Handlers ---

  // Search courses
  const handleSearchCourses = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setLoadingCourses(true);
    try {
      const res = await searchCourses({ q: courseSearch || undefined, page: 1, limit: 30 });
      const items = (res?.data?.data) || (res?.data) || (res?.items) || res || [];
      setCourseOptions(Array.isArray(items) ? items : []);
      if ((!courseId || !courseTitle) && items && items.length === 1) {
        const one = items[0];
        setCourseId(one.id || one._id || "");
        setCourseTitle(one.title || one.name || "");
      }
    } catch (err) {
      console.error("searchCourses error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to search courses.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSelectCourse = (e) => {
    const selected = e.target.value;
    setCourseId(selected);
    const found = courseOptions.find((c) => (c.id || c._id) === selected);
    setCourseTitle(found?.title || found?.name || "");
  };

  // Search educators
  const handleSearchEducators = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setLoadingEducators(true);
    try {
      const res = await searchEducators({ q: educatorSearch || undefined, page: 1, limit: 30 });
      const items = (res?.data?.data) || (res?.data) || (res?.items) || res || [];
      setEducatorOptions(Array.isArray(items) ? items : []);
      if (!educatorId && items && items.length === 1) {
        const one = items[0];
        setEducatorId(one.id || one._id || "");
      }
    } catch (err) {
      console.error("searchEducators error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to search educators.");
    } finally {
      setLoadingEducators(false);
    }
  };

  const handleSelectEducator = (e) => {
    setEducatorId(e.target.value);
  };

  // toggle day
  const toggleDay = (day) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // submit
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Batch name is required.");
    if (!courseId) return setError("Please select a course for this batch.");
    if (!mode) return setError("Please select delivery mode.");
    if (!daysOfWeek.length) return setError("Select at least one day of the week.");
    if (!startTime || !endTime) return setError("Please set both start and end times.");

    setSaving(true);
    try {
      const numericCapacity = parseInt(capacity, 10);
      const finalCapacity = Number.isNaN(numericCapacity) ? 0 : numericCapacity;

      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        courseId,
        educatorId: educatorId || undefined,
        subOrgId: isAdmin && subOrgId ? subOrgId : isSubOrgAdmin ? currentSubOrgId : undefined,
        mode,
        startDate: startDate || null,
        endDate: endDate || null,
        capacity: finalCapacity,
        status,
        schedule: {
          daysOfWeek,
          startTime,
          endTime,
          timeZone: timeZone || DEFAULT_TIME_ZONE,
        },
      };

      if (isEditMode) {
        // UPDATE existing
        await updateBatch(id, payload);
        setSuccess("Batch updated successfully.");
      } else {
        // CREATE new
        await createBatch(payload);
        setSuccess("Batch created successfully.");
      }
      
      setTimeout(() => navigate("/admin/batches"), 700);
    } catch (err) {
      console.error("Batch save error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to save batch.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Layout tweaks ----------
  const cardInnerStyle = { padding: "1.6rem 1.8rem" };
  const rightCardInnerStyle = { padding: "1.4rem 1.6rem" };
  const headerBtnStyle = { minWidth: 120, padding: "10px 18px" };
  const searchInputStyle = { minWidth: 240 };
  const searchBtnStyle = { minWidth: 110 };
  const smallIconInputStyle = { minWidth: 150 };

  // Show loading spinner if fetching data
  if (loadingData) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading batch details...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          {/* Header */}
          <div className="nk-block-head nk-block-head-sm mb-3">
            <div className="nk-block-between align-items-center">
              <div className="nk-block-head-content">
                <h3 className="page-title mb-1">
                  <Layers3 className="me-1" size={20} />
                  {isEditMode ? "Edit Batch" : "Create Batch"}
                </h3>
                <div className="nk-block-des text-soft">
                  <p className="mb-0">
                    {isEditMode 
                     ? "Update batch schedule, educator, or course details."
                     : "Link a course, schedule and (optionally) an educator."}
                  </p>
                </div>
              </div>

              <div className="nk-block-head-content">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/admin/batches")}
                    disabled={saving}
                    style={{ ...headerBtnStyle, borderRadius: 8 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={saving}
                    style={{ ...headerBtnStyle, borderRadius: 8 }}
                  >
                    {saving ? "Saving…" : (isEditMode ? "Update Batch" : "Create Batch")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          {success && <div className="alert alert-success mb-3">{success}</div>}

          {/* Form */}
          <div className="nk-block">
            <form id="add-batch-form" onSubmit={handleSubmit}>
              <div className="row gx-4 gy-4">
                {/* LEFT */}
                <div className="col-xl-8">
                  <div className="card card-bordered mb-3">
                    <div className="card-inner" style={cardInnerStyle}>
                      <h5 className="card-title mb-3">Basic Details</h5>

                      <div className="row g-3 mb-3">
                        <div className="col-md-8">
                          <label className="form-label">Batch Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Jan 2025 - MERN Evening"
                            disabled={saving}
                            required
                          />
                          <div className="form-note">Shown to learners and educators.</div>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Batch Code</label>
                          <input
                            type="text"
                            className="form-control"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g., BATCH-JAN25"
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <hr />

                      <h6 className="mb-3">Course</h6>

                      <div className="row g-3 align-items-end mb-3">
                        <div className="col-md-8">
                          <label className="form-label">Search Course <span className="text-danger">*</span></label>

                          <div className="d-flex align-items-center" style={{ gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="form-control-wrap">
                                <div className="form-icon form-icon-left">
                                  <BookOpen size={14} />
                                </div>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Type course name…"
                                  value={courseSearch}
                                  onChange={(e) => setCourseSearch(e.target.value)}
                                  disabled={saving}
                                  style={searchInputStyle}
                                />
                              </div>
                            </div>

                            <div style={{ width: searchBtnStyle.minWidth }}>
                              <button
                                type="button"
                                className="btn btn-outline-primary w-100"
                                onClick={handleSearchCourses}
                                disabled={saving || loadingCourses}
                                style={{ height: 40 }}
                              >
                                {loadingCourses ? "Searching..." : <><Search size={14} className="me-1" /> Search</>}
                              </button>
                            </div>
                          </div>

                          <div style={{ marginTop: 10 }}>
                            <select
                              className="form-select"
                              value={courseId}
                              onChange={handleSelectCourse}
                              disabled={saving || (!courseOptions.length && !courseId)} 
                              style={{ width: "100%" }}
                            >
                              <option value="">{courseOptions.length ? "Select a course" : (courseId ? "Current Selection" : "Search above to list courses")}</option>
                              {courseOptions.map((c) => (
                                <option key={c.id || c._id} value={c.id || c._id}>
                                  {c.title || c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {courseTitle && (
                            <div className="alert alert-light mt-3 py-2 small">
                              <strong>Selected Course:</strong> {courseTitle}
                            </div>
                          )}
                        </div>

                        {/* Educator */}
                        <div className="col-md-4">
                          <label className="form-label">Educator (optional)</label>

                          <div className="d-flex align-items-center" style={{ gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div className="form-control-wrap">
                                <div className="form-icon form-icon-left">
                                  <User size={14} />
                                </div>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Type educator name…"
                                  value={educatorSearch}
                                  onChange={(e) => setEducatorSearch(e.target.value)}
                                  disabled={saving}
                                  style={smallIconInputStyle}
                                />
                              </div>
                            </div>

                            <div style={{ width: 44 }}>
                              <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={handleSearchEducators}
                                disabled={saving || loadingEducators}
                                title="Search"
                                style={{ height: 40 }}
                              >
                                {loadingEducators ? <span className="spinner-border spinner-border-sm" /> : <Search size={14} />}
                              </button>
                            </div>
                          </div>

                          <div style={{ marginTop: 10 }}>
                            <select
                              className="form-select"
                              value={educatorId}
                              onChange={handleSelectEducator}
                              disabled={saving || (!educatorOptions.length && !educatorId)}
                              style={{ width: "100%" }}
                            >
                              <option value="">{educatorOptions.length ? "Select educator (or leave empty)" : (educatorId ? "Current Selection" : "Search above to list")}</option>
                              {educatorOptions.map((u) => (
                                <option key={u.id || u._id} value={u.id || u._id}>
                                  {u.name || u.fullName || u.email}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-note mt-2">If left empty, a verified educator will be auto-assigned.</div>
                        </div>
                      </div>

                      <hr />

                      <h6 className="mb-3">Schedule</h6>

                      <div className="row g-3 mb-3 align-items-center">
                        <div className="col-md-6">
                          <label className="form-label">Days of Week <span className="text-danger">*</span></label>
                          <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                            {ALL_DAYS.map((d) => (
                              <button
                                key={d}
                                type="button"
                                className={`btn btn-xs ${daysOfWeek.includes(d) ? "btn-primary" : "btn-outline-light border"}`}
                                onClick={() => toggleDay(d)}
                                disabled={saving}
                                style={{ minWidth: 54, padding: "6px 10px" }}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                          <div className="form-note mt-2 small">These days will be used to generate attendance sessions later.</div>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Start Time *</label>
                          <div className="form-control-wrap">
                            <div className="form-icon form-icon-left"><Clock size={14} /></div>
                            <input type="time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} required disabled={saving} />
                          </div>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">End Time *</label>
                          <div className="form-control-wrap">
                            <div className="form-icon form-icon-left"><Clock size={14} /></div>
                            <input type="time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} required disabled={saving} />
                          </div>
                        </div>

                        <div className="col-md-4 mt-2">
                          <label className="form-label">Time Zone</label>
                          <input type="text" className="form-control" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} disabled={saving} />
                          <div className="form-note small mt-1">Default: Asia/Kolkata.</div>
                        </div>
                      </div>

                      <hr />

                      <h6 className="mb-3">Duration & Capacity</h6>

                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">Start Date</label>
                          <div className="form-control-wrap">
                            <div className="form-icon form-icon-left"><Calendar size={14} /></div>
                            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label">End Date</label>
                          <div className="form-control-wrap">
                            <div className="form-icon form-icon-left"><Calendar size={14} /></div>
                            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={saving} />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label">Capacity (0 = unlimited)</label>
                          <input type="number" className="form-control" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={saving} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="col-xl-4">
                  <div className="card card-bordered mb-3">
                    <div className="card-inner" style={rightCardInnerStyle}>
                      <h6 className="card-title mb-3">Configuration</h6>

                      <div className="form-group mb-3">
                        <label className="form-label">Mode *</label>
                        <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)} disabled={saving} required>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                        <div className="form-note small mt-1">Online links to live classes; offline uses QR-based attendance.</div>
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={saving}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="form-note small mt-1">You can change status later.</div>
                      </div>

                      {isAdmin ? (
                        <div className="form-group mb-3">
                          <label className="form-label">Sub-Organization</label>
                          <select className="form-select" value={subOrgId} onChange={(e) => setSubOrgId(e.target.value)} disabled={saving || loadingSubOrgs}>
                            <option value="">Main Organization</option>
                            {subOrgs.map((so) => (
                              <option key={so.id || so._id} value={so.id || so._id}>{so.name}</option>
                            ))}
                          </select>
                          <div className="form-note small mt-1">If skipped, the batch is created at the main org level.</div>
                        </div>
                      ) : isSubOrgAdmin ? (
                        <div className="form-group mb-3">
                          <label className="form-label">Sub-Organization</label>
                          <input type="text" className="form-control" value="Your assigned sub-organization" disabled />
                          <div className="form-note small mt-1">Batch will be created inside your assigned sub-org.</div>
                        </div>
                      ) : null}

                      <div className="form-group">
                        <div className="alert alert-soft info small mb-0">
                          <p className="mb-1">{isEditMode ? "Changes are effective immediately." : "Once batches are created, you'll be able to:"}</p>
                          <ul className="mb-0 ps-3">
                            <li>Enroll learners (manual / bulk)</li>
                            <li>Generate attendance sessions</li>
                            <li>Track completion & certificates</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* footer actions */}
                  <div className="card card-bordered">
                    <div className="card-inner" style={{ padding: "0.9rem 1.1rem" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-soft small">
                           {isEditMode ? "Ensure time conflicts are resolved manually." : "This batch will respect automation rules."}
                        </div>
                        <div>
                          <button type="button" className="btn btn-outline-secondary me-2" onClick={() => navigate("/admin/batches")} disabled={saving}>
                            <X className="me-1" size={14} /> Cancel
                          </button>
                          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : <><Save size={14} className="me-1" />{isEditMode ? "Update" : "Create"}</>}
                          </button>
                        </div>
                      </div>
                    </div>
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

export default AddBatchPage;
// src/features/Courses/api/coursesApi.js
import httpClient from "../../../services/httpClient";

/**
 * Small helpers to unwrap typical response envelopes
 */
function unwrap(res) {
  if (!res) return null;
  // axios response shape -> res.data
  const body = res.data ?? res;
  // some APIs use nested .data
  if (body && body.data) return body.data;
  return body;
}

/**
 * Normalise created/returned object to ensure callers can rely on .id when possible
 */
function normalizeObj(obj) {
  if (!obj || typeof obj !== "object") return obj || null;
  if (obj.data && typeof obj.data === "object") obj = obj.data;
  if (obj.course && typeof obj.course === "object") obj = obj.course;
  if (obj.item && typeof obj.item === "object") obj = obj.item;

  // Clone to avoid mutation side-effects
  const out = { ...obj };

  if (!out.id && out._id) {
    out.id = String(out._id);
  }
  return out;
}

/**
 * Deep Normalizer for Sections + Lessons
 * Required so the UI doesn't crash when accessing lesson.id
 */
function normalizeSection(section) {
  if (!section) return null;
  
  // 1. Normalize the section itself
  const normSection = normalizeObj(section);

  // 2. Normalize nested lessons if they exist
  if (Array.isArray(normSection.lessons)) {
    normSection.lessons = normSection.lessons.map(normalizeObj);
  }

  return normSection;
}

/* ================== COURSES LIST ================== */
// GET /api/courses?...
export async function fetchCourses({
  status,
  category,
  level,
  tag,
  q,
  page = 1,
  limit = 20,
} = {}) {
  const params = { page, limit };

  if (status && status !== "all") params.status = status;
  if (category && category !== "all") params.category = category;
  if (level && level !== "all") params.level = level;
  if (tag && tag !== "all") params.tag = tag;
  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/courses", { params });
  const data = unwrap(res);

  // common envelope shapes
  if (data?.items) {
    return {
      items: (data.items || []).map(normalizeObj),
      pagination: data.pagination || data.meta || {},
    };
  }

  // if it's already list
  if (Array.isArray(data)) {
    return { items: data.map(normalizeObj), pagination: { total: data.length } };
  }

  // fallback
  return data ?? { items: [], pagination: {} };
}

// alias
export const listCourses = fetchCourses;

/* ================== SINGLE COURSE CRUD ================== */

// GET /api/courses/:courseId
export async function fetchCourseById(courseId) {
  const res = await httpClient.get(`/api/courses/${courseId}`);
  const raw = unwrap(res);
  return normalizeObj(raw);
}
export const getCourseById = fetchCourseById;

// POST /api/courses
export async function createCourse(payload) {
  const res = await httpClient.post("/api/courses", payload);
  const raw = unwrap(res);
  const created = normalizeObj(raw);
  return { data: created };
}

// PATCH /api/courses/:courseId
export async function updateCourse(courseId, payload) {
  const res = await httpClient.patch(`/api/courses/${courseId}`, payload);
  const raw = unwrap(res);
  return { data: normalizeObj(raw) };
}

// DELETE /api/courses/:courseId
export async function deleteCourse(courseId) {
  const res = await httpClient.delete(`/api/courses/${courseId}`);
  const raw = unwrap(res);
  return { data: raw };
}

/* ================== CURRICULUM ================== */

// GET /api/courses/:courseId/curriculum
export async function fetchCurriculum(courseId) {
  const res = await httpClient.get(`/api/courses/${courseId}/curriculum`);
  const raw = unwrap(res);

  // common shapes
  let sections = [];
  if (raw && raw.sections) sections = raw.sections;
  else if (Array.isArray(raw)) sections = raw;
  else if (raw?.data?.sections) sections = raw.data.sections;

  // IMPORTANT: Deep normalize so both Sections and Lessons have .id
  return { sections: sections.map(normalizeSection) };
}
export const getCourseCurriculum = fetchCurriculum;

/* CREATE SECTION */
export async function createSection(courseId, payload) {
  const body =
    typeof payload === "string" ? { title: payload } : (payload || {});
  const res = await httpClient.post(
    `/api/courses/${courseId}/sections`,
    body
  );
  const raw = unwrap(res);
  const section = raw?.data ?? raw;
  return { data: normalizeSection(section) };
}

/**
 * updateSection(...) supports two signatures:
 * - updateSection(sectionId, payload)
 * - updateSection(courseId, sectionId, payload)
 */
export async function updateSection(...args) {
  // 1. Called with (sectionId, payload)
  if (args.length === 2) {
    const [sectionId, payload] = args;
    // FIX: Use course-scoped path which we know works
    const res = await httpClient.patch(`/api/courses/sections/${sectionId}`, payload);
    const raw = unwrap(res);
    return { data: normalizeSection(raw?.data ?? raw) };
  }

  // 2. Called with (courseId, sectionId, payload)
  if (args.length === 3) {
    const [courseId, sectionId, payload] = args;
    const res = await httpClient.patch(
      `/api/courses/${courseId}/sections/${sectionId}`,
      payload
    );
    const raw = unwrap(res);
    return { data: normalizeSection(raw?.data ?? raw) };
  }

  throw new Error("Invalid arguments to updateSection");
}

/**
 * deleteSection supports:
 * - deleteSection(sectionId)
 * - deleteSection(courseId, sectionId)
 */
export async function deleteSection(...args) {
  // 1. Called with (sectionId)
  if (args.length === 1) {
    const [sectionId] = args;
    // FIX: Use course-scoped path
    const res = await httpClient.delete(`/api/courses/sections/${sectionId}`);
    const raw = unwrap(res);
    return { data: raw };
  }

  // 2. Called with (courseId, sectionId)
  if (args.length === 2) {
    const [courseId, sectionId] = args;
    const res = await httpClient.delete(
      `/api/courses/${courseId}/sections/${sectionId}`
    );
    const raw = unwrap(res);
    return { data: raw };
  }

  throw new Error("Invalid arguments to deleteSection");
}

/* LESSONS */
export async function createLesson(courseId, sectionId, payload) {
  const res = await httpClient.post(
    `/api/courses/${courseId}/sections/${sectionId}/lessons`,
    payload
  );
  const raw = unwrap(res);
  const lesson = raw?.data ?? raw;
  return { data: normalizeObj(lesson) };
}

/**
 * updateLesson supports:
 * - updateLesson(lessonId, payload)
 * - updateLesson(courseId, lessonId, payload)
 */
export async function updateLesson(...args) {
  // 1. Called with (lessonId, payload)
  if (args.length === 2) {
    const [lessonId, payload] = args;
    // FIX: Use course-scoped path /api/courses/lessons/:id
    const res = await httpClient.patch(`/api/courses/lessons/${lessonId}`, payload);
    const raw = unwrap(res);
    return { data: normalizeObj(raw?.data ?? raw) };
  }

  // 2. Called with (courseId, lessonId, payload)
  if (args.length === 3) {
    const [courseId, lessonId, payload] = args;
    const res = await httpClient.patch(
      `/api/courses/${courseId}/lessons/${lessonId}`,
      payload
    );
    const raw = unwrap(res);
    return { data: normalizeObj(raw?.data ?? raw) };
  }

  throw new Error("Invalid arguments to updateLesson");
}

/**
 * deleteLesson supports:
 * - deleteLesson(lessonId)
 * - deleteLesson(courseId, lessonId)
 */
export async function deleteLesson(...args) {
  // 1. Called with (lessonId)
  if (args.length === 1) {
    const [lessonId] = args;
    // FIX: Use course-scoped path
    const res = await httpClient.delete(`/api/courses/lessons/${lessonId}`);
    const raw = unwrap(res);
    return { data: raw };
  }

  // 2. Called with (courseId, lessonId)
  if (args.length === 2) {
    const [courseId, lessonId] = args;
    const res = await httpClient.delete(
      `/api/courses/${courseId}/lessons/${lessonId}`
    );
    const raw = unwrap(res);
    return { data: raw };
  }

  throw new Error("Invalid arguments to deleteLesson");
}

/* ================== LESSON MATERIAL ================== */

// upload with courseId (explicit path)
export async function uploadLessonMaterial(courseId, lessonId, file) {
  const form = new FormData();
  form.append("file", file);

  const res = await httpClient.post(
    `/api/courses/${courseId}/lessons/${lessonId}/material`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  const raw = unwrap(res);
  const lesson = raw?.data ?? raw;
  return { data: normalizeObj(lesson) };
}

// updateLessonMaterial(lessonId, file)
export async function updateLessonMaterial(lessonId, file) {
  const form = new FormData();
  form.append("file", file);

  // Use the course-scoped path which we know is reliable
  try {
    const res = await httpClient.post(
      `/api/courses/lessons/${lessonId}/material`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    const raw = unwrap(res);
    const lesson = raw?.data ?? raw;
    return { data: normalizeObj(lesson) };
  } catch (err) {
    throw err;
  }
}

/* ================== EXPORT DEFAULT SERVICE OBJECT ================== */

const courseService = {
  fetchCourses,
  listCourses,

  fetchCourseById,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,

  fetchCurriculum,
  getCourseCurriculum,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,

  uploadLessonMaterial,
  updateLessonMaterial,
};

export default courseService;
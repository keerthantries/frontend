// src/features/Courses/api/coursesApi.js
import httpClient from "./../../../services/httpClient";

/**
 * Helpers to normalise backend responses
 */
function unwrapSingle(res) {
  const body = res?.data;
  return body?.data ?? body ?? null;
}

function unwrapList(res, fallback = {}) {
  const body = res?.data;

  if (body?.data?.items) {
    return {
      items: body.data.items,
      total: body.data.total ?? body.data.items.length,
      page: body.data.page ?? fallback.page,
      limit: body.data.limit ?? fallback.limit,
    };
  }

  if (Array.isArray(body)) {
    return {
      items: body,
      total: body.length,
      page: fallback.page,
      limit: fallback.limit,
    };
  }

  if (body?.items) {
    return {
      items: body.items,
      total: body.total ?? body.items.length,
      page: body.page ?? fallback.page,
      limit: body.limit ?? fallback.limit,
    };
  }

  throw new Error("Unexpected courses API response shape.");
}

/* ========== NORMALISERS (id vs _id, etc.) ========== */

function normaliseCourse(course) {
  if (!course) return course;
  return {
    ...course,
    id: course.id || course._id,
  };
}

function normaliseLesson(lesson, courseId, sectionId) {
  if (!lesson) return lesson;
  const id = lesson.id || lesson._id;

  return {
    ...lesson,
    id,
    courseId: lesson.courseId || courseId || undefined,
    sectionId: lesson.sectionId || sectionId || undefined,
  };
}

function normaliseSection(section, courseId) {
  if (!section) return section;
  const id = section.id || section._id;

  const lessons = (section.lessons || []).map((l) =>
    normaliseLesson(l, courseId || section.courseId, id)
  );

  return {
    ...section,
    id,
    courseId: section.courseId || courseId || undefined,
    lessons,
  };
}

/* ========== COURSES ========== */

/**
 * Create a new course
 * POST /api/courses
 */
export async function createCourse(payload) {
  const res = await httpClient.post("/api/courses", payload);
  const raw = unwrapSingle(res);
  const course = normaliseCourse(raw);
  return { data: course };
}

/**
 * List / filter / paginate courses
 * GET /api/courses?status=All&page=1&limit=10
 */
export async function fetchCourses({
  page = 1,
  limit = 10,
  status = "All",
} = {}) {
  const params = { page, limit };
  if (status && status !== "All") {
    params.status = status;
  }

  const res = await httpClient.get("/api/courses", { params });
  const list = unwrapList(res, { page, limit });

  // Normalise each course so it definitely has `id`
  const items = (list.items || []).map(normaliseCourse);

  // Keep the same shape the old fake API returned
  return {
    data: {
      items,
      total: list.total,
      page: list.page,
      limit: list.limit,
    },
  };
}

/**
 * GET /api/courses/:courseId
 */
export async function getCourseById(courseId) {
  const res = await httpClient.get(`/api/courses/${courseId}`);
  const raw = unwrapSingle(res);
  const course = normaliseCourse(raw);
  return { data: course };
}

/**
 * PATCH /api/courses/:courseId
 */
export async function updateCourse(courseId, updates) {
  const res = await httpClient.patch(`/api/courses/${courseId}`, updates);
  const raw = unwrapSingle(res);
  const course = normaliseCourse(raw);
  return { data: course };
}

/**
 * DELETE /api/courses/:courseId
 */
export async function deleteCourse(courseId) {
  const res = await httpClient.delete(`/api/courses/${courseId}`);
  const body = res?.data ?? {};
  return { success: body.success ?? true };
}

/* ========== CURRICULUM ========== */

/**
 * GET /api/courses/:courseId/curriculum
 * expects backend to return sections + lessons tree
 */
export async function fetchCurriculum(courseId) {
  const res = await httpClient.get(`/api/courses/${courseId}/curriculum`);
  const body = res?.data;

  const rawSections =
    body?.data?.sections ??
    body?.sections ??
    (Array.isArray(body) ? body : []);

  const sections = (rawSections || []).map((sec) =>
    normaliseSection(sec, courseId)
  );

  return { data: { sections } };
}

/* ========== SECTIONS ========== */

/**
 * Sections
 * POST /api/courses/:courseId/sections
 * PATCH /api/courses/sections/:sectionId
 * DELETE /api/courses/sections/:sectionId
 */

export async function createSection(courseId, title) {
  const res = await httpClient.post(`/api/courses/${courseId}/sections`, {
    title,
  });
  const raw = unwrapSingle(res);
  const section = normaliseSection(raw, courseId);
  return { data: section };
}

export async function updateSection(sectionId, updates) {
  const res = await httpClient.patch(
    `/api/courses/sections/${sectionId}`,
    updates
  );
  const raw = unwrapSingle(res);
  const section = normaliseSection(raw, raw?.courseId);
  return { data: section };
}

export async function deleteSection(sectionId) {
  const res = await httpClient.delete(`/api/courses/sections/${sectionId}`);
  const body = res?.data ?? {};
  return { success: body.success ?? true };
}

/* ========== LESSONS ========== */

/**
 * Lessons
 * POST   /api/courses/:courseId/sections/:sectionId/lessons
 * PATCH  /api/courses/lessons/:lessonId
 * DELETE /api/courses/lessons/:lessonId
 */

export async function createLesson(courseId, sectionId, payload) {
  const res = await httpClient.post(
    `/api/courses/${courseId}/sections/${sectionId}/lessons`,
    payload
  );
  const raw = unwrapSingle(res);
  const lesson = normaliseLesson(raw, courseId, sectionId);
  return { data: lesson };
}

export async function updateLesson(lessonId, updates) {
  const res = await httpClient.patch(
    `/api/courses/lessons/${lessonId}`,
    updates
  );
  const raw = unwrapSingle(res);
  const lesson = normaliseLesson(raw, raw?.courseId, raw?.sectionId);
  return { data: lesson };
}

export async function deleteLesson(lessonId) {
  const res = await httpClient.delete(`/api/courses/lessons/${lessonId}`);
  const body = res?.data ?? {};
  return { success: body.success ?? true };
}

/**
 * Upload / update lesson material
 *  - If you pass a File → POST /api/courses/lessons/:lessonId/material (multipart)
 *  - If you pass a string → PATCH /api/courses/lessons/:lessonId with { resourceUrl }
 */
export async function updateLessonMaterial(lessonId, fileOrUrl) {
  // File upload
  if (typeof File !== "undefined" && fileOrUrl instanceof File) {
    const formData = new FormData();
    formData.append("file", fileOrUrl);

    const res = await httpClient.post(
      `/api/courses/lessons/${lessonId}/material`,
      formData
      // axios will set multipart headers
    );
    const raw = unwrapSingle(res);
    const lesson = normaliseLesson(raw, raw?.courseId, raw?.sectionId);
    return { data: lesson };
  }

  // Fallback: just update resourceUrl directly
  const res = await httpClient.patch(`/api/courses/lessons/${lessonId}`, {
    resourceUrl: fileOrUrl,
  });
  const raw = unwrapSingle(res);
  const lesson = normaliseLesson(raw, raw?.courseId, raw?.sectionId);
  return { data: lesson };
}

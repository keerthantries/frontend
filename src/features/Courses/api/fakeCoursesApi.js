// src/features/Courses/api/fakeCoursesApi.js

const COURSES_KEY = "vp_courses";
const SECTIONS_KEY = "vp_sections";
const LESSONS_KEY = "vp_lessons";

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse localStorage for", key, e);
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// Small artificial delay to mimic network
function wait(ms = 200) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ========== COURSES ========== */

export async function createCourse(data) {
  const courses = load(COURSES_KEY);

  const newCourse = {
    id: generateId("course"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: data.status || "draft",
    ...data, // includes thumbnailUrl, pricing, seo, etc.
  };

  courses.push(newCourse);
  save(COURSES_KEY, courses);

  await wait();
  return { data: newCourse };
}

export async function fetchCourses({
  page = 1,
  limit = 10,
  status = "All",
} = {}) {
  let courses = load(COURSES_KEY);

  if (status && status !== "All") {
    courses = courses.filter(
      (c) => (c.status || "").toLowerCase() === status.toLowerCase()
    );
  }

  const total = courses.length;
  const start = (page - 1) * limit;
  const items = courses.slice(start, start + limit);

  await wait();
  return {
    data: {
      items,
      total,
      page,
      limit,
    },
  };
}

export async function getCourseById(id) {
  const courses = load(COURSES_KEY);
  const course = courses.find((c) => c.id === id) || null;

  await wait();
  return { data: course };
}

export async function updateCourse(courseId, updates) {
  const courses = load(COURSES_KEY);
  const idx = courses.findIndex((c) => c.id === courseId);
  if (idx === -1) throw new Error("Course not found");

  courses[idx] = {
    ...courses[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  save(COURSES_KEY, courses);
  await wait();
  return { data: courses[idx] };
}

export async function deleteCourse(courseId) {
  const courses = load(COURSES_KEY);
  const sections = load(SECTIONS_KEY);
  const lessons = load(LESSONS_KEY);

  const filteredCourses = courses.filter((c) => c.id !== courseId);
  const filteredSections = sections.filter((s) => s.courseId !== courseId);
  const filteredLessons = lessons.filter((l) => l.courseId !== courseId);

  save(COURSES_KEY, filteredCourses);
  save(SECTIONS_KEY, filteredSections);
  save(LESSONS_KEY, filteredLessons);

  await wait();
  return { success: true };
}

/* ========== CURRICULUM: SECTIONS ========== */

export async function fetchCurriculum(courseId) {
  const sections = load(SECTIONS_KEY).filter((s) => s.courseId === courseId);
  const lessons = load(LESSONS_KEY).filter((l) => l.courseId === courseId);

  // sort by order
  sections.sort((a, b) => (a.order || 0) - (b.order || 0));
  lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

  const sectionsWithLessons = sections.map((sec) => ({
    ...sec,
    lessons: lessons.filter((l) => l.sectionId === sec.id),
  }));

  await wait();
  return {
    data: {
      sections: sectionsWithLessons,
    },
  };
}

export async function createSection(courseId, title) {
  const sections = load(SECTIONS_KEY);

  const existingForCourse = sections.filter((s) => s.courseId === courseId);
  const newSection = {
    id: generateId("section"),
    courseId,
    title,
    order: existingForCourse.length + 1,
    createdAt: new Date().toISOString(),
  };

  sections.push(newSection);
  save(SECTIONS_KEY, sections);

  await wait();
  return { data: newSection };
}

export async function updateSection(sectionId, updates) {
  const sections = load(SECTIONS_KEY);
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) throw new Error("Section not found");

  sections[idx] = {
    ...sections[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  save(SECTIONS_KEY, sections);
  await wait();
  return { data: sections[idx] };
}

export async function deleteSection(sectionId) {
  const sections = load(SECTIONS_KEY);
  const lessons = load(LESSONS_KEY);

  const filteredSections = sections.filter((s) => s.id !== sectionId);
  const filteredLessons = lessons.filter((l) => l.sectionId !== sectionId);

  save(SECTIONS_KEY, filteredSections);
  save(LESSONS_KEY, filteredLessons);

  await wait();
  return { success: true };
}

/* ========== CURRICULUM: LESSONS ========== */

export async function createLesson(courseId, sectionId, payload) {
  const lessons = load(LESSONS_KEY);

  const existingForSection = lessons.filter((l) => l.sectionId === sectionId);

  const newLesson = {
    id: generateId("lesson"),
    courseId,
    sectionId,
    title: payload.title,
    type: payload.type || "video", // "video" | "pdf" | "text" | "quiz"
    resourceUrl: null,
    isPreview: false,
    durationMinutes: null,
    order: existingForSection.length + 1,
    createdAt: new Date().toISOString(),
  };

  lessons.push(newLesson);
  save(LESSONS_KEY, lessons);

  await wait();
  return { data: newLesson };
}

export async function updateLesson(lessonId, updates) {
  const lessons = load(LESSONS_KEY);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) throw new Error("Lesson not found");

  lessons[idx] = {
    ...lessons[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  save(LESSONS_KEY, lessons);
  await wait();
  return { data: lessons[idx] };
}

export async function deleteLesson(lessonId) {
  const lessons = load(LESSONS_KEY);
  const filtered = lessons.filter((l) => l.id !== lessonId);
  save(LESSONS_KEY, filtered);
  await wait();
  return { success: true };
}

// Keep this for convenience (used in earlier design)
export async function updateLessonMaterial(lessonId, resourceUrl) {
  return updateLesson(lessonId, { resourceUrl });
}

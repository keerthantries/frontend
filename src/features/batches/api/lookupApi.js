// src/features/batches/api/lookupApi.js
import httpClient from "../../../services/httpClient";

/**
 * Search / list published courses for dropdown / typeahead
 * Uses your backend: GET /api/courses
 */
export async function searchCourses({ q = "", page = 1, limit = 20 } = {}) {
  const params = { page, limit, status: "published" };

  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/courses", { params });

  const body = res?.data;

  // Supports your structure (items inside data)
  const items =
    body?.data?.items ??
    body?.items ??
    (Array.isArray(body) ? body : []);

  return { data: items };
}

/**
 * Search educators (OrgUser with role=educator)
 * Uses existing admin users API:
 * GET /api/admin/users?role=educator&q=
 */
export async function searchEducators({ q = "", page = 1, limit = 20 } = {}) {
  const params = { page, limit, role: "educator" };
  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/admin/users", { params });
  const body = res?.data;

  const items =
    body?.data?.items ??
    body?.items ??
    (Array.isArray(body) ? body : []);

  return { data: items };
}

/**
 * Search learners (OrgUser with role=learner)
 */
export async function searchLearners({ q = "", page = 1, limit = 20 } = {}) {
  const params = { page, limit, role: "learner" };
  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/admin/users", { params });
  const body = res?.data;

  const items =
    body?.data?.items ??
    body?.items ??
    (Array.isArray(body) ? body : []);

  return { data: items };
}

// src/features/batches/api/batchesApi.js
import httpClient from "../../../services/httpClient";

// ========== CORE BATCHES APIS ==========

// GET /api/admin/batches
export async function fetchBatches({
  page = 1,
  limit = 20,
  q,
  status,
  mode,
  courseId,
  educatorId,
  subOrgId,
} = {}) {
  const params = { page, limit };

  if (q && q.trim()) params.q = q.trim();
  if (status && status !== "all") params.status = status;
  if (mode && mode !== "all") params.mode = mode;
  if (courseId) params.courseId = courseId;
  if (educatorId) params.educatorId = educatorId;
  if (subOrgId) params.subOrgId = subOrgId;

  const res = await httpClient.get("/api/admin/batches", { params });
  const data = res.data;

  if (data?.data?.items) {
    return {
      items: data.data.items,
      pagination: data.data.pagination || {},
    };
  }

  if (data?.items) {
    return {
      items: data.items,
      pagination: data.pagination || {},
    };
  }

  throw new Error("Unexpected batches API response shape.");
}

// GET /api/admin/batches/:id
export async function fetchBatchById(id) {
  const res = await httpClient.get(`/api/admin/batches/${id}`);
  const data = res.data;
  if (data?.data) return data.data;
  return data;
}

// POST /api/admin/batches
export async function createBatch(payload) {
  const res = await httpClient.post("/api/admin/batches", payload);
  return res.data;
}

// PATCH /api/admin/batches/:id
export async function updateBatch(id, payload) {
  const res = await httpClient.patch(`/api/admin/batches/${id}`, payload);
  return res.data;
}

// PATCH /api/admin/batches/:id/status
export async function changeBatchStatus(id, status) {
  const res = await httpClient.patch(`/api/admin/batches/${id}/status`, {
    status,
  });
  return res.data;
}

// ========== LOOKUPS (COURSE / EDUCATOR / LEARNER-SIDE LATER) ==========

// GET /api/courses?status=published&q=
export async function searchPublishedCourses({ q = "", page = 1, limit = 20 } = {}) {
  const params = { status: "published", page, limit };
  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/courses", { params });
  const data = res.data;

  if (data?.data?.items) return data.data.items;
  if (data?.items) return data.items;
  return Array.isArray(data) ? data : [];
}

// GET /api/admin/users?role=educator&q=
export async function searchEducators({ q = "", page = 1, limit = 20 } = {}) {
  const params = { role: "educator", page, limit };
  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/admin/users", { params });
  const data = res.data;

  if (data?.data?.items) return data.data.items;
  if (data?.items) return data.items;
  return Array.isArray(data) ? data : [];
}

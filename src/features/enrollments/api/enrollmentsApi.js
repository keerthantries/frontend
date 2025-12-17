import httpClient from "../../../services/httpClient";

// List enrollments for a batch
// GET /api/admin/batches/:id/enrollments
export async function fetchBatchEnrollments(batchId, {
  status,
  page = 1,
  limit = 20,
} = {}) {
  const params = { page, limit };
  if (status && status !== "all") params.status = status;

  const res = await httpClient.get(`/api/admin/batches/${batchId}/enrollments`, { params });
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

  // Fallback for empty list or unexpected shape
  return { items: [], pagination: {} };
}

// Single enroll into batch (Create)
// POST /api/admin/batches/:id/enrollments
export async function enrollLearnerToBatch(batchId, payload) {
  const res = await httpClient.post(`/api/admin/batches/${batchId}/enrollments`, payload);
  return res.data;
}

// Update enrollment details (Edit) - MISSING IN YOUR CODE
// PATCH /api/admin/batches/:id/enrollments/:enrollmentId
export async function updateEnrollment(batchId, enrollmentId, payload) {
  const res = await httpClient.patch(
    `/api/admin/batches/${batchId}/enrollments/${enrollmentId}`,
    payload
  );
  return res.data;
}

// Remove learner from batch (Delete) - MISSING IN YOUR CODE
// DELETE /api/admin/batches/:id/enrollments/:enrollmentId
export async function deleteEnrollment(batchId, enrollmentId) {
  const res = await httpClient.delete(
    `/api/admin/batches/${batchId}/enrollments/${enrollmentId}`
  );
  return res.data;
}

// Bulk enroll into batch
// POST /api/admin/batches/:id/enrollments/bulk
export async function bulkEnrollLearnersToBatch(batchId, payload) {
  const res = await httpClient.post(`/api/admin/batches/${batchId}/enrollments/bulk`, payload);
  return res.data;
}

// Lookup: Unassigned learners
// GET /api/admin/users?role=learner&unassigned=true
export async function searchUnassignedLearners({
  q = "",
  page = 1,
  limit = 50,
} = {}) {
  const params = {
    role: "learner",
    unassignedOnly: "true", // Ensure backend supports this filter
    page,
    limit,
  };
  if (q && q.trim()) params.q = q.trim();

  const res = await httpClient.get("/api/admin/users", { params });
  const data = res.data;

  if (data?.data?.items) return data.data.items;
  if (data?.items) return data.items;
  if (Array.isArray(data)) return data;

  return [];
}
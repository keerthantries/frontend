// src/features/userManagement/api/usersApi.js
import httpClient from "../../../services/httpClient";

/**
 * Fetch users with pagination, search, sorting and optional filters.
 * Backend supports: q, role, status, subOrgId, unassignedOnly, page, limit.
 */
export async function fetchUsers({
  page = 1,
  limit = 20,
  q = "",
  role,
  status,
  sortBy,
  sortDir,
  subOrgId,
  unassignedOnly,
} = {}) {
  const params = { page, limit };

  if (q && q.trim()) params.q = q.trim();
  if (role) params.role = role;
  if (status) params.status = status;
  if (sortBy) params.sortBy = sortBy;
  if (sortDir) params.sortDir = sortDir;
  if (subOrgId) params.subOrgId = subOrgId; // 🔹 important
  if (unassignedOnly) params.unassignedOnly = "true";

  const res = await httpClient.get("/api/admin/users", { params });
  const data = res.data;

  // Normalize into { items, pagination } for the UI
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

  throw new Error("Unexpected users API response shape.");
}

export async function fetchUserById(id) {
  const res = await httpClient.get(`/api/admin/users/${id}`);
  const data = res.data;

  if (data?.data) return data.data;
  return data;
}

export async function createUser(payload) {
  const res = await httpClient.post("/api/admin/users", payload);
  return res.data;
}

export async function updateUser(id, payload) {
  const res = await httpClient.patch(`/api/admin/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id) {
  const res = await httpClient.delete(`/api/admin/users/${id}`);
  return res.data;
}

export async function updateUserStatus(id, status) {
  const res = await httpClient.patch(`/api/admin/users/${id}/status`, {
    status,
  });
  return res.data;
}

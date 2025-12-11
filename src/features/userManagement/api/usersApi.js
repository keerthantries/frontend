import httpClient from "../../../services/httpClient";

/**
 * Fetch users with pagination, search, sorting and optional role filter.
 * Backend should handle q, role, sortBy, sortDir.
 */
// export async function fetchUsers({ page = 1, limit = 20 } = {}) {
//   const response = await httpClient.get("/api/admin/users", {
//     params: { page, limit },
//   });

//   console.log("🔎 Raw /api/admin/users response:", response);

//   // return only data (whatever it is)
//   return response.data;
export async function fetchUsers({
  page = 1,
  limit = 20,
  q = "",
  role,
  sortBy,
  sortDir,
} = {}) {
  const params = { page, limit };

  if (q && q.trim()) params.q = q.trim();
  if (role) params.role = role;
  if (sortBy) params.sortBy = sortBy;
  if (sortDir) params.sortDir = sortDir;

  const res = await httpClient.get("/api/admin/users", { params });
  const data = res.data;

  // Normalise shapes
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

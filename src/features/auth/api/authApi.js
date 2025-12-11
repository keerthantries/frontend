
import httpClient from "../../../services/httpClient";

/**
 * Call backend: POST /api/auth/admin/login
 * body: { orgSlug, email, password }
 */
export async function loginAdmin({ orgSlug, email, password }) {
  const response = await httpClient.post("/api/auth/admin/login", {
    orgSlug,
    email,
    password,
  });

  // Backend returns: { success, data: { user, org, token } }
  return response.data;
}

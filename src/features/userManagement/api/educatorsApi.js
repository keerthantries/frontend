// src/features/userManagement/pages/api/educatorsApi.js
import httpClient from "../../../services/httpClient";

// Fetch full educator profile + verification + documents
export async function fetchEducatorProfile(id) {
  const res = await httpClient.get(`/api/admin/educators/${id}`);
  const data = res.data;

  if (data?.data) return data.data;
  return data;
}

// Update educatorProfile section (bio, experience, links, etc.)
export async function updateEducatorProfile(id, educatorProfile) {
  const res = await httpClient.patch(
    `/api/admin/educators/${id}/profile`,
    { educatorProfile }
  );
  return res.data;
}

// Upload a document (uses your Multer + Cloudinary microservice)
export async function uploadEducatorDocument(id, formData) {
  // formData: { file, type, title, description }
  const res = await httpClient.post(
    `/api/admin/educators/${id}/documents`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
}

// Delete a document
export async function deleteEducatorDocument(id, docId) {
  const res = await httpClient.delete(
    `/api/admin/educators/${id}/documents/${docId}`
  );
  return res.data;
}

// Approve / reject educator
export async function verifyEducator(id, { status, notes }) {
  const res = await httpClient.patch(
    `/api/admin/educators/${id}/verify`,
    { status, notes }
  );
  return res.data;
}

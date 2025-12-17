// src/features/userManagement/api/educatorsApi.js
import httpClient from "../../../services/httpClient";

// Fetch full educator profile + verification + documents
export async function fetchEducatorProfile(id) {
  const res = await httpClient.get(`/api/admin/educators/${id}`);
  const data = res.data;
  return data?.data || data;
}

// ✅ Send FLAT fields, not { educatorProfile: {...} }
export async function updateEducatorProfile(id, profilePayload) {
  const res = await httpClient.patch(
    `/api/admin/educators/${id}/profile`,
    profilePayload
  );
  const data = res.data;
  return data?.data || data;
}

// Upload a document (uses your Multer + Cloudinary microservice)
export async function uploadEducatorDocument(id, formData) {
  const res = await httpClient.post(
    `/api/admin/educators/${id}/documents`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  // Keep the raw data, UI already handles multiple response shapes
  return res.data;
}

// Delete a document
export async function deleteEducatorDocument(id, docId) {
  const res = await httpClient.delete(
    `/api/admin/educators/${id}/documents/${docId}`
  );
  return res.data;
}

// ✅ Approve / reject educator with reviewReason (per spec)
// UI currently calls verifyEducator(id, { status, notes })
// so we map `notes` → `reviewReason` before sending to backend.
export async function verifyEducator(
  id,
  payload = {
    status: undefined,
    reviewReason: undefined,
    notes: undefined,
  }
) {
  const { status, reviewReason, notes } = payload || {};

  const body = {
    status,
    // Prefer explicit reviewReason, else fall back to notes from UI
    reviewReason: typeof reviewReason !== "undefined"
      ? reviewReason
      : typeof notes !== "undefined"
      ? notes
      : "",
  };

  const res = await httpClient.patch(
    `/api/admin/educators/${id}/verify`,
    body
  );
  const data = res.data;
  return data?.data || data;
}

/**
 * Upload educator avatar
 * POST /api/admin/educators/:id/avatar
 * multipart/form-data, field: "avatar"
 */
export async function uploadEducatorAvatar(req, res, next) {
  try {
    const { OrgUser } = getTenantModels(req);
    const currentUser = getCurrentUser(req);
    const educatorId = req.params.id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Avatar file is required (field name: 'avatar')",
      });
    }

    const educator = await OrgUser.findOne({
      _id: educatorId,
      role: "educator",
    });

    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found in tenant DB",
      });
    }

    // only admin / subOrgAdmin allowed (same as docs / verification)
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "subOrgAdmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to update educator avatar",
      });
    }

    // optional: delete old avatar
    if (educator.avatarPublicId) {
      await mediaService.deleteUserAvatar(educator.avatarPublicId);
    }

    // tenant key / org slug – adjust as per your setup
    const tenantKey = "vidhyapat"; // or derive from Organization like you did before

    const uploaded = await mediaService.uploadUserAvatar(
      req.file.buffer,
      tenantKey,
      educatorId
    );

    educator.avatarUrl = uploaded.avatarUrl;
    educator.avatarPublicId = uploaded.avatarPublicId;
    educator.updatedAt = new Date();
    await educator.save();

    return res.status(200).json({
      success: true,
      data: {
        id: educator._id.toString(),
        avatarUrl: educator.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}
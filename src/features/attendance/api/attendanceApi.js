// src/features/attendance/api/attendanceApi.js
import httpClient from "../../../services/httpClient";

// POST /api/admin/attendance/batches/:batchId/sessions/generate
export async function generateAttendanceSessions(batchId, { regenerate = false } = {}) {
  const res = await httpClient.post(
    `/api/admin/attendance/batches/${batchId}/sessions/generate`,
    { regenerate }
  );
  return res.data;
}

// GET /api/admin/attendance/batches/:batchId/sessions
export async function fetchBatchSessions(batchId) {
  const res = await httpClient.get(
    `/api/admin/attendance/batches/${batchId}/sessions`
  );
  const data = res.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

// GET /api/admin/attendance/sessions/:sessionId
export async function fetchSessionWithAttendance(sessionId) {
  const res = await httpClient.get(
    `/api/admin/attendance/sessions/${sessionId}`
  );
  const data = res.data;
  if (data?.data) return data.data;
  return data;
}

// POST /api/admin/attendance/sessions/:sessionId/auto-online
// body: { presentLearnerIds?: string[] }
export async function autoMarkOnlineSession(sessionId, presentLearnerIds) {
  const payload = {};
  if (Array.isArray(presentLearnerIds) && presentLearnerIds.length > 0) {
    payload.presentLearnerIds = presentLearnerIds;
  }
  const res = await httpClient.post(
    `/api/admin/attendance/sessions/${sessionId}/auto-online`,
    payload
  );
  return res.data;
}

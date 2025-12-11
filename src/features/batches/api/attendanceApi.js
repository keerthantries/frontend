// src/features/batches/api/attendanceApi.js
import httpClient from "../../../services/httpClient";

/**
 * Get attendance summary by session/date for a batch.
 * Expected backend shape (you can adjust):
 *
 * {
 *   success: true,
 *   data: {
 *     items: [
 *       {
 *         id: "...",
 *         date: "2025-01-10T00:00:00Z",
 *         mode: "online" | "offline" | "hybrid",
 *         totalEnrolled: 30,
 *         presentCount: 24,
 *         absentCount: 6,
 *         recordedBy: "Educator Name",
 *         notes: "QR based attendance"
 *       }
 *     ],
 *     pagination: { page, limit, total, totalPages }
 *   }
 * }
 */

export async function listBatchAttendanceSummary(batchId, params = {}) {
  const res = await httpClient.get(
    `/api/admin/batches/${batchId}/attendance/summary`,
    { params }
  );
  const body = res?.data;
  const items = body?.data?.items ?? body?.items ?? [];
  const pagination =
    body?.data?.pagination ?? body?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 10,
      total: items.length,
      totalPages: 1,
    };

  return { data: { items, pagination } };
}

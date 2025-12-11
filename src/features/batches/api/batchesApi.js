// src/features/batches/api/batchesApi.js
import httpClient from "../../../services/httpClient";

/**
 * Helpers to normalise backend responses
 */
function unwrapSingle(res) {
  const body = res?.data;
  return body?.data ?? body ?? null;
}

function unwrapList(res) {
  const body = res?.data;

  if (body?.data?.items) {
    return {
      items: body.data.items,
      pagination: body.data.pagination ?? null,
    };
  }

  if (Array.isArray(body)) {
    return {
      items: body,
      pagination: null,
    };
  }

  if (body?.items) {
    return {
      items: body.items,
      pagination: body.pagination ?? null,
    };
  }

  return {
    items: [],
    pagination: null,
  };
}

/* ================== BATCHES (ADMIN) ================== */

export async function listBatches(params = {}) {
  const res = await httpClient.get("/api/admin/batches", { params });
  const { items, pagination } = unwrapList(res);
  return { data: { items, pagination } };
}

export async function getBatchById(id) {
  const res = await httpClient.get(`/api/admin/batches/${id}`);
  const batch = unwrapSingle(res);
  return { data: batch };
}

export async function createBatch(payload) {
  const res = await httpClient.post("/api/admin/batches", payload);
  const batch = unwrapSingle(res);
  return { data: batch };
}

export async function updateBatch(id, payload) {
  const res = await httpClient.patch(`/api/admin/batches/${id}`, payload);
  const batch = unwrapSingle(res);
  return { data: batch };
}

export async function changeBatchStatus(id, statusPayload) {
  const res = await httpClient.patch(
    `/api/admin/batches/${id}/status`,
    statusPayload
  );
  const batch = unwrapSingle(res);
  return { data: batch };
}

/* ================== ENROLLMENTS (ADMIN) ================== */

export async function listBatchEnrollments(batchId, params = {}) {
  const res = await httpClient.get(
    `/api/admin/batches/${batchId}/enrollments`,
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

export async function enrollLearner(batchId, payload) {
  const res = await httpClient.post(
    `/api/admin/batches/${batchId}/enrollments`,
    payload
  );
  const enrollment = unwrapSingle(res);
  return { data: enrollment };
}

export async function bulkEnrollLearners(batchId, payload) {
  const res = await httpClient.post(
    `/api/admin/batches/${batchId}/enrollments/bulk`,
    payload
  );
  const body = unwrapSingle(res);
  return { data: body };
}

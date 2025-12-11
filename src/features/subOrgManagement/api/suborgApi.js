// src/api/suborgApi.js
import httpClient from "../../../services/httpClient";

// GET /api/admin/suborgs
export const fetchSubOrgs = () =>
  httpClient.get("/api/admin/suborgs");

// GET /api/admin/suborgs/:id
export const fetchSubOrgById = (id) =>
  httpClient.get(`/api/admin/suborgs/${id}`);

// POST /api/admin/suborgs
export const createSubOrg = (data) =>
  httpClient.post("/api/admin/suborgs", data);

// POST /api/admin/suborgs/with-admin
export const createSubOrgWithAdmin = (data) =>
  httpClient.post("/api/admin/suborgs/with-admin", data);

// PATCH /api/admin/suborgs/:id
export const updateSubOrg = (id, data) =>
  httpClient.patch(`/api/admin/suborgs/${id}`, data);

// PATCH /api/admin/suborgs/:id/status
export const changeSubOrgStatus = (id, status) =>
  httpClient.patch(`/api/admin/suborgs/${id}/status`, { status });

// PATCH /api/admin/suborgs/transfer-user/:userId
export const transferUserSubOrg = (userId, subOrgId) =>
  httpClient.patch(`/api/admin/suborgs/transfer-user/${userId}`, {
    subOrgId,
  });

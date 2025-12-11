// src/features/userManagement/pages/UserUpsertPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Correct paths based on your structure
// (same style as UserDetailsPage & UserListScreen)
import {
  fetchUserById,
  createUser,
  updateUser,
} from "../api/usersApi";
import { transferUserSubOrg } from "../../subOrgManagement/api/suborgApi";

import UserForm from "./UserFormPage";

const UserUpsertPage = () => {
  const { id } = useParams(); // if id present -> edit mode
  const isEdit = Boolean(id);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ===== Load user in edit mode =====
  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;

    async function loadUser() {
      setLoadingUser(true);
      setError("");

      try {
        const data = await fetchUserById(id);
        if (!isMounted) return;
        setUser(data);
      } catch (err) {
        console.error("Error loading user:", err);
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load user details. Please try again."
        );
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  // ===== Handle create / update + sub-org transfer =====
  const handleSubmit = async (formData) => {
    setSaving(true);
    setError("");

    // orgId in form = selected subOrgId ("" means no sub-org)
    const { orgId, ...userPayload } = formData;

    try {
      if (isEdit) {
        // 1) Update user basic info
        await updateUser(id, userPayload);

        // 2) Transfer sub-org if admin selected something
        if (typeof orgId !== "undefined") {
          const targetSubOrgId = orgId === "" ? null : orgId;
          await transferUserSubOrg(id, targetSubOrgId);
        }
      } else {
        // CREATE USER
        const createRes = await createUser(userPayload);

        // Try to extract new user id from different shapes
        const created =
          createRes?.data?.user ||
          createRes?.data ||
          createRes?.user ||
          createRes;

        const newId = created?.id || created?._id;

        // If we have both new user id and orgId, call transfer API
        if (newId && typeof orgId !== "undefined") {
          const targetSubOrgId = orgId === "" ? null : orgId;
          // allow null (detach) or actual id
          if (targetSubOrgId || targetSubOrgId === null) {
            await transferUserSubOrg(newId, targetSubOrgId);
          }
        }
      }

      // Back to users list
      navigate("/admin/users");
    } catch (err) {
      console.error("Save user error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save user.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isEdit ? "Edit User" : "Add User";
  const pageSubTitle = isEdit
    ? "Update user information, role, and sub-organization."
    : "Create a new user and optionally assign a sub-organization.";

  return (
    <>
      {/* Page head */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">{pageTitle}</h3>
            <div className="nk-block-des text-soft">
              <p>{pageSubTitle}</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="nk-block-tools">
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => navigate("/admin/users")}
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="nk-block">
        <div
          className="card card-bordered"
          style={{ background: "var(--vp-surface)" }}
        >
          <div className="card-inner">
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                {error}
              </div>
            )}

            {isEdit && loadingUser && (
              <div className="text-center py-5">
                <div className="spinner-border" role="status" />
                <div className="text-soft small mt-2">
                  Loading user details...
                </div>
              </div>
            )}

            {/* Render form once user is loaded (for edit) or immediately (create) */}
            {!isEdit || (isEdit && !loadingUser && user) ? (
              <UserForm
                initialUser={isEdit ? user : null}
                onSubmit={handleSubmit}
                submitting={saving}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserUpsertPage;

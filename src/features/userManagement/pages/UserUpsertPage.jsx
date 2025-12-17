// src/features/userManagement/pages/UserUpsertPage.jsx
import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  fetchUserById,
  createUser,
  updateUser,
} from "../api/usersApi";
import { transferUserSubOrg } from "../../subOrgManagement/api/suborgApi";
import UserForm from "./UserFormPage";
import { ArrowLeft, UserPlus, Save } from "lucide-react";

const UserUpsertPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [initialOrgId, setInitialOrgId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const roleFromQuery = searchParams.get("role") || "";
  const defaultSubOrgId = searchParams.get("subOrgId") || "";

  const pageTitle = isEdit ? "Edit User" : "Add User";
  const pageSubTitle = isEdit
    ? "Update user information, role, and sub-organization."
    : "Create a new user and optionally assign a sub-organization.";

  // load existing user on edit
  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchUserById(id);
        if (!isMounted) return;
        setUser(data);

        const existingOrgId =
          data.orgId ||
          data.organizationId ||
          data.subOrgId ||
          data.suborgId ||
          data.subOrg?._id ||
          data.subOrg?.id ||
          "";
        setInitialOrgId(existingOrgId ? String(existingOrgId) : "");
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load user:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load user."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        // update main user fields
        await updateUser(id, {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          status: payload.status,
          profileUrl: payload.profileUrl,
        });

        // if sub-org changed, call transfer endpoint to automate move
        const newOrgId = payload.subOrgId || "";
        const changed =
          String(newOrgId || "") !== String(initialOrgId || "");

        if (changed) {
          await transferUserSubOrg(id, newOrgId || null);
        }

        navigate(`/admin/users/${id}`);
      } else {
        // create user → backend should accept subOrgId directly
        const created = await createUser(payload);
        const createdId =
          created?.data?._id ||
          created?.data?.id ||
          created?._id ||
          created?.id;

        navigate(createdId ? `/admin/users/${createdId}` : "/admin/users");
      }
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

  const profileUrl =
    user?.profileImageUrl ||
    user?.profileUrl ||
    user?.avatarUrl ||
    user?.photoUrl ||
    "";

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      {/* Page header */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              <button
                type="button"
                className="btn btn-sm btn-outline-light me-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} className="me-1" />
                Back
              </button>
              {pageTitle}
            </h3>
            <div className="nk-block-des text-soft">
              <p>{pageSubTitle}</p>
              {location.state?.from && (
                <p className="small mb-0">
                  Navigated from: <code>{location.state.from}</code>
                </p>
              )}
            </div>
          </div>

          <div className="nk-block-head-content">
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/admin/users")}
              >
                <ArrowLeft size={16} className="me-1" />
                Back to list
              </button>
              {!isEdit && (
                <span className="badge bg-primary-dim text-primary d-inline-flex align-items-center">
                  <UserPlus size={14} className="me-1" />
                  New user
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline error */}
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="nk-block">
        <div className="row g-gs">
          {/* Form card */}
          <div className="col-lg-8">
            <div className="card card-bordered card-stretch">
              <div className="card-inner">
                {loading && isEdit && !user ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />
                    <div className="text-soft mt-2 small">
                      Loading user...
                    </div>
                  </div>
                ) : (
                  <UserForm
                    initialUser={isEdit ? user : null}
                    onSubmit={handleSubmit}
                    submitting={saving}
                    fixedRole={isEdit ? undefined : roleFromQuery}
                    defaultOrgId={isEdit ? undefined : defaultSubOrgId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Summary / avatar card */}
          <div className="col-lg-4">
            <div className="card card-bordered">
              <div className="card-inner text-center">
                <div className="mb-3">
                  {profileUrl ? (
                    <div className="user-avatar user-avatar-xl">
                      <img src={profileUrl} alt={user?.name || "Avatar"} />
                    </div>
                  ) : (
                    <div className="user-avatar user-avatar-xl bg-primary-dim">
                      <span>{initials}</span>
                    </div>
                  )}
                </div>
                <h6 className="mb-1">
                  {user?.name || (isEdit ? "User" : "New User")}
                </h6>
                <div className="text-soft small mb-2">
                  {user?.email || "User details will appear after saving."}
                </div>
                <div className="nk-block-des text-soft small">
                  <p className="mb-1">
                    {isEdit
                      ? "Update profile details and sub-organization."
                      : "Fill in the form to create a new user."}
                  </p>
                 
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const form = document.querySelector("form");
                      if (form) form.requestSubmit();
                    }}
                    disabled={saving}
                  >
                    <Save size={16} className="me-1" />
                    {saving ? "Saving..." : "Save User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserUpsertPage;

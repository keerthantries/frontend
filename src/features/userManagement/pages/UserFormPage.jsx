// src/features/userManagement/pages/UserFormPage.jsx
import React, { useState, useEffect } from "react";
import { fetchSubOrgs } from "../../subOrgManagement/api/suborgApi";

const emptyUser = {
  name: "",
  email: "",
  phone: "",
  role: "learner",
  status: "active",
  orgId: "", // will store subOrgId (or empty for no sub-org)
  profileUrl: "", // optional avatar url if backend supports it
};

const UserForm = ({
  initialUser,
  onSubmit,
  submitting,
  fixedRole,
  defaultOrgId,
}) => {
  const [form, setForm] = useState(emptyUser);
  const [subOrgs, setSubOrgs] = useState([]);
  const [subOrgError, setSubOrgError] = useState("");
  const [loadingSubOrgs, setLoadingSubOrgs] = useState(false);

  // current user for permissions
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vp_user");
      const parsed = raw ? JSON.parse(raw) : null;
      setCurrentUserRole(parsed?.role || null);
    } catch {
      setCurrentUserRole(null);
    }
  }, []);

  const isAdmin =
    currentUserRole === "admin" ||
    currentUserRole === "superadmin" ||
    currentUserRole === "superAdmin";

  // initialise form when initialUser / defaultOrgId / fixedRole change
  useEffect(() => {
    const base = { ...emptyUser };

    if (initialUser) {
      base.name = initialUser.name || "";
      base.email = initialUser.email || "";
      base.phone = initialUser.phone || "";
      base.role = initialUser.role || initialUser.userRole || base.role;
      base.status = initialUser.status || base.status;

      // derive orgId/subOrgId from multiple possible properties
      const directOrgId =
        initialUser.orgId ||
        initialUser.organizationId ||
        initialUser.subOrgId ||
        initialUser.suborgId ||
        initialUser.subOrg?._id ||
        initialUser.subOrg?.id;

      base.orgId = directOrgId ? String(directOrgId) : "";
      base.profileUrl =
        initialUser.profileImageUrl ||
        initialUser.profileUrl ||
        initialUser.avatarUrl ||
        initialUser.photoUrl ||
        "";
    } else {
      // create mode defaults
      if (defaultOrgId) {
        base.orgId = String(defaultOrgId);
      }
      if (fixedRole) {
        base.role = fixedRole;
      }
    }

    setForm(base);
  }, [initialUser, defaultOrgId, fixedRole]);

  // load sub-org options
  useEffect(() => {
    let isMounted = true;

    async function loadSubOrgs() {
      setLoadingSubOrgs(true);
      setSubOrgError("");
      try {
        const res = await fetchSubOrgs();
        const data = res?.data;

        let items = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.items)) items = data.items;
        else if (Array.isArray(data?.data?.items)) items = data.data.items;
        else if (Array.isArray(data?.data)) items = data.data;

        if (!isMounted) return;
        setSubOrgs(Array.isArray(items) ? items : []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load sub-orgs for user form:", err);
        setSubOrgError(
          err?.response?.data?.message ||
            err?.message ||
            "Could not load sub-organizations."
        );
      } finally {
        if (isMounted) setLoadingSubOrgs(false);
      }
    }

    loadSubOrgs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmit) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.status,
      // backend expects subOrgId, not orgId
      subOrgId: form.orgId || null,
      profileUrl: form.profileUrl?.trim() || undefined,
    };

    onSubmit(payload);
  };

  const renderOrgField = () => {
    // if not admin, just show text; org change via Transfer page
    if (!isAdmin) {
      const selected =
        subOrgs.find(
          (s) =>
            String(s.id || s._id) === String(form.orgId || "")
        ) || null;

      return (
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label">Sub-Organization</label>
            <div className="form-control-plaintext small text-soft">
              {selected
                ? selected.name ||
                  selected.subOrgName ||
                  selected.displayName
                : "Main Org (no sub-organization)"}
              <span className="d-block mt-1 text-xs">
                Only Admin can change sub-organization. Use transfer page to
                move users.
              </span>
            </div>
          </div>
        </div>
      );
    }

    // admin view – dropdown
    return (
      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label" htmlFor="orgId">
            Sub-Organization
          </label>
          <div className="form-control-wrap">
            <select
              id="orgId"
              name="orgId"
              className="form-select"
              value={form.orgId}
              onChange={handleChange}
              disabled={loadingSubOrgs}
            >
              <option value="">Main Org (no sub-organization)</option>
              {subOrgs.map((so) => {
                const id = so.id || so._id;
                const label =
                  so.name || so.subOrgName || so.displayName || `Sub-Org ${id}`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          {subOrgError && (
            <div className="form-note text-danger mt-1 small">
              {subOrgError}
            </div>
          )}
          {loadingSubOrgs && !subOrgError && (
            <div className="form-note text-soft small">
              Loading sub-organizations...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="gy-3">
      <div className="row g-3">
        {/* Left column */}
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                placeholder="Enter full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <div className="form-control-wrap">
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone
            </label>
            <div className="form-control-wrap">
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-md-6">
          {/* Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="role">
              Role
            </label>
            <div className="form-control-wrap">
              <select
                id="role"
                name="role"
                className="form-select"
                value={form.role}
                onChange={handleChange}
                disabled={!!fixedRole}
              >
                <option value="learner">Learner</option>
                <option value="educator">Educator</option>
                <option value="subOrgAdmin">Sub-Org Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {fixedRole && (
              <div className="form-note text-soft small">
                Role locked to <strong>{fixedRole}</strong> for this flow.
              </div>
            )}
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Status
            </label>
            <div className="form-control-wrap">
              <select
                id="status"
                name="status"
                className="form-select"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Optional profile URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="profileUrl">
              Profile Image URL <span className="text-soft">(optional)</span>
            </label>
            <div className="form-control-wrap">
              <input
                type="url"
                id="profileUrl"
                name="profileUrl"
                className="form-control"
                placeholder="https://example.com/avatar.png"
                value={form.profileUrl}
                onChange={handleChange}
              />
            </div>
            <div className="form-note text-soft small">
              If provided, this image will be shown instead of initials.
            </div>
          </div>
        </div>

        {/* Org field (admin vs non-admin variants) */}
        {renderOrgField()}
      </div>

      <div className="mt-3 d-flex justify-content-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save User"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;

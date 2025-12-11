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
};

const UserForm = ({ initialUser, onSubmit, submitting }) => {
  const [form, setForm] = useState(emptyUser);
  const [subOrgs, setSubOrgs] = useState([]);
  const [loadingSubOrgs, setLoadingSubOrgs] = useState(false);

  // current user from localStorage (vp_user)
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    currentUser = null;
  }
  const isAdmin = currentUser?.role === "admin";

  // hydrate form when editing
  useEffect(() => {
    if (initialUser) {
      setForm({
        name: initialUser.name || "",
        email: initialUser.email || "",
        phone: initialUser.phone || "",
        role: initialUser.role || initialUser.userRole || "learner",
        status: initialUser.status || "active",
        orgId: initialUser.orgId || initialUser.subOrgId || "",
      });
    } else {
      setForm(emptyUser);
    }
  }, [initialUser]);

  // Load sub-orgs for Admin (for dropdown)
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    async function loadSubOrgs() {
      setLoadingSubOrgs(true);
      try {
        const res = await fetchSubOrgs();
        const list = res?.data?.data || res?.data || [];
        if (!isMounted) return;
        setSubOrgs(list);
      } catch (err) {
        console.error("Failed to load sub-orgs for user form:", err);
      } finally {
        if (isMounted) setLoadingSubOrgs(false);
      }
    }

    loadSubOrgs();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Non-admins: show org/sub-org as read-only
  const renderOrgField = () => {
    if (!isAdmin) {
      const displayOrg =
        initialUser?.subOrgName ||
        initialUser?.orgName ||
        initialUser?.organizationName ||
        initialUser?.subOrgId ||
        "Main Org";

      return (
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label" htmlFor="orgId">
              Organization / Sub-Org
            </label>
            <div className="form-control-wrap">
              <input
                id="orgId"
                name="orgId"
                type="text"
                className="form-control"
                value={displayOrg}
                readOnly
              />
            </div>
            <div className="form-note">
              Only Admin can change sub-organization.
            </div>
          </div>
        </div>
      );
    }

    // Admin view → dropdown of sub-orgs
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
              disabled={submitting || loadingSubOrgs}
            >
              <option value="">No Sub-Org</option>
              {subOrgs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.code ? ` (${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-note">
            Assign this user to a department / sub-organization.
          </div>
        </div>
      </div>
    );
  };

  return (
    <form className="gy-3" onSubmit={handleSubmit}>
      <div className="row g-3">
        {/* FULL NAME */}
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="form-control-wrap">
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Revanth Kumar"
                required
              />
            </div>
          </div>
        </div>

        {/* EMAIL */}
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <div className="form-control-wrap">
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                placeholder="user@your-org.com"
                required
              />
            </div>
          </div>
        </div>

        {/* PHONE */}
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone
            </label>
            <div className="form-control-wrap">
              <input
                id="phone"
                name="phone"
                type="text"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* ROLE */}
        <div className="col-md-6">
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
              >
                <option value="admin">Admin</option>
                <option value="subOrgAdmin">Sub-Org Admin</option>
                <option value="educator">Educator</option>
                <option value="learner">Learner</option>
              </select>
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="col-md-6">
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
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* ORG / SUB-ORG FIELD (depends on role) */}
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

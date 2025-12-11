// src/features/subOrgManagement/pages/SubOrgWithAdminPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSubOrgWithAdmin } from "../api/suborgApi";

const SubOrgWithAdminPage = () => {
  const navigate = useNavigate();

  // current user from localStorage
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    currentUser = null;
  }
  const isAdmin = currentUser?.role === "admin";

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugError, setDebugError] = useState("");

  if (!isAdmin) {
    return (
      <div className="nk-block">
        <div className="alert alert-danger">
          Only Admin can create Sub-Organization with SubOrgAdmin.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDebugError("");

    if (!form.name.trim()) {
      setError("Sub-Organization name is required.");
      return;
    }
    if (!form.adminEmail.trim() || !form.adminPassword.trim()) {
      setError("Admin email and password are required.");
      return;
    }

    try {
      setSaving(true);

      // Just to be extra sure, log what we are sending
      console.log("🔹 SubOrgWithAdmin payload:", form);

      const res = await createSubOrgWithAdmin(form);
      console.log("✅ createSubOrgWithAdmin response:", res);

      const adminUser = res?.data?.data?.adminUser;
      setSuccess(
        `Sub-Organization created successfully. Admin email: ${
          adminUser?.email || form.adminEmail
        }`
      );
      setForm({
        name: "",
        code: "",
        description: "",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        adminPassword: "",
      });
    } catch (err) {
      console.error("❌ createSubOrgWithAdmin error:", err);
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      setError(
        backendMessage ||
          "Failed to create Sub-Organization with admin."
      );

      // extra debug info to see raw backend payload if needed
      if (err?.response?.data) {
        setDebugError(JSON.stringify(err.response.data, null, 2));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nk-block">
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              Create Sub-Organization + SubOrgAdmin
            </h3>
            <div className="nk-block-des text-soft">
              <p>
                This will create a sub-organization and its SubOrgAdmin
                user in one step.
              </p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <div className="nk-block-tools">
              <ul className="nk-block-tools g-3">
                <li>
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => navigate("/admin/suborgs")}
                  >
                    Back to list
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      {debugError && (
        <pre className="alert alert-secondary small mb-3" style={{ whiteSpace: "pre-wrap" }}>
{debugError}
        </pre>
      )}
      {success && (
        <div className="alert alert-success mb-3" role="alert">
          {success}
        </div>
      )}

      <div className="nk-block">
        <div
          className="card card-bordered"
          style={{ background: "var(--vp-surface)" }}
        >
          <div className="card-inner">
            <form onSubmit={handleSubmit} className="gy-3">
              <div className="row g-3">
                <div className="col-12">
                  <h6 className="title overline-title text-soft">
                    Sub-Organization
                  </h6>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        className="form-control"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <div className="form-control-wrap">
                      <textarea
                        className="form-control"
                        rows="3"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <h6 className="title overline-title text-soft">
                    SubOrgAdmin
                  </h6>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Admin Name</label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        className="form-control"
                        name="adminName"
                        value={form.adminName}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Admin Email *</label>
                    <div className="form-control-wrap">
                      <input
                        type="email"
                        className="form-control"
                        name="adminEmail"
                        value={form.adminEmail}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Admin Phone</label>
                    <div className="form-control-wrap">
                      <input
                        type="tel"
                        className="form-control"
                        name="adminPhone"
                        value={form.adminPhone}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">
                      Admin Password *
                    </label>
                    <div className="form-control-wrap">
                      <input
                        type="password"
                        className="form-control"
                        name="adminPassword"
                        value={form.adminPassword}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="nk-block-between nk-block-tools pt-3">
                <div className="nk-block-des text-soft">
                  <p className="small">
                    A SubOrgAdmin user will be created with the given
                    credentials.
                  </p>
                </div>
                <ul className="nk-block-tools g-3">
                  <li>
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => navigate("/admin/suborgs")}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </li>
                  <li>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? "Creating..." : "Create"}
                    </button>
                  </li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubOrgWithAdminPage;

// src/features/subOrgManagement/components/SubOrgForm.jsx
import React, { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

const emptyForm = {
  name: "",
  code: "",
  description: "",
};

const SubOrgForm = ({
  initialValues,
  onSubmit,
  onCancel,
  loading,
  mode = "create", // create | edit | view
}) => {
  const [form, setForm] = useState(emptyForm);

  const isView = mode === "view";

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        code: initialValues.code || "",
        description: initialValues.description || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmit || isView) return;
    onSubmit(form);
  };

  return (
    <form
      className="vp-suborg-form"
      onSubmit={handleSubmit}
      noValidate
      autoComplete="off"
    >
      <div className="row g-3">
        <div className="col-md-6">
          <div className="form-group">
            <label className="form-label">Name</label>
            <div className="form-control-wrap">
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={loading || isView}
                placeholder="e.g. Vidhyapat Campus - 1"
                required
              />
            </div>
            <div className="form-note">
              This will be visible across the LMS (batches, users, etc.).
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
                disabled={loading || isView}
                placeholder="e.g. VDP-2025"
              />
            </div>
            <div className="form-note">Optional, but should be unique.</div>
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
                disabled={loading || isView}
                placeholder="Short description of this branch / department."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="nk-block-between nk-block-tools pt-3">
        <div className="nk-block-des text-soft">
          <p className="small mb-0">
            {mode === "create"
              ? "Creating a new sub-organization for this tenant."
              : mode === "edit"
              ? "Updating sub-organization details."
              : "Read-only view of this sub-organization."}
          </p>
        </div>

        <ul className="nk-block-tools g-2">
          {onCancel && (
            <li>
              <button
                type="button"
                className="btn btn-outline-light d-inline-flex align-items-center"
                onClick={onCancel}
                disabled={loading}
              >
                <X size={16} className="me-1" />
                Cancel
              </button>
            </li>
          )}
          {!isView && (
            <li>
              <button
                type="submit"
                className="btn btn-primary d-inline-flex align-items-center"
                disabled={loading}
              >
                <Save size={16} className="me-1" />
                {loading ? "Saving..." : "Save"}
              </button>
            </li>
          )}
        </ul>
      </div>
    </form>
  );
};

export default SubOrgForm;

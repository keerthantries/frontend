// src/features/subOrgManagement/pages/SubOrgUpsertPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  fetchSubOrgById,
  createSubOrg,
  updateSubOrg,
} from "../api/suborgApi";
import SubOrgForm from "../components/SubOrgForm";

const SubOrgUpsertPage = () => {
  // routes:
  // /admin/suborgs/create
  // /admin/suborgs/:subOrgId/edit
  // /admin/suborgs/:subOrgId (view mode via state.mode="view")
  const { subOrgId } = useParams();
  const isEdit = Boolean(subOrgId);
  const navigate = useNavigate();
  const location = useLocation();

  // current user from localStorage
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    currentUser = null;
  }
  const isAdmin = currentUser?.role === "admin";

  const [subOrg, setSubOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const modeFromState = location.state?.mode;
  const isViewOnly = modeFromState === "view" || !isAdmin;

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        setError("");
        const res = await fetchSubOrgById(subOrgId);
        setSubOrg(res.data?.data || null);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Unable to load sub-organization details."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, subOrgId]);

  const handleSubmit = async (values) => {
    if (!isAdmin) {
      alert("Only Admin can create or update sub-organizations.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      if (isEdit) {
        await updateSubOrg(subOrgId, values);
      } else {
        await createSubOrg(values);
      }
      navigate("/admin/suborgs");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to save sub-organization."
      );
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit
    ? isViewOnly
      ? "View Sub-Organization"
      : "Edit Sub-Organization"
    : "Create Sub-Organization";

  return (
    <div className="nk-block">
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">{title}</h3>
            <div className="nk-block-des text-soft">
              <p>
                {isEdit
                  ? "Update department / branch details."
                  : "Create a new department / branch for this tenant."}
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

      <div className="nk-block">
        <div
          className="card card-bordered"
          style={{ background: "var(--vp-surface)" }}
        >
          <div className="card-inner">
            {loading && isEdit ? (
              <div className="text-center py-5">
                <div className="spinner-border" />
              </div>
            ) : (
              <SubOrgForm
                initialValues={subOrg}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/admin/suborgs")}
                loading={saving}
                mode={
                  isViewOnly
                    ? "view"
                    : isEdit
                    ? "edit"
                    : "create"
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubOrgUpsertPage;

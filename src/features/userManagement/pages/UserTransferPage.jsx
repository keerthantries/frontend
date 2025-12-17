// src/features/userManagement/pages/UserTransferPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUserById } from "../api/usersApi";
import {
  fetchSubOrgs,
  transferUserSubOrg,
} from "../../subOrgManagement/api/suborgApi";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  User,
  Mail,
} from "lucide-react";

const UserTransferPage = () => {
  // ✅ support both :id and :userId routes
  const params = useParams();
  const userId = params.id || params.userId;

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [subOrgs, setSubOrgs] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingSubOrgs, setLoadingSubOrgs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetSubOrgId, setTargetSubOrgId] = useState("");
  const [error, setError] = useState("");

  // ---------- Load user ----------
  useEffect(() => {
    if (!userId) {
      console.error("UserTransferPage: userId is missing from route params");
      setError("User id is missing in the URL.");
      return;
    }

    let isMounted = true;

    async function loadUser() {
      setLoadingUser(true);
      setError("");

      try {
        const data = await fetchUserById(userId);
        if (!isMounted) return;

        setUser(data);

        const currentSubOrgId = data?.subOrgId || data?.orgId || "";
        setTargetSubOrgId(currentSubOrgId || "");
      } catch (err) {
        console.error("Failed to load user:", err);
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
  }, [userId]);

  // ---------- Load sub-orgs ----------
  useEffect(() => {
    let isMounted = true;

    async function loadSubOrgsList() {
      setLoadingSubOrgs(true);
      try {
        const res = await fetchSubOrgs();
        // supports shapes: {success, data: []}, {data: []}, []
        let list = [];

        if (Array.isArray(res?.data?.data)) {
          list = res.data.data;
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }

        if (!isMounted) return;
        setSubOrgs(list);
      } catch (err) {
        console.error("Failed to load sub-orgs:", err);
      } finally {
        if (isMounted) setLoadingSubOrgs(false);
      }
    }

    loadSubOrgsList();
    return () => {
      isMounted = false;
    };
  }, []);

  // ---------- Submit transfer ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");

    try {
      // Empty string → main org (no sub-org)
      const finalSubOrgId = targetSubOrgId || null;

      await transferUserSubOrg(userId, finalSubOrgId);

      navigate("/admin/users");
    } catch (err) {
      console.error("Transfer user error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to transfer user.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Derive current org name (never show ID) ----------
  let currentSubOrgName = "Main Org";
  const rawCurrentSubOrgId = user?.subOrgId || user?.orgId || "";

  if (
    user?.subOrgName ||
    user?.orgName ||
    user?.organizationName
  ) {
    currentSubOrgName =
      user.subOrgName || user.orgName || user.organizationName;
  } else if (rawCurrentSubOrgId && subOrgs.length > 0) {
    const match = subOrgs.find(
      (s) =>
        String(s.id || s._id) === String(rawCurrentSubOrgId)
    );
    if (match) {
      currentSubOrgName =
        match.name || match.code || "Sub-Organization";
    }
  }

  if (loadingUser && !user) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <div className="text-soft mt-2 small">Loading user...</div>
      </div>
    );
  }

  if (!user && error) {
    return <p className="text-danger m-3">{error}</p>;
  }

  if (!user) return null;

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      {/* PAGE HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <div className="d-flex align-items-center gap-2 mb-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-light border-0 p-1"
                onClick={() => navigate(-1)}
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="nk-block-title page-title mb-0">
                Transfer User /{" "}
                <span className="text-primary small">{user.name}</span>
              </h3>
            </div>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Move this user to a different sub-organization or back to the
                main organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner">
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                {error}
              </div>
            )}

            <div className="row g-gs mb-4">
              {/* User Summary */}
              <div className="col-md-6">
                <div className="card card-bordered">
                  <div className="card-inner d-flex align-items-center">
                    <div className="user-avatar bg-primary-dim me-3">
                      <span>{initials}</span>
                    </div>
                    <div>
                      <h6 className="mb-1 d-flex align-items-center">
                        <User size={16} className="me-1 text-primary" />
                        {user.name}
                      </h6>
                      <div className="small text-muted d-flex align-items-center">
                        <Mail size={14} className="me-1" />
                        {user.email || "-"}
                      </div>
                      <div className="small text-soft mt-1">
                        Current Role:{" "}
                        <span className="text-capitalize">
                          {user.role || user.userRole || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Org */}
              <div className="col-md-6">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <h6 className="title mb-2 d-flex align-items-center">
                      <Building2 size={16} className="me-1 text-primary" />
                      Current Organization
                    </h6>
                    <p className="mb-1">
                      <strong>{currentSubOrgName}</strong>
                    </p>
                    <p className="small text-soft mb-0">
                      Choose a new sub-organization below to transfer this user.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TRANSFER FORM */}
            <form onSubmit={handleSubmit}>
              <div className="row g-gs align-items-end">
                <div className="col-md-7">
                  <div className="form-group">
                    <label className="form-label" htmlFor="targetSubOrg">
                      Target Sub-Organization
                    </label>
                    <div className="form-control-wrap d-flex align-items-center">
                      <ArrowRightLeft size={18} className="me-2 text-primary" />
                      <select
                        id="targetSubOrg"
                        className="form-select"
                        value={targetSubOrgId || ""}
                        onChange={(e) => setTargetSubOrgId(e.target.value)}
                        disabled={saving || loadingSubOrgs}
                      >
                        <option value="">
                          Main Organization (no sub-org)
                        </option>
                        {subOrgs.map((s) => {
                          const id = s.id || s._id;
                          const labelName =
                            s.name || s.subOrgName || s.displayName || "Sub-Org";
                          return (
                            <option key={id} value={id}>
                              {labelName}
                              {s.code ? ` (${s.code})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="form-note">
                      This will update the user&apos;s sub-organization mapping.
                    </div>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="d-flex justify-content-end gap-3">

                   
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2"
                      onClick={() => navigate(-1)}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                   
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2"
                      disabled={saving}
                    >
                      {saving ? "Transferring..." : "Confirm Transfer"}
                    </button>

                  </div>
                </div>

              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default UserTransferPage;

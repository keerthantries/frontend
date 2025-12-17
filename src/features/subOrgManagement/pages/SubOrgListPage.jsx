// src/features/subOrgManagement/pages/SubOrgListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Users,
  Info,
  ArrowRight,
} from "lucide-react";
import { fetchSubOrgs, changeSubOrgStatus } from "../api/suborgApi";
import SubOrgListTable from "../components/SubOrgListTable";

const SubOrgListPage = () => {
  const [subOrgs, setSubOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubOrg, setSelectedSubOrg] = useState(null);

  const navigate = useNavigate();

  // current user
  let currentUser = null;
  try {
    const raw = localStorage.getItem("vp_user");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch {
    currentUser = null;
  }
  const isAdmin = currentUser?.role === "admin";

  const loadSubOrgs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchSubOrgs();
      setSubOrgs(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Unable to load sub-organizations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubOrgs();
  }, []);

  const handleChangeStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const ok = window.confirm(
      `Are you sure you want to set this sub-organization to "${nextStatus}"?`
    );
    if (!ok) return;

    try {
      await changeSubOrgStatus(id, nextStatus);
      await loadSubOrgs();
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Failed to update sub-organization status."
      );
    }
  };

  const handleView = (id) => {
    navigate(`/admin/suborgs/${id}`, { state: { mode: "view" } });
  };

  const handleEdit = (id) => {
    navigate(`/admin/suborgs/${id}/edit`);
  };

  const handleCreate = () => {
    navigate("/admin/suborgs/create");
  };

  const handleCreateWithAdmin = () => {
    navigate("/admin/suborgs/create-with-admin");
  };

  const filteredSubOrgs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subOrgs.filter((s) => {
      const matchesText =
        !term ||
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || s.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [subOrgs, search, statusFilter]);

  const handleRowClick = (subOrg) => {
    setSelectedSubOrg(subOrg);
  };

  return (
    <div className="nk-block">
      {/* HEADER */}
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between align-items-center">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title mb-1">
              Sub-Organizations
            </h3>
            <div className="nk-block-des text-soft">
              <p className="mb-0">
                Manage branches, departments and assigned admins.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="nk-block-head-content">
              <div className="nk-block-tools">
                <ul className="nk-block-tools g-2">
                  <li>
                    <button
                      type="button"
                      className="btn btn-outline-primary vp-suborg-header-btn"
                      onClick={handleCreate}
                    >
                      <Plus size={16} className="me-1" />
                      Create Sub-Org
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="btn btn-primary vp-suborg-header-btn-primary"
                      onClick={handleCreateWithAdmin}
                    >
                      <Plus size={16} className="me-1" />
                      Sub-Org + Admin
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* FILTER BAR */}
      <div className="nk-block mb-3">
        <div className="card card-bordered vp-suborg-filter-card">
          <div className="card-inner py-3">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-4 d-flex align-items-center gap-2">
                <div className="vp-filter-icon-wrap">
                  <Filter size={16} />
                </div>
                <div>
                  <div className="fw-semibold small">Filters</div>
                  <div className="text-soft small">
                    Search and filter by status.
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="col-12 col-md-5">
  <div className="position-relative">

    {/* Search Icon */}
    <span
      className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted"
    >
      <Search size={16} />
    </span>

    {/* Search Input */}
    <input
      type="text"
      className="form-control ps-5"  // ps-5 adds space between icon & placeholder
      placeholder="Search sub-org by name or code..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

  </div>
</div>


              {/* Status */}
              <div className="col-12 col-md-3">
                <select
                  className="form-select vp-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIST + DETAIL */}
      <div className="nk-block">
        <div className="row g-3">
          {/* TABLE */}
          <div className="col-xxl-8 col-lg-7">
            <div className="card card-bordered vp-suborg-card">
              <div className="card-inner">
                <SubOrgListTable
                  subOrgs={filteredSubOrgs}
                  loading={loading}
                  onView={handleView}
                  onEdit={isAdmin ? handleEdit : undefined}
                  onChangeStatus={isAdmin ? handleChangeStatus : undefined}
                  canManage={isAdmin}
                  onRowClick={handleRowClick}
                />
              </div>
            </div>
          </div>

          {/* DETAIL PANEL */}
          <div className="col-xxl-4 col-lg-5">
            <div className="card card-bordered vp-suborg-card h-100">
              <div className="card-inner h-100 d-flex flex-column">
                {!selectedSubOrg ? (
                  <div className="text-center text-soft py-5 small">
                    <Info className="mb-2 opacity-75" />
                    <p className="mb-0">
                      Click a sub-organization in the list to see details
                      here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1">{selectedSubOrg.name}</h5>
                          <div className="text-soft small">
                            {selectedSubOrg.description ||
                              "No description provided."}
                          </div>
                        </div>
                        <span
                          className={`badge ${
                            selectedSubOrg.status === "active"
                              ? "bg-success"
                              : "bg-danger"
                          } text-white`}
                        >
                          {selectedSubOrg.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="row g-2 small mb-3">
                      <div className="col-6">
                        <div className="border rounded-3 px-3 py-2">
                          <div className="text-soft text-uppercase fw-semibold mb-1">
                            Code
                          </div>
                          <div className="fw-semibold">
                            {selectedSubOrg.code || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="border rounded-3 px-3 py-2">
                          <div className="text-soft text-uppercase fw-semibold mb-1">
                            Users
                          </div>
                          <div className="fw-semibold d-flex align-items-center gap-1">
                            <Users size={16} />
                            {selectedSubOrg.userCount ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <button
                          type="button"
                          className="btn btn-outline-light btn-sm"
                          onClick={() =>
                            navigate(`/admin/suborgs/${selectedSubOrg.id}`, {
                              state: { mode: "view" },
                            })
                          }
                        >
                          View details
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-primary vp-suborg-header-btn p-2 d-flex align-items-center gap-1"
                          onClick={() =>
                            navigate(
                              `/admin/users?subOrgId=${selectedSubOrg.id}`,
                              {
                                state: {
                                  subOrgId: selectedSubOrg.id,
                                  subOrgName: selectedSubOrg.name,
                                },
                              }
                            )
                          }
                        >
                          View users in this sub-org
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubOrgListPage;

// src/features/subOrgManagement/components/SubOrgListTable.jsx
import React from "react";
import {
  MoreHorizontal,
  Eye,
  PencilLine,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const SubOrgListTable = ({
  subOrgs,
  loading,
  onView,
  onEdit,
  onChangeStatus,
  canManage,
  onRowClick,
}) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border border-primary border-2" />
        <div className="text-soft mt-2 small">
          Loading sub-organizations…
        </div>
      </div>
    );
  }

  if (!subOrgs || subOrgs.length === 0) {
    return (
      <div className="text-center py-4 text-soft">
        No sub-organizations found.
      </div>
    );
  }

  return (
    <div className="nk-tb-list nk-tb-ulist">
      {/* HEADER */}
      <div className="nk-tb-item nk-tb-head">
  <div className="nk-tb-col">
    <span className="sub-text">Name</span>
  </div>

  <div className="nk-tb-col tb-col-md">
    <span className="sub-text">Code</span>
  </div>

  <div className="nk-tb-col tb-col-md">
    <span className="sub-text">Status</span>
  </div>

  <div className="nk-tb-col tb-col-md">
    <span className="sub-text">Users</span>
  </div>

  <div className="nk-tb-col tb-col-md">
    <span className="sub-text">Created</span>
  </div>

  {canManage && (
    <div className="nk-tb-col nk-tb-col-tools vp-suborg-actions-col text-end">
      <span className="sub-text">Actions</span>
    </div>
  )}
</div>




      {/* ROWS */}
      {subOrgs.map((subOrg) => (
        <div
          key={subOrg.id}
          className="nk-tb-item nk-tb-row-clickable"
          onClick={() => onRowClick && onRowClick(subOrg)}
        >
          {/* Name */}
      
          <div className="nk-tb-col d-flex align-items-center">
            <div className="user-card">
              <div className="user-info">

                {/* Sub-org name aligned & balanced */}
                <span className="d-flex align-items-center gap-2 fw-medium fs-9 lh-sm mb-0">
                  {subOrg.name}

                  {/* Active status dot */}
                  {subOrg.status === "active" && (
                    <span className="dot dot-success" />
                  )}
                </span>

              </div>
            </div>
          </div>


          {/* Code */}
          <div className="nk-tb-col tb-col-md">
            <span className="tb-sub">
              {subOrg.code ? (
                <span className="badge bg-outline-primary">
                  {subOrg.code}
                </span>
              ) : (
                "—"
              )}
            </span>
          </div>

          {/* Status */}
          <div className="nk-tb-col tb-col-md">
            {subOrg.status === "active" ? (
              <span className="badge bg-success text-white">Active</span>
            ) : (
              <span className="badge bg-danger text-white">Inactive</span>
            )}
          </div>

          {/* Users */}
          <div className="nk-tb-col tb-col-md">
            <span className="tb-sub">{subOrg.userCount ?? 0}</span>
          </div>

          {/* Created */}
          <div className="nk-tb-col tb-col-md">
            <span className="tb-sub">{formatDate(subOrg.createdAt)}</span>
          </div>

          {/* ACTIONS – Lucide 3-dots with Bootstrap dropdown, hover open */}
          {canManage && (
            <div className="nk-tb-col nk-tb-col-tools vp-suborg-actions-col">
              <div className="dropdown vp-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-icon btn-trigger vp-kebab-btn"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => e.stopPropagation()} // prevent row click
                >
                  <MoreHorizontal size={18} />
                </button>

                <div className="dropdown-menu dropdown-menu-end vp-actions-menu">
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView && onView(subOrg.id);
                    }}
                  >
                    <Eye size={16} />
                    <span>View details</span>
                  </button>

                  {onEdit && (
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(subOrg.id);
                      }}
                    >
                      <PencilLine size={16} />
                      <span>Edit sub-org</span>
                    </button>
                  )}

                  {onChangeStatus && (
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeStatus(subOrg.id, subOrg.status);
                      }}
                    >
                      {subOrg.status === "active" ? (
                        <ToggleLeft size={16} />
                      ) : (
                        <ToggleRight size={16} />
                      )}
                      <span>
                        {subOrg.status === "active"
                          ? "Set inactive"
                          : "Set active"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SubOrgListTable;

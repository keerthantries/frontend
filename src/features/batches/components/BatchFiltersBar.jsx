// src/features/batches/components/BatchFiltersBar.jsx
import React from "react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const MODE_OPTIONS = [
  { value: "", label: "All Modes" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const BatchFiltersBar = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  mode,
  onModeChange,
  courseQuery,
  onCourseQueryChange,
  onCreateClick,
}) => {
  return (
    <div className="nk-block-between mb-3">
      <div className="nk-block-head-content">
        <h3 className="nk-block-title page-title">Batches</h3>
        <div className="nk-block-des text-soft">
          <p>Manage batches, enroll learners, and monitor attendance.</p>
        </div>
      </div>
      <div className="nk-block-head-content">
        <div className="nk-block-tools">
          <div className="form-inline flex-nowrap gap-2">
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: 200 }}
              placeholder="Search by batch / course"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <select
              className="form-select"
              style={{ maxWidth: 150 }}
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              style={{ maxWidth: 150 }}
              value={mode}
              onChange={(e) => onModeChange(e.target.value)}
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: 200 }}
              placeholder="Filter by course name"
              value={courseQuery}
              onChange={(e) => onCourseQueryChange(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={onCreateClick}
            >
              <em className="icon ni ni-plus" />
              <span className="ms-1">Create Batch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchFiltersBar;
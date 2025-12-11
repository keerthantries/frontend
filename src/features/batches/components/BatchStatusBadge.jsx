// src/features/batches/components/BatchStatusBadge.jsx
import React from "react";

const STATUS_CLASS_MAP = {
  draft: "badge-dim bg-secondary",
  published: "badge-dim bg-success",
  ongoing: "badge-dim bg-info",
  completed: "badge-dim bg-primary",
  cancelled: "badge-dim bg-danger",
};

const BatchStatusBadge = ({ status }) => {
  if (!status) return <span className="badge badge-dim bg-secondary">Draft</span>;
  const key = status.toLowerCase();
  const cls = STATUS_CLASS_MAP[key] || "badge-dim bg-secondary";
  return (
    <span className={`badge text-capitalize ${cls}`}>
      {status}
    </span>
  );
};

export default BatchStatusBadge;
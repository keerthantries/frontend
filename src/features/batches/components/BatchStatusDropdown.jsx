import React from "react";

export default function BatchStatusDropdown({ status, onChange }) {
  return (
    <select
      className="form-select form-select-sm"
      value={status}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="draft">Draft</option>
      <option value="published">Published</option>
      <option value="ongoing">Ongoing</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

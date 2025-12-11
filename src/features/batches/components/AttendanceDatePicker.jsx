// src/features/batches/components/AttendanceDatePicker.jsx
import React from "react";

const AttendanceDatePicker = ({ date, onChange }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <label className="form-label mb-0">Date</label>
      <input
        type="date"
        className="form-control"
        style={{ maxWidth: 200 }}
        value={date}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default AttendanceDatePicker;
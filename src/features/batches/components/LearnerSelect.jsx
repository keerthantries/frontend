// src/features/batches/components/LearnerSelect.jsx
import React, { useEffect, useState } from "react";
import httpClient from "../../../services/httpClient";

/**
 * Uses existing API:
 * GET /api/admin/users?role=learner&q=
 */
const LearnerSelect = ({ multiple = false, value, onChange }) => {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedIds = multiple ? value || [] : value ? [value] : [];

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await httpClient.get("/api/admin/users", {
          params: {
            role: "learner",
            q: query || undefined,
            limit: 10,
          },
        });
        if (ignore) return;

        const body = res?.data;
        const items = body?.data?.items || body?.items || body || [];
        setOptions(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("LearnerSelect fetch error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [query]);

  const toggleSelect = (id) => {
    if (multiple) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((x) => x !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    } else {
      onChange(id);
    }
  };

  return (
    <div>
      <div className="form-control-wrap mb-1">
        <input
          type="text"
          className="form-control"
          placeholder="Search learner by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div
        className="border rounded p-2"
        style={{ maxHeight: 200, overflowY: "auto" }}
      >
        {loading && <div className="small text-muted">Loading learners…</div>}
        {!loading && options.length === 0 && (
          <div className="small text-muted">No learners found.</div>
        )}
        {!loading &&
          options.map((u) => {
            const id = u.id || u._id;
            const isSelected = selectedIds.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`w-100 d-flex justify-content-between align-items-center mb-1 btn btn-sm ${
                  isSelected ? "btn-primary" : "btn-outline-light"
                }`}
                onClick={() => toggleSelect(id)}
              >
                <span className="text-start">
                  {u.name || "Unnamed"}{" "}
                  <span className="text-soft small">
                    ({u.email || "no-email"})
                  </span>
                </span>
                {isSelected && <em className="icon ni ni-check" />}
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default LearnerSelect;
// src/features/Courses/CourseCategoriesPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCourses } from "./api/coursesApi";
import { FiMoreHorizontal } from "react-icons/fi";

/**
 * Course Categories Page
 * - Fix: Added stopPropagation to Edit/Delete actions to prevent navigation.
 * - Fix: Updated logic to allow renaming/hiding of API-derived categories.
 */

/* Avatar background classes */
const AVATAR_BG_CLASSES = [
  "bg-purple",
  "bg-warning",
  "bg-info",
  "bg-success",
  "bg-danger",
  "bg-primary",
  "bg-secondary",
];

const CATEGORY_LABELS = {
  fullstack: "Full Stack Development",
  frontend: "Frontend Development",
  backend: "Backend Development",
  mobile: "Mobile Development",
  testing: "Test Automation",
  cybersecurity: "Cyber Security",
  ai: "AI / ML",
  others: "Others",
};

const pickAvatarClass = (key) => {
  if (!key) return AVATAR_BG_CLASSES[0];
  const hash = Array.from(String(key)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_BG_CLASSES[hash % AVATAR_BG_CLASSES.length];
};

const niceLabel = (cat) => {
  if (!cat) return "-";
  const lower = String(cat).toLowerCase();
  if (CATEGORY_LABELS[lower]) return CATEGORY_LABELS[lower];
  return cat
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/* Single category card */
const CategoryCard = ({ name, displayLabel, count, examples = [], onEdit, onDelete, onClick }) => {
  const initials = (displayLabel || name || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarClass = pickAvatarClass(name);

  return (
    <div className="col-sm-6 col-lg-4 col-xxl-3">
      <div 
        className="card h-100 vp-suborg-card" 
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="d-flex align-items-center">
              <div className={`user-avatar sq ${avatarClass}`}>
                <span>{initials}</span>
              </div>

              <div className="ms-3">
                <h6 className="title mb-1">{displayLabel}</h6>
                <span className="sub-text">{count} Course{count !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="drodown" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-sm btn-icon vp-kebab-btn"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FiMoreHorizontal />
              </button>

              <div className="dropdown-menu dropdown-menu-end vp-actions-menu">
                <ul className="link-list-opt no-bdr">
                  <li>
                    <button 
                      className="dropdown-item" 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        e.preventDefault();
                        if (onEdit) onEdit(name);
                      }}
                    >
                      Edit Category
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        e.preventDefault();
                        if (onDelete) onDelete(name);
                      }}
                    >
                      Delete Category
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <ul className="d-flex flex-wrap g-1">
            {examples.slice(0, 6).map((tag, idx) => (
              <li key={idx}>
                <span className="vp-tag-pill">
                  {tag}
                </span>
              </li>
            ))}
            {examples.length === 0 && (
              <li>
                <span className="text-soft small">No tags</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

const CourseCategoriesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Local state for UI overrides
  const [localCategories, setLocalCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchCourses({ page: 1, limit: 1000 });
      const items = result?.items ?? result?.data ?? result ?? [];
      setCourses(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to load courses for categories:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    const handler = () => loadCourses();
    window.addEventListener("course:updated", handler);
    return () => window.removeEventListener("course:updated", handler);
  }, [loadCourses]);

  // Derive categories map
  const categories = useMemo(() => {
    const map = new Map();

    // 1. Helper to record categories from API
    const record = (keyRaw, labelRaw, course) => {
      if (!keyRaw && !labelRaw) return;
      const key = String(keyRaw || labelRaw).trim();
      
      // Skip if hidden
      if (hiddenCategories.has(key)) return;

      const label = labelRaw || niceLabel(key);
      const entry = map.get(key) || { key, label, count: 0, examples: new Set() };
      entry.count++;
      
      const tags = course?.tags ?? [];
      if (Array.isArray(tags)) {
        tags.slice(0, 6).forEach((t) => t && entry.examples.add(t));
      } else if (typeof tags === "string" && tags.trim()) {
        tags.split(",").map((s) => s.trim()).slice(0, 6).forEach((t) => t && entry.examples.add(t));
      } else {
        if (entry.examples.size === 0) entry.examples.add(`${label.split(" ")[0].toLowerCase()}-basics`);
      }
      map.set(key, entry);
    };

    // 2. Process courses
    courses.forEach((c) => {
      const cat = c.category;
      const custom = c.customCategory || c.customCategoryName || null;

      if (cat && String(cat).toLowerCase() !== "others") {
        record(cat, CATEGORY_LABELS[String(cat).toLowerCase()] || null, c);
      } else if (custom) {
        record(custom, custom, c);
      } else if (cat && String(cat).toLowerCase() === "others") {
        record("others", CATEGORY_LABELS["others"], c);
      }
    });

    // 3. Apply Local Additions & Overrides
    localCategories.forEach((lc) => {
      if (hiddenCategories.has(lc.key)) return;

      if (map.has(lc.key)) {
        // Override label if it exists from API
        const entry = map.get(lc.key);
        entry.label = lc.label; 
      } else {
        // Add new local category
        map.set(lc.key, { key: lc.key, label: lc.label, count: 0, examples: new Set(lc.examples || []) });
      }
    });

    const out = Array.from(map.values()).map((v) => ({
      key: v.key,
      label: v.label,
      count: v.count,
      examples: Array.from(v.examples),
    }));

    out.sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));
    return out;
  }, [courses, localCategories, hiddenCategories]);

  // --- Handlers ---
  const handleCardClick = (catKey) => {
    navigate("/admin/courses", { state: { category: catKey } });
  };

  const handleAddCategory = () => {
    const name = window.prompt("Add category name (e.g. Data Engineering)");
    if (!name || !name.trim()) return;
    const key = name.trim();
    // Add to local categories
    setLocalCategories((prev) => [...prev, { key, label: name.trim(), examples: [] }]);
    // Ensure it's not hidden
    setHiddenCategories((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
    });
  };

  const handleEditCategory = (key) => {
    const existing = categories.find((c) => c.key === key) || {};
    const newLabel = window.prompt("Edit category label", existing.label || key);
    if (!newLabel || !newLabel.trim()) return;

    setLocalCategories((prev) => {
      const idx = prev.findIndex((p) => p.key === key);
      if (idx >= 0) {
        // Update existing local override
        const updated = [...prev];
        updated[idx] = { ...updated[idx], label: newLabel };
        return updated;
      }
      // Create new override
      return [...prev, { key, label: newLabel, examples: [] }];
    });
  };

  const handleDeleteCategory = (key) => {
    const ok = window.confirm(
      "Hide this category from view? Note: This only hides it from this dashboard."
    );
    if (!ok) return;

    // 1. Hide it from the view
    setHiddenCategories((prev) => new Set(prev).add(key));
    
    // 2. Remove any local definition
    setLocalCategories((prev) => prev.filter((p) => p.key !== key));
  };

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">Course Category</h3>
                <div className="nk-block-des text-soft">
                  <p>You have total {categories.length} Categories</p>
                </div>
              </div>

              <div className="nk-block-head-content">
                <div className="toggle-wrap nk-block-tools-toggle">
                  <button className="btn btn-primary" onClick={handleAddCategory}>
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="nk-block">
            {loading ? (
              <div className="card card-bordered vp-suborg-card">
                <div className="card-inner">
                  <div>Loading categories…</div>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : categories.length === 0 ? (
              <div className="card card-bordered vp-suborg-card">
                <div className="card-inner text-center text-muted py-4">
                  No categories found. Create a course and select a category to populate this page.
                </div>
              </div>
            ) : (
              <div className="row g-gs">
                {categories.map((cat) => (
                  <CategoryCard
                    key={cat.key}
                    name={cat.key}
                    displayLabel={cat.label || niceLabel(cat.key)}
                    count={cat.count}
                    examples={cat.examples}
                    onClick={() => handleCardClick(cat.key)}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCategoriesPage;
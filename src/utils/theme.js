// src/utils/theme.js

const DEFAULT_PRIMARY = "#0a0475";
const DEFAULT_SECONDARY = "#6c757d";

// small helper: "#RRGGBB" -> "r, g, b"
function hexToRgb(hex) {
  if (!hex) return null;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return `${r}, ${g}, ${b}`;
}

/**
 * Apply theme:
 *  - mode: "light" | "dark" (optional)
 *  - primary: hex string like "#1363DF" (optional)
 *  - secondary: hex string like "#F97316" (optional)
 *
 * This assumes your CSS uses:
 *   --vp-primary, --vp-secondary, [data-bs-theme=light/dark], etc.
 */
export function applyTheme({ mode, primary, secondary } = {}) {
  const root = document.documentElement;

  // 1) Mode
  if (mode === "light" || mode === "dark") {
    root.setAttribute("data-bs-theme", mode);
    try {
      localStorage.setItem("vp_theme_mode", mode);
    } catch (e) {
      // ignore
    }
  }

  // 2) Primary color
  if (primary) {
    root.style.setProperty("--vp-primary", primary);
    root.style.setProperty("--bs-primary", primary);

    const rgb = hexToRgb(primary);
    if (rgb) {
      root.style.setProperty("--bs-primary-rgb", rgb);
    }

    try {
      localStorage.setItem("vp_primary", primary);
    } catch (e) {
      // ignore
    }
  }

  // 3) Secondary color
  if (secondary) {
    root.style.setProperty("--vp-secondary", secondary);
    root.style.setProperty("--bs-secondary", secondary);

    try {
      localStorage.setItem("vp_secondary", secondary);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Call this ONCE when the app boots (e.g. in main.jsx)
 * to restore theme from localStorage.
 */
export function initThemeFromStorage() {
  let mode = "light";
  let primary = DEFAULT_PRIMARY;
  let secondary = DEFAULT_SECONDARY;

  try {
    const storedMode = localStorage.getItem("vp_theme_mode");
    if (storedMode === "light" || storedMode === "dark") {
      mode = storedMode;
    }

    primary = localStorage.getItem("vp_primary") || DEFAULT_PRIMARY;
    secondary = localStorage.getItem("vp_secondary") || DEFAULT_SECONDARY;
  } catch (e) {
    // ignore storage errors, fall back to defaults
  }

  applyTheme({ mode, primary, secondary });
}

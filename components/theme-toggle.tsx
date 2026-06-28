"use client";

import { Moon, Sun } from "./icons";

const STORAGE_KEY = "kp-theme";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore storage failures */
  }
}

/**
 * Light/dark toggle. The CSS (.theme-toggle) swaps the moon/sun glyphs based on
 * the current data-theme, so we render both. `fab` positions it fixed for the
 * auth screens.
 */
export function ThemeToggle({ fab = false }: { fab?: boolean }) {
  return (
    <button
      type="button"
      className={`icon-btn theme-toggle${fab ? " theme-toggle-fab" : ""}`}
      data-theme-toggle
      aria-label="Ganti tema"
      onClick={toggleTheme}
    >
      <Moon className="moon" />
      <Sun className="sun" />
    </button>
  );
}

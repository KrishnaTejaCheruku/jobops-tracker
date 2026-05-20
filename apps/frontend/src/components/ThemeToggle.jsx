import React from "react";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-toggle-icon">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

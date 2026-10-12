"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "gastos-tema";

export function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "dark" ? "#100e0c" : "#f6f1e8");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* el modo igual cambia en esta visita */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex rounded-full border border-line bg-card p-1 shadow-[var(--shadow)]" role="group" aria-label="Apariencia">
      {(
        [
          ["light", "Claro"],
          ["dark", "Oscuro"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => choose(value)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            theme === value ? "bg-ink text-paper" : "text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

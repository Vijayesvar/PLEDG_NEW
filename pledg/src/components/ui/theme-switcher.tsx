"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

const themes = [
  { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "System", icon: <Laptop className="w-4 h-4" /> },
];

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "system") {
      const systemTheme = getSystemTheme();
      if (systemTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen to system theme changes if "system" is selected
  useEffect(() => {
    if (theme !== "system") return;
    const handler = () => {
      const systemTheme = getSystemTheme();
      const root = window.document.documentElement;
      if (systemTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handler);
    return () => {
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", handler);
    };
  }, [theme]);

  return (
    <div className="flex items-center gap-2 bg-[var(--secondary)] border border-[var(--border)] rounded-full px-2 py-1">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors duration-150 text-xs font-medium
            ${theme === t.value ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--field)] text-[var(--subtext)]"}
          `}
          aria-label={t.label}
          onClick={() => setTheme(t.value)}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
} 
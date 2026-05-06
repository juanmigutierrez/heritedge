import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";
const STORAGE_KEY = "heritedge.theme";

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* localStorage blocked */
  }
  return "auto";
}

function applyToRoot(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

/**
 * Persisted theme mode. "auto" follows the OS via prefers-color-scheme.
 * Returns the *effective* mode (resolved against the OS) for UI labels.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => readStored());
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Watch system preference so "auto" stays accurate without a reload.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Apply on every change.
  useEffect(() => {
    applyToRoot(mode);
    try {
      if (mode === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const isDark = mode === "dark" || (mode === "auto" && systemDark);

  const toggle = useCallback(() => {
    // One-tap behaviour: flip between light and dark; "auto" resolves first.
    setMode(isDark ? "light" : "dark");
  }, [isDark]);

  const setLight = useCallback(() => setMode("light"), []);
  const setDark = useCallback(() => setMode("dark"), []);
  const setAuto = useCallback(() => setMode("auto"), []);

  return { mode, isDark, toggle, setLight, setDark, setAuto };
}

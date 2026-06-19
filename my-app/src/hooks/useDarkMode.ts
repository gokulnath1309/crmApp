import { useState, useEffect, useCallback } from "react";

export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("crm_pro_theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("crm_pro_theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = useCallback(() => setDark((prev) => !prev), []);

  return [dark, toggle];
}

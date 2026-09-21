import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "theme_pref";

function detectDefaultTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  // No stored preference: follow the OS color scheme.
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage === "undefined") return "dark";
    return localStorage.getItem(STORAGE_KEY) || detectDefaultTheme();
  });

  const [hasStoredPref] = useState(
    () => typeof localStorage !== "undefined" && Boolean(localStorage.getItem(STORAGE_KEY))
  );

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Until the user picks a theme manually, keep following the OS setting live.
  useEffect(() => {
    if (hasStoredPref || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [hasStoredPref]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "theme_pref";

function detectDefaultTheme() {
  if (typeof navigator === "undefined") return "dark";
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return isIOS ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage === "undefined") return "dark";
    return localStorage.getItem(STORAGE_KEY) || detectDefaultTheme();
  });

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

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
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "theme";
const ACCENT_KEY = "accentColor";

const accentColors = {
  teal: "15 139 141",
  blue: "37 99 235",
  green: "5 150 105",
  purple: "124 58 237",
  red: "220 38 38",
  orange: "234 88 12"
};

function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : "light";
}

function getStoredAccent() {
  if (typeof window === "undefined") return "teal";
  const stored = window.localStorage.getItem(ACCENT_KEY);
  return accentColors[stored] ? stored : "teal";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [accentColor, setAccentColorState] = useState(getStoredAccent);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-accent", accentColors[accentColor]);
    window.localStorage.setItem(ACCENT_KEY, accentColor);
  }, [accentColor]);

  const value = useMemo(
    () => ({
      theme,
      accentColor,
      accentColors: Object.keys(accentColors),
      setTheme: (nextTheme) => setThemeState(nextTheme === "dark" ? "dark" : "light"),
      toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
      setAccentColor: (nextColor) => {
        if (accentColors[nextColor]) setAccentColorState(nextColor);
      }
    }),
    [theme, accentColor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return context;
}

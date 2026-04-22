import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "calm" | "dark-premium" | "royal" | "midnight";

export interface ThemeMeta {
  id: Theme;
  name: string;
  tagline: string;
  swatches: [string, string, string]; // bg, accent, primary (hex preview only)
  isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "calm",
    name: "Calm",
    tagline: "Olive & cream — quiet focus",
    swatches: ["#efeadc", "#7a8559", "#3f4a2d"],
    isDark: false,
  },
  {
    id: "dark-premium",
    name: "Dark Premium",
    tagline: "Black & antique gold",
    swatches: ["#0d0c0a", "#c9a14a", "#e8c878"],
    isDark: true,
  },
  {
    id: "royal",
    name: "Royal",
    tagline: "Burgundy & soft champagne",
    swatches: ["#1a0f12", "#7a2230", "#d6b46a"],
    isDark: true,
  },
  {
    id: "midnight",
    name: "Midnight",
    tagline: "Modern blue — late-night clarity",
    swatches: ["#0b1220", "#1e3a5f", "#7aa6d6"],
    isDark: true,
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void; // back-compat: cycles light↔dark-premium
  themes: ThemeMeta[];
  meta: ThemeMeta;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "visu-theme";

const isValidTheme = (v: unknown): v is Theme =>
  typeof v === "string" && THEMES.some((t) => t.id === v);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "calm";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
    // legacy migration
    if (stored === "dark") return "dark-premium";
    if (stored === "light") return "calm";
    return "calm";
  });

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
    // keep legacy `.dark` class for any third-party reliance
    const meta = THEMES.find((t) => t.id === theme)!;
    root.classList.toggle("dark", meta.isDark);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () =>
    setThemeState((t) => (t === "calm" ? "dark-premium" : "calm"));

  const meta = THEMES.find((t) => t.id === theme)!;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themes: THEMES, meta }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

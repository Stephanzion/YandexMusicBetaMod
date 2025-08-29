import { createContext, ReactNode, use, useEffect, useState } from "react";

type ThemeType = {
  theme: string;
  setTheme: (theme: string) => void;
};

export const ThemeContext = createContext<ThemeType | null>(null);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "shadcn-ui-theme",
}: {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) ?? defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext
      value={{
        theme,
        setTheme: (theme: string) => {
          localStorage.setItem(storageKey, theme);
          setTheme(theme);
        },
      }}
    >
      {children}
    </ThemeContext>
  );
}

export function useTheme(): ThemeType {
  const context = use(ThemeContext);

  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

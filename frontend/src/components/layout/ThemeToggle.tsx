"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-300 dark:border-slate-700" />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Current: ${theme || "system"} (Click to cycle Light / Dark / System)`}
      aria-label="Toggle theme"
      className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {theme === "light" && <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200" />}
      {theme === "dark" && <Moon className="h-4 w-4 text-blue-400 transition-transform duration-200" />}
      {(theme === "system" || !theme) && (
        <Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200" />
      )}
    </button>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  isThemePreference,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "./constants";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";
const PREFERENCE_EVENT = "lemma-theme-preference";

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function apply(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Colour transitions are pleasant on hover, but animating every token at once during
  // a theme swap looks like a fault. Disable transitions for one frame.
  root.setAttribute("data-theme-switching", "");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => root.removeAttribute("data-theme-switching"));
  });
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribePreference(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFERENCE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFERENCE_EVENT, onChange);
  };
}

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Preference and system theme are external stores so hydration does not need a
  // setState-in-effect to catch up with the blocking ThemeScript.
  const preference = useSyncExternalStore(
    subscribePreference,
    readStoredPreference,
    () => "system" as const,
  );
  const system = useSyncExternalStore(
    subscribeSystemTheme,
    systemTheme,
    () => "light" as const,
  );

  const resolved: ResolvedTheme = preference === "system" ? system : preference;

  useEffect(() => {
    apply(resolved);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private-browsing modes can reject writes. The theme still applies for this
      // session via the document attribute; only persistence is lost.
    }
    window.dispatchEvent(new Event(PREFERENCE_EVENT));
    apply(next === "system" ? systemTheme() : next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}

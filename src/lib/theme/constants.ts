export const THEME_STORAGE_KEY = "lemma-theme";

/** What the reader chose. `system` defers to the OS setting and keeps tracking it. */
export type ThemePreference = "light" | "dark" | "system";

/** What is actually painted. Always concrete. */
export type ResolvedTheme = "light" | "dark";

export const THEME_PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

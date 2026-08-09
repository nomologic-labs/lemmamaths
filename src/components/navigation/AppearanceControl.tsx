"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/theme/constants";
import { MoonIcon, SunIcon, SystemIcon } from "@/components/ui/icons";
import styles from "./AppearanceControl.module.css";

const OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  Icon: typeof SunIcon;
}[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: SystemIcon },
];

/**
 * Three explicit choices rather than a two-state toggle. A toggle cannot express
 * "follow my device", which is the setting most readers actually want, and it also
 * cannot show which of the two a reader is currently in without ambiguity.
 */
export function AppearanceControl() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div className={styles.control}>
      <div className={styles.options} role="radiogroup" aria-label="Appearance">
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              className={[styles.option, active ? styles.optionActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setPreference(value)}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>
      <p className={styles.resolved} aria-live="polite">
        {preference === "system"
          ? `Following your device — currently ${resolved}.`
          : `Saved for this browser.`}
      </p>
    </div>
  );
}

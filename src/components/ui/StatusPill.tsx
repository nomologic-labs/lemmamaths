import type { ReactNode } from "react";
import styles from "./StatusPill.module.css";

export type StatusPillProps = {
  children: ReactNode;
  /** `accent` marks the state of the record on screen; `default` marks a row in a list. */
  tone?: "default" | "accent";
  className?: string;
};

/** Presentation only: the caller decides what the state is and what it is called. */
export function StatusPill({ children, tone = "default", className }: StatusPillProps) {
  return (
    <span
      className={[styles.pill, tone === "accent" ? styles.accent : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

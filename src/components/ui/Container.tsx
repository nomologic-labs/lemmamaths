import type { ElementType, ReactNode } from "react";
import styles from "./Container.module.css";

export type ContainerProps = {
  children: ReactNode;
  /** `wide` for grids and sections, `narrow` for headers, `prose` for reading. */
  width?: "wide" | "narrow" | "prose";
  as?: ElementType;
  className?: string;
  id?: string;
};

/** The single source of the page gutter, so every section lines up down the page. */
export function Container({
  children,
  width = "wide",
  as: Tag = "div",
  className,
  id,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={[styles.container, styles[width], className].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "./icons";
import styles from "./SectionHeading.module.css";

export type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className={styles.heading}>
      <div className={styles.text}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <Tag id={id} className={styles.title}>
          {title}
        </Tag>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className={styles.action}>
          {action.label}
          <ArrowRightIcon size={15} />
        </Link>
      )}
    </div>
  );
}

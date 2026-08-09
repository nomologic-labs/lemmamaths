import type { ReactNode } from "react";
import { Container } from "./Container";
import styles from "./PageHeader.module.css";

export type PageHeaderProps = {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  /** Rendered under the lede: result counts, a topic's article total, and so on. */
  aside?: ReactNode;
};

export function PageHeader({ eyebrow, title, lede, aside }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {(lede || aside) && (
          <div>
            {lede && <p className={styles.lede}>{lede}</p>}
            {aside}
          </div>
        )}
      </Container>
    </header>
  );
}

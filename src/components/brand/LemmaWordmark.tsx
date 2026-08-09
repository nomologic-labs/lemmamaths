import { LemmaLogo } from "./LemmaLogo";
import styles from "./LemmaWordmark.module.css";

const LOGO_SIZE = { sm: 30, md: 38, lg: 64 } as const;

export type LemmaWordmarkProps = {
  size?: keyof typeof LOGO_SIZE;
  /** Small caps line beneath the name, e.g. the section of the site. */
  tagline?: string;
  className?: string;
};

/**
 * The mark and the name set together. The logo is marked decorative here because the
 * word "Lemma" is already present as text; announcing both would repeat it.
 */
export function LemmaWordmark({ size = "md", tagline, className }: LemmaWordmarkProps) {
  return (
    <span className={[styles.lockup, styles[size], className].filter(Boolean).join(" ")}>
      <LemmaLogo size={LOGO_SIZE[size]} />
      <span className={styles.text}>
        <span className={styles.name}>Lemma</span>
        {tagline && <span className={styles.tagline}>{tagline}</span>}
      </span>
    </span>
  );
}

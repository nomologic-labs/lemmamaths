import type { CSSProperties } from "react";
import { LemmaLogo } from "@/components/brand/LemmaLogo";
import styles from "./Hero.module.css";

const delay = (ms: number) => ({ "--enter-delay": `${ms}ms` }) as CSSProperties;

/**
 * The first screen. Deliberately holds only the mark, the name, the motto and a way
 * down — no articles, no navigation beyond the fixed header. Everything else on the
 * homepage arrives on scroll.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-name">
      <div className={styles.backdrop} aria-hidden="true" />

      <div className={styles.content}>
        <div className={[styles.mark, styles.enter].join(" ")} style={delay(0)}>
          <LemmaLogo size={96} />
        </div>

        <h1 id="hero-name" className={[styles.name, styles.enter].join(" ")} style={delay(140)}>
          Lemma
        </h1>

        <div className={[styles.rule, styles.enter].join(" ")} style={delay(300)} aria-hidden="true" />

        <p className={[styles.motto, styles.enter].join(" ")} style={delay(380)}>
          Mathematics, written by the people still learning it.
        </p>

        <p className={[styles.sub, styles.enter].join(" ")} style={delay(560)}>
          A student journal &amp; archive
        </p>
      </div>

      <a href="#recent" className={styles.cue}>
        <span className={styles.cueTrack} aria-hidden="true" />
        Scroll
      </a>
    </section>
  );
}

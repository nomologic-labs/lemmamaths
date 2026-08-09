import { renderDisplayMath, renderInlineMath } from "@/lib/math/render";
import styles from "./Math.module.css";

/*
 * Server components. KaTeX runs during the render pass and the resulting markup is
 * injected directly, which is safe here because we generated it ourselves from the TeX
 * source with `trust: false` — see src/lib/math/render.ts. No author-supplied HTML ever
 * reaches these components.
 */

export function InlineMath({ tex, className }: { tex: string; className?: string }) {
  return (
    <span
      className={[styles.inline, className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: renderInlineMath(tex) }}
    />
  );
}

export function DisplayMath({ tex, tag }: { tex: string; tag?: string }) {
  const rendered = <div dangerouslySetInnerHTML={{ __html: renderDisplayMath(tex) }} />;

  if (!tag) {
    return <div className={styles.display}>{rendered}</div>;
  }

  return (
    <div className={[styles.display, styles.tagged].join(" ")}>
      <div className={styles.displayBody}>{rendered}</div>
      <span className={styles.tag} aria-label={`Equation ${tag}`}>
        ({tag})
      </span>
    </div>
  );
}

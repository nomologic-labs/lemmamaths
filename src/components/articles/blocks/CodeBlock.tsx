import { highlightCode } from "@/lib/code/highlight";
import { CopyButton } from "./CopyButton";
import styles from "./CodeBlock.module.css";

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  py: "Python",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  bash: "Shell",
  sh: "Shell",
  shell: "Shell",
  c: "C",
  json: "JSON",
};

/**
 * A server component: Shiki runs during the render pass and only its HTML is sent. The
 * markup is safe to inject because we produced it from the article's own code string —
 * no author-supplied HTML is involved.
 */
export async function CodeBlock({
  code,
  language,
  caption,
}: {
  code: string;
  language: string;
  caption?: string;
}) {
  const html = await highlightCode(code, language);
  const label = LANGUAGE_LABELS[language.toLowerCase()] ?? language;

  return (
    <figure className={styles.block}>
      <div className={styles.head}>
        <span className={styles.language}>{label}</span>
        <CopyButton code={code} label={label} />
      </div>
      <div className={styles.scroll} dangerouslySetInnerHTML={{ __html: html }} />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

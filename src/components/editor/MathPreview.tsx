"use client";

import katex from "katex";
import { useMemo } from "react";
import styles from "./MathPreview.module.css";
import "katex/dist/katex.min.css";

const OPTIONS: katex.KatexOptions = {
  throwOnError: false,
  errorColor: "#b3261e",
  trust: false,
  strict: false,
  output: "html",
};

type MathPreviewProps = {
  tex: string;
  display?: boolean;
};

export function MathPreview({ tex, display = true }: MathPreviewProps) {
  const { html, error } = useMemo(() => {
    if (!tex.trim()) {
      return { html: "", error: null as string | null };
    }
    try {
      const rendered = katex.renderToString(tex, {
        ...OPTIONS,
        displayMode: display,
      });
      const hasError = rendered.includes('class="katex-error"');
      return {
        html: rendered,
        error: hasError ? "KaTeX could not parse this expression." : null,
      };
    } catch {
      return { html: "", error: "KaTeX could not parse this expression." };
    }
  }, [tex, display]);

  return (
    <div className={styles.wrap}>
      {html ? (
        <div
          className={display ? styles.display : styles.inline}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className={styles.placeholder}>Enter LaTeX to see a preview.</p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

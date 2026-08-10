import Link from "next/link";
import type { InlineNode } from "@/data/types";
import { isSafeHref } from "@/lib/articles/url-policy";
import { InlineMath } from "@/components/ui/Math";
import styles from "./Inline.module.css";

/**
 * Renders a run of inline content.
 *
 * The node union in src/data/types.ts is closed, so this switch is exhaustive and there
 * is no path by which author-supplied content becomes markup. Links are re-checked with
 * `isSafeHref` so unsafe stored values never become clickable URLs.
 */
export function Inline({ nodes }: { nodes: readonly InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        <InlineOne key={index} node={node} />
      ))}
    </>
  );
}

function InlineOne({ node }: { node: InlineNode }) {
  if (typeof node === "string") return <>{node}</>;

  switch (node.kind) {
    case "math":
      return <InlineMath tex={node.tex} />;
    case "emphasis":
      return (
        <em>
          <Inline nodes={node.content} />
        </em>
      );
    case "strong":
      return (
        <strong>
          <Inline nodes={node.content} />
        </strong>
      );
    case "code":
      return <code className={styles.code}>{node.text}</code>;
    case "link": {
      if (!isSafeHref(node.href)) {
        return (
          <span className={styles.link}>
            <Inline nodes={node.content} />
          </span>
        );
      }

      const external = /^https?:\/\//i.test(node.href);
      if (external) {
        return (
          <a className={styles.link} href={node.href} rel="noreferrer noopener">
            <Inline nodes={node.content} />
          </a>
        );
      }
      return (
        <Link className={styles.link} href={node.href}>
          <Inline nodes={node.content} />
        </Link>
      );
    }
  }
}

import Link from "next/link";
import type { InlineNode } from "@/data/types";
import { InlineMath } from "@/components/ui/Math";
import styles from "./Inline.module.css";

/**
 * Renders a run of inline content.
 *
 * The node union in src/data/types.ts is closed, so this switch is exhaustive and there
 * is no path by which author-supplied content becomes markup. Links are the one node
 * carrying a URL, and external ones are marked as such rather than silently opening a
 * new tab.
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
      const external = /^https?:\/\//.test(node.href);
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

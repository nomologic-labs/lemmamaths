import type { ArticleBlock, InlineNode } from "@/data/types";

function inlineText(nodes: readonly InlineNode[]): string {
  return nodes
    .map((node) => {
      if (typeof node === "string") return node;
      if (node.kind === "math") return " ";
      if (node.kind === "code") return node.text;
      if (node.kind === "link" || node.kind === "emphasis" || node.kind === "strong") {
        return inlineText(node.content);
      }
      return "";
    })
    .join("");
}

function blockText(block: ArticleBlock): string {
  switch (block.kind) {
    case "heading":
      return block.text;
    case "paragraph":
      return inlineText(block.content);
    case "math":
      return " ";
    case "statement":
    case "proof":
      return block.content.map(blockText).join(" ");
    case "list":
      return block.items.map((item) => inlineText(item)).join(" ");
    case "figure":
      return block.alt;
    case "code":
      return block.code;
    case "quote":
      return inlineText(block.content);
  }
}

/** Rough reading time from block text; used for draft metadata. */
export function estimateReadingMinutes(blocks: readonly ArticleBlock[]): number {
  const words = blocks
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

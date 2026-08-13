import type { ArticleBlock } from "@/data/types";

/** Human names for block kinds, used by the editor and the review workspace. */
export const BLOCK_KIND_LABELS: Record<ArticleBlock["kind"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  math: "Equation",
  statement: "Statement",
  proof: "Proof",
  list: "List",
  figure: "Figure",
  code: "Code",
  quote: "Quote",
};

/**
 * Position-aware labels ("Paragraph 3") so reviewers and authors can talk about a
 * block without seeing its internal id.
 */
export function buildBlockLabels(blocks: readonly ArticleBlock[]): Record<string, string> {
  const counts = new Map<ArticleBlock["kind"], number>();
  const labels: Record<string, string> = {};
  for (const block of blocks) {
    const next = (counts.get(block.kind) ?? 0) + 1;
    counts.set(block.kind, next);
    labels[block.id] = `${BLOCK_KIND_LABELS[block.kind]} ${next}`;
  }
  return labels;
}

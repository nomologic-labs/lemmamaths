import type { ArticleBlock } from "@/data/types";
import {
  cloneBlockTreeWithNewIds,
  ensureBlockIds,
  type SourceArticleBlock,
} from "./block-ids";

/**
 * Editor list entries. The React key and the persisted block id are the same value.
 */
export type EditorBlock = {
  id: string;
  block: ArticleBlock;
};

function materializeNewBlock(block: SourceArticleBlock): ArticleBlock {
  return ensureBlockIds([block], { regenerate: true })[0]!;
}

export function createEditorBlock(block: SourceArticleBlock | ArticleBlock): EditorBlock {
  const materialized = materializeNewBlock(block);
  return { id: materialized.id, block: materialized };
}

/** Persistable body: keep block ids; sync wrapper id onto the block. */
export function stripEditorBlocks(blocks: EditorBlock[]): ArticleBlock[] {
  return blocks.map((entry) =>
    entry.block.id === entry.id ? entry.block : { ...entry.block, id: entry.id },
  );
}

/**
 * Load a body into the editor. Preserves existing stable ids; assigns ids to legacy
 * bodies that predate the block-id requirement.
 */
export function toEditorBlocks(blocks: readonly SourceArticleBlock[]): EditorBlock[] {
  return ensureBlockIds(blocks).map((block) => ({ id: block.id, block }));
}

export function duplicateEditorBlock(entry: EditorBlock): EditorBlock {
  const cloned = cloneBlockTreeWithNewIds(entry.block);
  return { id: cloned.id, block: cloned };
}

export const CODE_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c",
  "cpp",
  "html",
  "css",
  "sql",
  "bash",
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const BLOCK_MENU_ITEMS = [
  { kind: "paragraph" as const, label: "Paragraph" },
  { kind: "heading" as const, label: "Heading" },
  { kind: "math" as const, label: "Equation" },
  { kind: "statement" as const, label: "Theorem" },
  { kind: "proof" as const, label: "Proof" },
  { kind: "example" as const, label: "Example" },
  { kind: "figure" as const, label: "Image" },
  { kind: "code" as const, label: "Code" },
] as const;

export function defaultBlockForKind(
  kind: (typeof BLOCK_MENU_ITEMS)[number]["kind"],
): ArticleBlock {
  switch (kind) {
    case "paragraph":
      return materializeNewBlock({ kind: "paragraph", content: [""] });
    case "heading":
      return materializeNewBlock({ kind: "heading", level: 2, text: "Section heading" });
    case "math":
      return materializeNewBlock({ kind: "math", tex: "E = mc^2" });
    case "statement":
      return materializeNewBlock({
        kind: "statement",
        variant: "theorem",
        content: [{ kind: "paragraph", content: [""] }],
      });
    case "proof":
      return materializeNewBlock({
        kind: "proof",
        content: [{ kind: "paragraph", content: [""] }],
      });
    case "example":
      return materializeNewBlock({
        kind: "statement",
        variant: "example",
        content: [{ kind: "paragraph", content: [""] }],
      });
    case "figure":
      return materializeNewBlock({
        kind: "figure",
        // Valid path prefix so drafts can save before a real asset is chosen.
        src: "/figures/",
        alt: "",
        width: 800,
        height: 450,
      });
    case "code":
      return materializeNewBlock({ kind: "code", language: "python", code: "" });
  }
}

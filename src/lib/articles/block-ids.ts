import type { Article, ArticleBlock, InlineNode, StatementVariant } from "@/data/types";

/**
 * Stable block identity for ArticleBlock trees.
 *
 * Persisted database bodies always carry `id` values. Public mock articles may be
 * authored without ids and are materialized through `materializeArticle`.
 *
 * Future review comments will reference these ids, not array indexes.
 */

const BLOCK_ID_PATTERN = /^blk_[a-zA-Z0-9]+$/;

export function isBlockId(value: string): boolean {
  return BLOCK_ID_PATTERN.test(value);
}

/** Generate a new stable block id (`blk_` + hex). */
export function createBlockId(): string {
  return `blk_${crypto.randomUUID().replace(/-/g, "")}`;
}

/** Authoring shape: same as ArticleBlock but `id` is optional at every level. */
export type SourceArticleBlock =
  | { id?: string; kind: "heading"; level: 2 | 3; text: string }
  | { id?: string; kind: "paragraph"; content: InlineNode[] }
  | { id?: string; kind: "math"; tex: string; tag?: string }
  | {
      id?: string;
      kind: "statement";
      variant: StatementVariant;
      title?: string;
      number?: string;
      content: SourceArticleBlock[];
    }
  | { id?: string; kind: "proof"; of?: string; content: SourceArticleBlock[] }
  | { id?: string; kind: "list"; ordered: boolean; items: InlineNode[][] }
  | {
      id?: string;
      kind: "figure";
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: InlineNode[];
    }
  | { id?: string; kind: "code"; language: string; code: string; caption?: string }
  | { id?: string; kind: "quote"; content: InlineNode[]; attribution?: string };

export type SourceArticle = Omit<Article, "body"> & {
  body: readonly SourceArticleBlock[];
};

type EnsureOptions = {
  /** When true, replace every id (used when duplicating a block tree). */
  regenerate?: boolean;
  /**
   * Deterministic id prefix for mock materialization, e.g. article slug.
   * When set, missing ids become `blk_<prefix>_<path>` instead of random UUIDs.
   */
  deterministicPrefix?: string;
};

function deterministicId(prefix: string, path: string): string {
  const slug = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  const safePath = path.replace(/[^a-z0-9]+/g, "");
  return `blk_${slug}${safePath}`;
}

function nextId(
  existing: string | undefined,
  path: string,
  options: EnsureOptions,
): string {
  if (!options.regenerate && existing && isBlockId(existing)) {
    return existing;
  }
  if (options.deterministicPrefix) {
    return deterministicId(options.deterministicPrefix, path);
  }
  return createBlockId();
}

function mapBlock(
  block: SourceArticleBlock,
  path: string,
  options: EnsureOptions,
): ArticleBlock {
  const id = nextId(block.id, path, options);

  switch (block.kind) {
    case "heading":
      return { id, kind: "heading", level: block.level, text: block.text };
    case "paragraph":
      return { id, kind: "paragraph", content: block.content };
    case "math":
      return { id, kind: "math", tex: block.tex, tag: block.tag };
    case "statement":
      return {
        id,
        kind: "statement",
        variant: block.variant,
        title: block.title,
        number: block.number,
        content: ensureBlockIds(block.content, options, `${path}c`),
      };
    case "proof":
      return {
        id,
        kind: "proof",
        of: block.of,
        content: ensureBlockIds(block.content, options, `${path}c`),
      };
    case "list":
      return { id, kind: "list", ordered: block.ordered, items: block.items };
    case "figure":
      return {
        id,
        kind: "figure",
        src: block.src,
        alt: block.alt,
        width: block.width,
        height: block.height,
        caption: block.caption,
      };
    case "code":
      return {
        id,
        kind: "code",
        language: block.language,
        code: block.code,
        caption: block.caption,
      };
    case "quote":
      return {
        id,
        kind: "quote",
        content: block.content,
        attribution: block.attribution,
      };
  }
}

/**
 * Ensure every block (including nested statement/proof children) has a stable id.
 * Existing valid ids are preserved unless `regenerate` is set.
 */
export function ensureBlockIds(
  blocks: readonly SourceArticleBlock[],
  options: EnsureOptions = {},
  pathPrefix = "",
): ArticleBlock[] {
  return blocks.map((block, index) =>
    mapBlock(block, `${pathPrefix}${index}`, options),
  );
}

/** Deep-clone a block tree with brand-new ids (duplicate block). */
export function cloneBlockTreeWithNewIds(block: ArticleBlock): ArticleBlock {
  return ensureBlockIds([block], { regenerate: true })[0]!;
}

/** Materialize a mock/source article so its body carries stable deterministic ids. */
export function materializeArticle(source: SourceArticle): Article {
  return {
    ...source,
    body: ensureBlockIds(source.body, { deterministicPrefix: source.slug }),
  };
}

export function materializeArticles(sources: readonly SourceArticle[]): Article[] {
  return sources.map(materializeArticle);
}

/** Collect every block id in a tree (top-level and nested). */
export function collectBlockIds(blocks: readonly ArticleBlock[]): Set<string> {
  const ids = new Set<string>();
  const walk = (nodes: readonly ArticleBlock[]) => {
    for (const node of nodes) {
      ids.add(node.id);
      if (node.kind === "statement" || node.kind === "proof") {
        walk(node.content);
      }
    }
  };
  walk(blocks);
  return ids;
}

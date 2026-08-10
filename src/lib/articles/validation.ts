import { z } from "zod";
import { TOPICS } from "@/data/topics";
import type { ArticleBlock, ArticleFormat, TopicId } from "@/data/types";
import { isBlockId } from "./block-ids";
import { isSafeFigureSrc, isSafeHref } from "./url-policy";
import { ARTICLE_WORKFLOW_STATUSES } from "./workflow";

const topicIds = TOPICS.map((t) => t.id) as [TopicId, ...TopicId[]];
const topicIdSchema = z.enum(topicIds);

const articleFormatSchema = z.enum([
  "article",
  "investigation",
  "essay",
  "problem-set",
  "report",
] satisfies [ArticleFormat, ...ArticleFormat[]]);

const statementVariantSchema = z.enum([
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "example",
  "remark",
  "exercise",
]);

const blockIdSchema = z
  .string()
  .refine(isBlockId, { message: "Block id must match blk_[a-zA-Z0-9]+" });

const inlineNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string().max(50_000),
    z.object({ kind: z.literal("math"), tex: z.string().max(10_000) }),
    z.object({ kind: z.literal("emphasis"), content: z.array(inlineNodeSchema).max(200) }),
    z.object({ kind: z.literal("strong"), content: z.array(inlineNodeSchema).max(200) }),
    z.object({ kind: z.literal("code"), text: z.string().max(5_000) }),
    z.object({
      kind: z.literal("link"),
      href: z
        .string()
        .max(2_048)
        .refine(isSafeHref, {
          message: "Link must be http(s) or a site-relative path starting with /",
        }),
      content: z.array(inlineNodeSchema).max(50),
    }),
  ]),
);

const articleBlockSchema: z.ZodType<ArticleBlock> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({
      id: blockIdSchema,
      kind: z.literal("heading"),
      level: z.union([z.literal(2), z.literal(3)]),
      text: z.string().min(1).max(500),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("paragraph"),
      content: z.array(inlineNodeSchema).max(500),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("math"),
      tex: z.string().min(1).max(10_000),
      tag: z.string().max(32).optional(),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("statement"),
      variant: statementVariantSchema,
      title: z.string().max(200).optional(),
      number: z.string().max(32).optional(),
      content: z.array(articleBlockSchema).max(100),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("proof"),
      of: z.string().max(200).optional(),
      content: z.array(articleBlockSchema).max(100),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("list"),
      ordered: z.boolean(),
      items: z.array(z.array(inlineNodeSchema).max(200)).max(100),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("figure"),
      src: z
        .string()
        .max(500)
        .refine(isSafeFigureSrc, {
          message: "Figure src must be a path under /uploads/ or /figures/",
        }),
      alt: z.string().max(1_000),
      width: z.number().int().positive().max(10_000),
      height: z.number().int().positive().max(10_000),
      caption: z.array(inlineNodeSchema).max(200).optional(),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("code"),
      language: z.string().min(1).max(64),
      code: z.string().max(100_000),
      caption: z.string().max(500).optional(),
    }),
    z.object({
      id: blockIdSchema,
      kind: z.literal("quote"),
      content: z.array(inlineNodeSchema).max(500),
      attribution: z.string().max(500).optional(),
    }),
  ]),
) as z.ZodType<ArticleBlock>;

export const articleBodySchema = z
  .array(articleBlockSchema)
  .max(2_000)
  .superRefine((blocks, ctx) => {
    const seen = new Set<string>();
    const walk = (nodes: ArticleBlock[]) => {
      for (const node of nodes) {
        if (seen.has(node.id)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate block id: ${node.id}`,
          });
          return;
        }
        seen.add(node.id);
        if (node.kind === "statement" || node.kind === "proof") {
          walk(node.content);
        }
      }
    };
    walk(blocks);
  });

export const articleMetadataSchema = z.object({
  title: z.string().min(1).max(300),
  standfirst: z.string().max(500).optional(),
  description: z.string().max(1_000),
  format: articleFormatSchema,
  topics: z.array(topicIdSchema).max(9),
  tags: z.array(z.string().min(1).max(64)).max(50),
  featured: z.boolean().optional(),
  authorUserIds: z.array(z.string().uuid()).min(1).max(10),
});

export const saveDraftSchema = z.object({
  articleId: z.string().uuid(),
  metadata: articleMetadataSchema,
  body: articleBodySchema,
});

export const workflowTransitionSchema = z.object({
  articleId: z.string().uuid(),
  targetStatus: z.enum(
    ARTICLE_WORKFLOW_STATUSES as unknown as [string, ...string[]],
  ),
});

export function parseArticleBody(body: unknown): ArticleBlock[] {
  return articleBodySchema.parse(body);
}

export function parseSaveDraftInput(input: unknown): z.infer<typeof saveDraftSchema> {
  return saveDraftSchema.parse(input);
}

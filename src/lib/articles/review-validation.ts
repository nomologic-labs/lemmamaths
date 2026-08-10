import { z } from "zod";
import { isBlockId } from "./block-ids";
import { REVIEW_DECISIONS } from "./review-access";

const uuidSchema = z.string().uuid();

const blockIdSchema = z
  .string()
  .refine(isBlockId, { message: "Block id must match blk_[a-zA-Z0-9]+" });

export const REVIEW_COMMENT_MAX_LENGTH = 4_000;

export const assignReviewerSchema = z.object({
  articleId: uuidSchema,
  reviewerUserId: uuidSchema,
});

export const removeReviewerSchema = z.object({
  articleId: uuidSchema,
  reviewerUserId: uuidSchema,
});

export const createReviewCommentSchema = z.object({
  articleId: uuidSchema,
  blockId: blockIdSchema,
  body: z.string().trim().min(1).max(REVIEW_COMMENT_MAX_LENGTH),
});

export const updateReviewCommentSchema = z.object({
  commentId: uuidSchema,
  body: z.string().trim().min(1).max(REVIEW_COMMENT_MAX_LENGTH),
});

export const resolveReviewCommentSchema = z.object({
  commentId: uuidSchema,
  resolved: z.boolean(),
});

export const submitReviewDecisionSchema = z.object({
  articleId: uuidSchema,
  decision: z.enum(REVIEW_DECISIONS),
});

export function parseAssignReviewerInput(input: unknown) {
  return assignReviewerSchema.parse(input);
}

export function parseRemoveReviewerInput(input: unknown) {
  return removeReviewerSchema.parse(input);
}

export function parseCreateReviewCommentInput(input: unknown) {
  return createReviewCommentSchema.parse(input);
}

export function parseUpdateReviewCommentInput(input: unknown) {
  return updateReviewCommentSchema.parse(input);
}

export function parseResolveReviewCommentInput(input: unknown) {
  return resolveReviewCommentSchema.parse(input);
}

export function parseSubmitReviewDecisionInput(input: unknown) {
  return submitReviewDecisionSchema.parse(input);
}

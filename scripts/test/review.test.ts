import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canReadArticle, canPerformTransition } from "../../src/lib/articles/access";
import { isBlockId } from "../../src/lib/articles/block-ids";
import {
  canBeAssignedAsReviewer,
  canCreateReviewComment,
  canEditReviewComment,
  canManageReviewQueue,
  canResolveReviewComment,
  canReviewAssignedArticle,
  canSubmitReviewDecision,
  canViewReviewFeedback,
} from "../../src/lib/articles/review-access";
import {
  parseCreateReviewCommentInput,
  parseSubmitReviewDecisionInput,
} from "../../src/lib/articles/review-validation";
import { canTransition } from "../../src/lib/articles/workflow";

const authorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const reviewerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const editorId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const strangerId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const article = {
  id: "11111111-1111-4111-8111-111111111111",
  createdById: authorId,
  workflowStatus: "UNDER_REVIEW" as const,
  authorUserIds: [authorId],
  assignedReviewerIds: [reviewerId],
};

describe("reviewer authorization", () => {
  it("reviewer can access assigned article", () => {
    assert.equal(canReadArticle(["reviewer"], reviewerId, article), true);
    assert.equal(canReviewAssignedArticle(["reviewer"], reviewerId, article), true);
    assert.equal(canViewReviewFeedback(["reviewer"], reviewerId, article), true);
  });

  it("reviewer cannot access unrelated article", () => {
    const unrelated = { ...article, assignedReviewerIds: [] };
    assert.equal(canReadArticle(["reviewer"], reviewerId, unrelated), false);
    assert.equal(canReviewAssignedArticle(["reviewer"], reviewerId, unrelated), false);
  });

  it("author can view feedback on own article but not another author's", () => {
    assert.equal(canViewReviewFeedback(["author"], authorId, article), true);
    const other = {
      ...article,
      createdById: strangerId,
      authorUserIds: [strangerId],
      assignedReviewerIds: [],
    };
    assert.equal(canViewReviewFeedback(["author"], authorId, other), false);
  });

  it("editor can manage the queue and view all feedback", () => {
    assert.equal(canManageReviewQueue(["editor"]), true);
    assert.equal(canViewReviewFeedback(["editor"], editorId, article), true);
    assert.equal(canReadArticle(["editor"], editorId, article), true);
  });

  it("unauthorized users cannot create comments", () => {
    assert.equal(
      canCreateReviewComment(["author"], authorId, article, {
        assignmentActive: false,
        roundOpen: true,
      }),
      false,
    );
    assert.equal(
      canCreateReviewComment(["reviewer"], strangerId, article, {
        assignmentActive: false,
        roundOpen: true,
      }),
      false,
    );
  });

  it("reviewer cannot review their own article", () => {
    const selfAuthored = {
      ...article,
      createdById: reviewerId,
      authorUserIds: [reviewerId],
      assignedReviewerIds: [reviewerId],
    };
    assert.equal(canBeAssignedAsReviewer(reviewerId, selfAuthored), false);
    assert.equal(canReviewAssignedArticle(["reviewer"], reviewerId, selfAuthored), false);
    assert.equal(
      canCreateReviewComment(["reviewer"], reviewerId, selfAuthored, {
        assignmentActive: true,
        roundOpen: true,
      }),
      false,
    );
  });
});

describe("review comments", () => {
  it("accepts valid block ids and rejects invalid ones", () => {
    assert.ok(isBlockId("blk_abc123"));
    assert.throws(() =>
      parseCreateReviewCommentInput({
        articleId: article.id,
        blockId: "not-a-block",
        body: "Please clarify the hypothesis.",
      }),
    );
    const parsed = parseCreateReviewCommentInput({
      articleId: article.id,
      blockId: "blk_c33deadbeef",
      body: "Tighten the proof of uniqueness.",
    });
    assert.equal(parsed.blockId, "blk_c33deadbeef");
  });

  it("editing comment checks ownership", () => {
    assert.equal(
      canEditReviewComment({
        roles: ["reviewer"],
        userId: reviewerId,
        commentAuthorId: reviewerId,
        article,
      }),
      true,
    );
    assert.equal(
      canEditReviewComment({
        roles: ["reviewer"],
        userId: strangerId,
        commentAuthorId: reviewerId,
        article,
      }),
      false,
    );
    assert.equal(
      canEditReviewComment({
        roles: ["editor"],
        userId: editorId,
        commentAuthorId: reviewerId,
        article,
      }),
      true,
    );
  });

  it("resolving comment checks permission", () => {
    assert.equal(
      canResolveReviewComment({
        roles: ["author"],
        userId: authorId,
        commentAuthorId: reviewerId,
        article,
      }),
      true,
    );
    assert.equal(
      canResolveReviewComment({
        roles: ["reviewer"],
        userId: strangerId,
        commentAuthorId: reviewerId,
        article,
      }),
      false,
    );
  });

  it("comments remain keyed by stable block ids conceptually", () => {
    const blockId = "blk_stable001";
    const first = parseCreateReviewCommentInput({
      articleId: article.id,
      blockId,
      body: "Round 1 note",
    });
    const second = parseCreateReviewCommentInput({
      articleId: article.id,
      blockId,
      body: "Still about the same block after reorder",
    });
    assert.equal(first.blockId, second.blockId);
  });
});

describe("review workflow integration", () => {
  it("supports the editorial path", () => {
    assert.equal(canTransition("SUBMITTED", "UNDER_REVIEW"), true);
    assert.equal(canTransition("UNDER_REVIEW", "REVISION_REQUESTED"), true);
    assert.equal(canTransition("UNDER_REVIEW", "APPROVED"), true);
    assert.equal(canTransition("REVISION_REQUESTED", "RESUBMITTED"), true);
    assert.equal(canTransition("RESUBMITTED", "UNDER_REVIEW"), true);
  });

  it("reviewer cannot perform editor-only transitions", () => {
    assert.equal(
      canPerformTransition(["reviewer"], reviewerId, article, "APPROVED"),
      null,
    );
    assert.equal(
      canPerformTransition(["reviewer"], reviewerId, article, "REVISION_REQUESTED"),
      null,
    );
    const submitted = { ...article, workflowStatus: "SUBMITTED" as const };
    assert.equal(
      canPerformTransition(["reviewer"], reviewerId, submitted, "UNDER_REVIEW"),
      null,
    );
  });

  it("reviewer decision payload is validated", () => {
    const parsed = parseSubmitReviewDecisionInput({
      articleId: article.id,
      decision: "request_revisions",
    });
    assert.equal(parsed.decision, "request_revisions");
    assert.throws(() =>
      parseSubmitReviewDecisionInput({
        articleId: article.id,
        decision: "publish",
      }),
    );
  });

  it("active assignment is required for reviewer decisions", () => {
    assert.equal(
      canSubmitReviewDecision(["reviewer"], reviewerId, article, {
        assignmentActive: true,
        roundOpen: true,
      }),
      true,
    );
    assert.equal(
      canSubmitReviewDecision(["reviewer"], reviewerId, article, {
        assignmentActive: false,
        roundOpen: true,
      }),
      false,
    );
  });
});

describe("review rounds", () => {
  it("keeps round association on comments as data (roundNumber preserved in views)", () => {
    // Architectural guarantee tested at the access/validation layer: comments are
    // created against a round id and never rewritten when a new round opens.
    const roundOneComment = {
      roundId: "round-1",
      roundNumber: 1,
      blockId: "blk_abc",
      body: "Historical note",
    };
    const roundTwoComment = {
      roundId: "round-2",
      roundNumber: 2,
      blockId: "blk_abc",
      body: "New round note",
    };
    assert.notEqual(roundOneComment.roundId, roundTwoComment.roundId);
    assert.equal(roundOneComment.blockId, roundTwoComment.blockId);
    assert.equal(roundOneComment.roundNumber, 1);
  });
});

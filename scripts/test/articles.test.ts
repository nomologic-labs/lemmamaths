import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDeleteDraft,
  canEditArticleRecord,
  canPerformTransition,
  canPublishArticle,
  canReadArticle,
  canSubmitArticle,
  isPublishedImmutable,
  submitTargetStatus,
} from "../../src/lib/articles/access";
import {
  cloneBlockTreeWithNewIds,
  createBlockId,
  ensureBlockIds,
  isBlockId,
} from "../../src/lib/articles/block-ids";
import {
  createEditorBlock,
  defaultBlockForKind,
  duplicateEditorBlock,
  stripEditorBlocks,
  toEditorBlocks,
} from "../../src/lib/articles/editor-types";
import { parseArticleBody, parseSaveDraftInput } from "../../src/lib/articles/validation";
import { canTransition, getTransition } from "../../src/lib/articles/workflow";

const authorRoles = ["author"] as const;
const editorRoles = ["editor"] as const;
const reviewerRoles = ["reviewer"] as const;

const draftArticle = {
  id: "11111111-1111-1111-1111-111111111111",
  createdById: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  workflowStatus: "DRAFT" as const,
  authorUserIds: ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
  assignedReviewerIds: [] as string[],
};

const blockId = () => createBlockId();

describe("ArticleBlock ids", () => {
  it("creates blk_ ids for new blocks", () => {
    const block = defaultBlockForKind("paragraph");
    assert.ok(isBlockId(block.id));
    const entry = createEditorBlock({ kind: "heading", level: 2, text: "Hi" });
    assert.ok(isBlockId(entry.id));
    assert.equal(entry.id, entry.block.id);
  });

  it("preserves ids across toEditorBlocks / stripEditorBlocks / reorder", () => {
    const body = ensureBlockIds([
      { kind: "paragraph", content: ["A"] },
      { kind: "paragraph", content: ["B"] },
      { kind: "math", tex: "x^2" },
    ]);
    const editor = toEditorBlocks(body);
    const ids = editor.map((entry) => entry.id);
    const reordered = [editor[2]!, editor[0]!, editor[1]!];
    const stripped = stripEditorBlocks(reordered);
    assert.deepEqual(
      stripped.map((block) => block.id),
      [ids[2], ids[0], ids[1]],
    );
    assert.deepEqual(
      toEditorBlocks(stripped).map((entry) => entry.id),
      [ids[2], ids[0], ids[1]],
    );
  });

  it("duplicate creates a new id and leaves the original unchanged", () => {
    const original = createEditorBlock({ kind: "paragraph", content: ["keep"] });
    const copy = duplicateEditorBlock(original);
    assert.notEqual(copy.id, original.id);
    assert.ok(isBlockId(copy.id));
    assert.equal(original.block.id, original.id);
  });

  it("delete does not alter remaining ids", () => {
    const blocks = toEditorBlocks(
      ensureBlockIds([
        { kind: "paragraph", content: ["one"] },
        { kind: "paragraph", content: ["two"] },
        { kind: "paragraph", content: ["three"] },
      ]),
    );
    const kept = [blocks[0]!, blocks[2]!];
    assert.equal(kept[0]!.id, blocks[0]!.id);
    assert.equal(kept[1]!.id, blocks[2]!.id);
  });

  it("cloneBlockTreeWithNewIds regenerates nested ids", () => {
    const tree = ensureBlockIds([
      {
        kind: "statement",
        variant: "theorem",
        content: [{ kind: "paragraph", content: ["inner"] }],
      },
    ])[0]!;
    const cloned = cloneBlockTreeWithNewIds(tree);
    assert.notEqual(cloned.id, tree.id);
    if (cloned.kind === "statement" && tree.kind === "statement") {
      assert.notEqual(cloned.content[0]!.id, tree.content[0]!.id);
    }
  });

  it("validation rejects missing or malformed block ids", () => {
    assert.throws(() => parseArticleBody([{ kind: "paragraph", content: ["Hello"] }]));
    assert.throws(() =>
      parseArticleBody([{ id: "not-valid", kind: "paragraph", content: ["Hello"] }]),
    );
  });

  it("validation accepts bodies with unique blk_ ids", () => {
    const id = blockId();
    const body = parseArticleBody([{ id, kind: "paragraph", content: ["Hello"] }]);
    assert.equal(body[0]!.id, id);
  });

  it("validation rejects duplicate ids in a body", () => {
    const id = blockId();
    assert.throws(() =>
      parseArticleBody([
        { id, kind: "paragraph", content: ["A"] },
        { id, kind: "paragraph", content: ["B"] },
      ]),
    );
  });
});

describe("ArticleBlock validation", () => {
  it("rejects unknown block kinds", () => {
    assert.throws(() =>
      parseArticleBody([{ id: blockId(), kind: "markdown", text: "nope" }]),
    );
  });

  it("rejects invalid topic ids in metadata", () => {
    assert.throws(() =>
      parseSaveDraftInput({
        articleId: "11111111-1111-1111-1111-111111111111",
        metadata: {
          title: "Test",
          description: "Desc",
          format: "article",
          topics: ["not-a-topic"],
          tags: [],
          authorUserIds: ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
        },
        body: [],
      }),
    );
  });

  it("rejects malformed math blocks", () => {
    assert.throws(() => parseArticleBody([{ id: blockId(), kind: "math", tex: "" }]));
  });
});

describe("workflow transitions", () => {
  it("allows only legal edges", () => {
    assert.equal(canTransition("DRAFT", "SUBMITTED"), true);
    assert.equal(canTransition("SUBMITTED", "UNDER_REVIEW"), true);
    assert.equal(canTransition("UNDER_REVIEW", "REVISION_REQUESTED"), true);
    assert.equal(canTransition("UNDER_REVIEW", "APPROVED"), true);
    assert.equal(canTransition("REVISION_REQUESTED", "RESUBMITTED"), true);
    assert.equal(canTransition("RESUBMITTED", "UNDER_REVIEW"), true);
    assert.equal(canTransition("APPROVED", "PUBLISHED"), true);

    assert.equal(canTransition("DRAFT", "PUBLISHED"), false);
    assert.equal(canTransition("SUBMITTED", "APPROVED"), false);
    assert.equal(canTransition("UNDER_REVIEW", "SUBMITTED"), false);
    assert.equal(canTransition("PUBLISHED", "DRAFT"), false);
  });

  it("author can submit own draft and resubmit after revision", () => {
    const submit = canPerformTransition(
      authorRoles,
      draftArticle.createdById,
      draftArticle,
      "SUBMITTED",
    );
    assert.ok(submit);
    assert.equal(submit.permission, "article:submit");

    const revision = { ...draftArticle, workflowStatus: "REVISION_REQUESTED" as const };
    assert.equal(submitTargetStatus(revision.workflowStatus), "RESUBMITTED");
    assert.ok(
      canPerformTransition(authorRoles, draftArticle.createdById, revision, "RESUBMITTED"),
    );
  });

  it("author cannot approve or start review", () => {
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    assert.equal(
      canPerformTransition(authorRoles, draftArticle.createdById, submitted, "UNDER_REVIEW"),
      null,
    );
    const underReview = { ...draftArticle, workflowStatus: "UNDER_REVIEW" as const };
    assert.equal(
      canPerformTransition(authorRoles, draftArticle.createdById, underReview, "APPROVED"),
      null,
    );
  });

  it("editor can start review, request revision, and approve", () => {
    const editorId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    assert.ok(canPerformTransition(editorRoles, editorId, submitted, "UNDER_REVIEW"));

    const underReview = { ...draftArticle, workflowStatus: "UNDER_REVIEW" as const };
    assert.ok(canPerformTransition(editorRoles, editorId, underReview, "REVISION_REQUESTED"));
    assert.ok(canPerformTransition(editorRoles, editorId, underReview, "APPROVED"));
  });

  it("reviewer cannot publish or approve", () => {
    const reviewerId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const underReview = { ...draftArticle, workflowStatus: "UNDER_REVIEW" as const };
    assert.equal(
      canPerformTransition(reviewerRoles, reviewerId, underReview, "APPROVED"),
      null,
    );
    const approved = { ...draftArticle, workflowStatus: "APPROVED" as const };
    assert.equal(
      canPerformTransition(reviewerRoles, reviewerId, approved, "PUBLISHED"),
      null,
    );
  });

  it("unauthorized user cannot mutate workflow", () => {
    const stranger = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    assert.equal(
      canPerformTransition([], stranger, draftArticle, "SUBMITTED"),
      null,
    );
    assert.equal(getTransition("DRAFT", "UNDER_REVIEW"), null);
  });

  it("invalid state transition fails", () => {
    const editorId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    assert.equal(
      canPerformTransition(editorRoles, editorId, draftArticle, "APPROVED"),
      null,
    );
  });
});

describe("article access control", () => {
  it("owner can read and edit draft", () => {
    const userId = draftArticle.createdById;
    assert.equal(canReadArticle(authorRoles, userId, draftArticle), true);
    assert.equal(canEditArticleRecord(authorRoles, userId, draftArticle), true);
  });

  it("non-owner author cannot edit someone else's draft", () => {
    const otherUser = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    assert.equal(canReadArticle(authorRoles, otherUser, draftArticle), false);
    assert.equal(canEditArticleRecord(authorRoles, otherUser, draftArticle), false);
  });

  it("assigned reviewer can read", () => {
    const reviewerId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const assigned = {
      ...draftArticle,
      workflowStatus: "UNDER_REVIEW" as const,
      assignedReviewerIds: [reviewerId],
    };
    assert.equal(canReadArticle(reviewerRoles, reviewerId, assigned), true);
    assert.equal(canReadArticle(reviewerRoles, reviewerId, draftArticle), false);
  });

  it("editor can read and edit submitted work", () => {
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    const editorId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    assert.equal(canReadArticle(editorRoles, editorId, submitted), true);
    assert.equal(canEditArticleRecord(editorRoles, editorId, submitted), true);
  });

  it("author cannot edit submitted work", () => {
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    assert.equal(
      canEditArticleRecord(authorRoles, draftArticle.createdById, submitted),
      false,
    );
  });

  it("author can submit draft and resubmit after revision", () => {
    assert.equal(
      canSubmitArticle(authorRoles, draftArticle.createdById, draftArticle),
      true,
    );
    const revision = { ...draftArticle, workflowStatus: "REVISION_REQUESTED" as const };
    assert.equal(submitTargetStatus(revision.workflowStatus), "RESUBMITTED");
    assert.equal(canSubmitArticle(authorRoles, draftArticle.createdById, revision), true);
  });

  it("only draft deletions are allowed for authors", () => {
    assert.equal(canDeleteDraft(authorRoles, draftArticle.createdById, draftArticle), true);
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    assert.equal(canDeleteDraft(authorRoles, draftArticle.createdById, submitted), false);
  });

  it("published articles are immutable through normal draft editing", () => {
    const published = { ...draftArticle, workflowStatus: "PUBLISHED" as const };
    const editorId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    assert.equal(isPublishedImmutable(published.workflowStatus), true);
    assert.equal(canEditArticleRecord(authorRoles, draftArticle.createdById, published), false);
    assert.equal(canEditArticleRecord(editorRoles, editorId, published), false);
  });
});

describe("publishing authorization", () => {
  const approved = { ...draftArticle, workflowStatus: "APPROVED" as const };
  const editorId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

  it("only editor/admin can approve", () => {
    const underReview = { ...draftArticle, workflowStatus: "UNDER_REVIEW" as const };
    assert.ok(canPerformTransition(editorRoles, editorId, underReview, "APPROVED"));
    assert.equal(
      canPerformTransition(authorRoles, draftArticle.createdById, underReview, "APPROVED"),
      null,
    );
    assert.equal(
      canPerformTransition(reviewerRoles, "dddddddd-dddd-dddd-dddd-dddddddddddd", underReview, "APPROVED"),
      null,
    );
  });

  it("only editor/admin can publish approved articles", () => {
    assert.equal(canPublishArticle(editorRoles, approved), true);
    assert.ok(canPerformTransition(editorRoles, editorId, approved, "PUBLISHED"));
    assert.equal(canPublishArticle(authorRoles, approved), false);
    assert.equal(canPublishArticle(reviewerRoles, approved), false);
    assert.equal(
      canPerformTransition(authorRoles, draftArticle.createdById, approved, "PUBLISHED"),
      null,
    );
  });

  it("invalid publish transitions fail", () => {
    assert.equal(canPublishArticle(editorRoles, draftArticle), false);
    assert.equal(canPerformTransition(editorRoles, editorId, draftArticle, "PUBLISHED"), null);
    const underReview = { ...draftArticle, workflowStatus: "UNDER_REVIEW" as const };
    assert.equal(canPublishArticle(editorRoles, underReview), false);
    const published = { ...draftArticle, workflowStatus: "PUBLISHED" as const };
    assert.equal(canPublishArticle(editorRoles, published), false);
    assert.equal(canPerformTransition(editorRoles, editorId, published, "PUBLISHED"), null);
  });

  it("repeated publish from non-APPROVED state is rejected by transition rules", () => {
    const published = { ...draftArticle, workflowStatus: "PUBLISHED" as const };
    assert.equal(getTransition("PUBLISHED", "PUBLISHED"), null);
    assert.equal(canPerformTransition(editorRoles, editorId, published, "PUBLISHED"), null);
  });

  it("submit and resubmit require the matching source status", () => {
    assert.equal(submitTargetStatus("DRAFT"), "SUBMITTED");
    assert.equal(submitTargetStatus("REVISION_REQUESTED"), "RESUBMITTED");
    assert.equal(submitTargetStatus("SUBMITTED"), null);
    assert.equal(submitTargetStatus("UNDER_REVIEW"), null);
    assert.equal(submitTargetStatus("APPROVED"), null);
  });
});

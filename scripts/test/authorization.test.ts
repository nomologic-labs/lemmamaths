import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDeleteDraft,
  canEditArticleRecord,
  canPerformTransition,
  canPublishArticle,
  canReadArticle,
  canSubmitArticle,
} from "../../src/lib/articles/access";
import {
  canAccessAssignedReviews,
  canManageReviewQueue,
  canReviewAssignedArticle,
  canSubmitReviewDecision,
  canViewReviewFeedback,
} from "../../src/lib/articles/review-access";
import {
  validateApproveContributor,
  validateDemoteAccount,
  validateLastActiveAdministrator,
  validatePromoteAccount,
} from "../../src/lib/auth/account-management-rules";
import {
  canAccessDashboard,
  canManageAccounts,
  getContributorNavLinks,
} from "../../src/lib/auth/nav-links";
import {
  hasPermission,
  permissionsForAccount,
  permissionsForRole,
} from "../../src/lib/auth/permissions";

const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const authorId = actorId;
const reviewerId = otherUserId;
const adminId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const pendingContributor = permissionsForAccount("contributor", "pending");
const activeContributor = permissionsForAccount("contributor", "active");
const suspendedContributor = permissionsForAccount("contributor", "suspended");
const activeAdministrator = permissionsForAccount("administrator", "active");
const suspendedAdministrator = permissionsForAccount("administrator", "suspended");

const draftArticle = {
  id: "11111111-1111-4111-8111-111111111111",
  createdById: authorId,
  workflowStatus: "DRAFT" as const,
  authorUserIds: [authorId],
  assignedReviewerIds: [] as string[],
};

const underReviewArticle = {
  ...draftArticle,
  workflowStatus: "UNDER_REVIEW" as const,
  assignedReviewerIds: [reviewerId],
};

describe("account defaults", () => {
  it("new account model maps to contributor + pending with no capabilities", () => {
    assert.equal(pendingContributor.has("dashboard:access"), false);
    assert.equal(pendingContributor.has("article:create"), false);
    assert.equal(pendingContributor.has("article:review"), false);
    assert.equal(pendingContributor.has("account:manage"), false);
  });
});

describe("permissions matrix", () => {
  it("active contributor can create and submit but not publish or manage accounts", () => {
    assert.equal(hasPermission(activeContributor, "article:create"), true);
    assert.equal(hasPermission(activeContributor, "article:submit"), true);
    assert.equal(hasPermission(activeContributor, "article:review"), true);
    assert.equal(hasPermission(activeContributor, "article:publish"), false);
    assert.equal(hasPermission(activeContributor, "account:manage"), false);
    assert.equal(hasPermission(activeContributor, "article:read:any"), false);
  });

  it("active administrator can publish and manage accounts", () => {
    assert.equal(hasPermission(activeAdministrator, "article:publish"), true);
    assert.equal(hasPermission(activeAdministrator, "article:edit:any"), true);
    assert.equal(hasPermission(activeAdministrator, "account:manage"), true);
  });

  it("pending and suspended accounts receive no permissions", () => {
    assert.equal(hasPermission(pendingContributor, "article:create"), false);
    assert.equal(hasPermission(suspendedContributor, "article:create"), false);
    assert.equal(hasPermission(suspendedAdministrator, "article:approve"), false);
  });

  it("administrator role includes contributor capabilities", () => {
    for (const permission of permissionsForRole("contributor")) {
      assert.equal(hasPermission(activeAdministrator, permission), true);
    }
  });
});

describe("pending contributor restrictions", () => {
  it("pending contributor cannot create, edit, submit, review, or publish", () => {
    assert.equal(canReadArticle(pendingContributor, authorId, draftArticle), false);
    assert.equal(canEditArticleRecord(pendingContributor, authorId, draftArticle), false);
    assert.equal(canSubmitArticle(pendingContributor, authorId, draftArticle), false);
    assert.equal(canReviewAssignedArticle(pendingContributor, reviewerId, underReviewArticle), false);
    assert.equal(canPublishArticle(pendingContributor, { ...draftArticle, workflowStatus: "APPROVED" }), false);
  });

  it("pending contributor has no dashboard access", () => {
    assert.equal(canAccessDashboard(pendingContributor), false);
    assert.equal(getContributorNavLinks(pendingContributor).length, 0);
  });
});

describe("active contributor article access", () => {
  it("active contributor can create and edit own draft", () => {
    assert.equal(canReadArticle(activeContributor, authorId, draftArticle), true);
    assert.equal(canEditArticleRecord(activeContributor, authorId, draftArticle), true);
    assert.equal(canSubmitArticle(activeContributor, authorId, draftArticle), true);
  });

  it("active contributor cannot edit another user's article", () => {
    assert.equal(canReadArticle(activeContributor, reviewerId, draftArticle), false);
    assert.equal(canEditArticleRecord(activeContributor, reviewerId, draftArticle), false);
  });

  it("active contributor can review only assigned articles", () => {
    assert.equal(canReviewAssignedArticle(activeContributor, reviewerId, underReviewArticle), true);
    assert.equal(canReviewAssignedArticle(activeContributor, reviewerId, draftArticle), false);
    assert.equal(canSubmitReviewDecision(activeContributor, reviewerId, underReviewArticle, {
      assignmentActive: true,
      roundOpen: true,
    }), true);
  });

  it("active contributor cannot review their own article", () => {
    const selfAssigned = {
      ...underReviewArticle,
      createdById: reviewerId,
      authorUserIds: [reviewerId],
      assignedReviewerIds: [reviewerId],
    };
    assert.equal(canReviewAssignedArticle(activeContributor, reviewerId, selfAssigned), false);
  });
});

describe("administrator capabilities", () => {
  it("administrator can edit another user's article", () => {
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    assert.equal(canReadArticle(activeAdministrator, adminId, submitted), true);
    assert.equal(canEditArticleRecord(activeAdministrator, adminId, submitted), true);
  });

  it("administrator can approve and publish", () => {
    const underReview = { ...draftArticle, workflowStatus: "UNDER_REVIEW" as const };
    const approved = { ...draftArticle, workflowStatus: "APPROVED" as const };
    assert.ok(canPerformTransition(activeAdministrator, adminId, underReview, "APPROVED"));
    assert.equal(canPublishArticle(activeAdministrator, approved), true);
    assert.ok(canPerformTransition(activeAdministrator, adminId, approved, "PUBLISHED"));
  });

  it("administrator can manage review queue", () => {
    assert.equal(canManageReviewQueue(activeAdministrator), true);
    assert.equal(canManageReviewQueue(activeContributor), false);
  });
});

describe("suspended accounts", () => {
  it("suspended contributor loses all capabilities", () => {
    assert.equal(canAccessDashboard(suspendedContributor), false);
    assert.equal(canEditArticleRecord(suspendedContributor, authorId, draftArticle), false);
    assert.equal(canReviewAssignedArticle(suspendedContributor, reviewerId, underReviewArticle), false);
  });

  it("suspended administrator loses all capabilities", () => {
    assert.equal(canManageAccounts(suspendedAdministrator), false);
    assert.equal(canPublishArticle(suspendedAdministrator, { ...draftArticle, workflowStatus: "APPROVED" }), false);
  });
});

describe("account management rules", () => {
  it("admin approves pending contributor", () => {
    assert.equal(
      validateApproveContributor(adminId, {
        id: otherUserId,
        accountRole: "contributor",
        accountStatus: "pending",
      }),
      null,
    );
  });

  it("cannot self-approve", () => {
    assert.match(
      validateApproveContributor(actorId, {
        id: actorId,
        accountRole: "contributor",
        accountStatus: "pending",
      }) ?? "",
      /cannot approve your own account/i,
    );
  });

  it("cannot self-promote", () => {
    assert.match(
      validatePromoteAccount(actorId, {
        id: actorId,
        accountRole: "contributor",
        accountStatus: "active",
      }) ?? "",
      /cannot promote your own account/i,
    );
  });

  it("cannot demote the last active administrator", () => {
    assert.match(
      validateLastActiveAdministrator(
        { id: adminId, accountRole: "administrator", accountStatus: "active" },
        1,
      ) ?? "",
      /last active administrator/i,
    );
  });

  it("cannot suspend the last active administrator", () => {
    assert.match(
      validateLastActiveAdministrator(
        { id: adminId, accountRole: "administrator", accountStatus: "active" },
        1,
      ) ?? "",
      /last active administrator/i,
    );
  });

  it("cannot demote self", () => {
    assert.match(
      validateDemoteAccount(adminId, {
        id: adminId,
        accountRole: "administrator",
        accountStatus: "active",
      }) ?? "",
      /cannot demote your own account/i,
    );
  });
});

describe("dashboard and navigation", () => {
  it("active contributor sees drafts and assigned review links", () => {
    const links = getContributorNavLinks(activeContributor);
    assert.ok(links.some((link) => link.href === "/dashboard/drafts"));
    assert.ok(links.some((link) => link.href === "/dashboard/published"));
    assert.ok(links.some((link) => link.href === "/dashboard/review/assigned"));
    assert.equal(links.some((link) => link.href === "/dashboard/admin/users"), false);
  });

  it("active administrator sees administration link", () => {
    const links = getContributorNavLinks(activeAdministrator);
    assert.ok(links.some((link) => link.href === "/dashboard/admin/users"));
  });

  it("assigned review access requires active contributor permissions", () => {
    assert.equal(canAccessAssignedReviews(activeContributor), true);
    assert.equal(canAccessAssignedReviews(pendingContributor), false);
  });
});

describe("review assignment vs account role", () => {
  it("contributor without assignment cannot read unrelated submitted work", () => {
    const submitted = { ...draftArticle, workflowStatus: "SUBMITTED" as const };
    assert.equal(canReadArticle(activeContributor, reviewerId, submitted), false);
    assert.equal(canViewReviewFeedback(activeContributor, reviewerId, underReviewArticle), true);
  });

  it("contributor role alone does not grant delete on others' drafts", () => {
    assert.equal(canDeleteDraft(activeContributor, reviewerId, draftArticle), false);
  });
});

describe("audit event vocabulary", () => {
  it("account-management actions are defined in the audit action union", () => {
    const actions = [
      "account.approved",
      "account.suspended",
      "account.restored",
      "account.promoted",
      "account.demoted",
      "account.name_updated",
      "account.handle_updated",
    ] as const;
    assert.equal(actions.length, 7);
  });
});

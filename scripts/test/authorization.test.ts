import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPermission, permissionsForRoles } from "../../src/lib/auth/permissions";
import { canAccessDashboard, getContributorNavLinks } from "../../src/lib/auth/nav-links";

describe("permissions matrix", () => {
  it("no-role user has no contributor permissions", () => {
    const permissions = permissionsForRoles([]);
    assert.equal(permissions.has("dashboard:access"), false);
    assert.equal(permissions.has("article:create"), false);
    assert.equal(permissions.has("role:manage"), false);
  });

  it("author can create and submit but not publish", () => {
    const roles = ["author"] as const;
    assert.equal(hasPermission(roles, "article:create"), true);
    assert.equal(hasPermission(roles, "article:submit"), true);
    assert.equal(hasPermission(roles, "article:publish"), false);
    assert.equal(hasPermission(roles, "role:manage"), false);
  });

  it("reviewer can review assigned work but not publish", () => {
    const roles = ["reviewer"] as const;
    assert.equal(hasPermission(roles, "article:review"), true);
    assert.equal(hasPermission(roles, "article:edit:assigned"), true);
    assert.equal(hasPermission(roles, "article:create"), false);
    assert.equal(hasPermission(roles, "article:publish"), false);
  });

  it("editor can publish and edit any article", () => {
    const roles = ["editor"] as const;
    assert.equal(hasPermission(roles, "article:publish"), true);
    assert.equal(hasPermission(roles, "article:edit:any"), true);
    assert.equal(hasPermission(roles, "role:manage"), false);
  });

  it("admin can manage roles", () => {
    const roles = ["admin"] as const;
    assert.equal(hasPermission(roles, "role:manage"), true);
  });

  it("multiple roles compose permissions", () => {
    const roles = ["author", "reviewer"] as const;
    assert.equal(hasPermission(roles, "article:create"), true);
    assert.equal(hasPermission(roles, "article:review"), true);
  });
});

describe("dashboard access", () => {
  it("requires a contributor role", () => {
    assert.equal(canAccessDashboard([]), false);
    assert.equal(canAccessDashboard(["author"]), true);
  });
});

describe("contributor navigation", () => {
  it("shows administration only for admin", () => {
    const adminLinks = getContributorNavLinks(["admin"]);
    assert.ok(adminLinks.some((link) => link.label === "Administration"));

    const authorLinks = getContributorNavLinks(["author"]);
    assert.equal(
      authorLinks.some((link) => link.label === "Administration"),
      false,
    );
  });

  it("shows drafts link for authors", () => {
    const authorLinks = getContributorNavLinks(["author"]);
    assert.ok(authorLinks.some((link) => link.href === "/dashboard/drafts"));
  });

  it("shows review and submissions links for the right roles", () => {
    const reviewerLinks = getContributorNavLinks(["reviewer"]);
    assert.ok(reviewerLinks.some((link) => link.href === "/dashboard/review/assigned"));

    const editorLinks = getContributorNavLinks(["editor"]);
    assert.ok(editorLinks.some((link) => link.href === "/dashboard/review"));
  });
});

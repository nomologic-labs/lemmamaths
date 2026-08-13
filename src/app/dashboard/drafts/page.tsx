import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ArrowRightIcon } from "@/components/ui/icons";
import { createDraftAction } from "@/lib/articles/actions";
import { canEditArticleRecord, canReadArticle } from "@/lib/articles/access";
import {
  listAllArticles,
  listDraftsForUser,
  toAccessRecord,
} from "@/lib/articles/store";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { canAccessDashboard } from "@/lib/auth/nav-links";
import {
  WORKFLOW_CONTRIBUTOR_HINTS,
  WORKFLOW_LABELS,
} from "@/lib/articles/workflow-labels";
import styles from "../ArticleList.module.css";

export const metadata: Metadata = {
  title: "My drafts",
  robots: { index: false },
};

export default async function DraftsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/drafts");
  if (!user.handle) redirect("/onboarding/handle?callbackUrl=/dashboard/drafts");
  if (!canAccessDashboard(user.permissions)) redirect("/dashboard");

  const readsEverything = hasPermission(user.permissions, "article:read:any");
  const articles = readsEverything ? await listAllArticles() : await listDraftsForUser(user.id);

  // Published work lives on its own page; this list is only work still in progress.
  const visible = articles.filter(
    (article) =>
      article.workflowStatus !== "PUBLISHED" &&
      canReadArticle(user.permissions, user.id, toAccessRecord(article)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title={readsEverything ? "All drafts" : "My drafts"}
        lede={
          readsEverything
            ? "Every article still being written or reviewed. Published articles are in the archive."
            : "Articles you are still writing, and articles you have sent for peer review."
        }
      />
      <Container className={styles.page}>
        <div className={styles.actions}>
          {user.permissions.has("article:create") && (
            <form action={createDraftAction}>
              <button type="submit" className={styles.newButton}>
                New draft
              </button>
            </form>
          )}
          <Link href="/dashboard" className={styles.back}>
            <ArrowRightIcon size={16} />
            Back to dashboard
          </Link>
        </div>

        {visible.length === 0 ? (
          <p className={styles.empty}>
            Nothing in progress. Start a new draft to write an article, then submit it for peer
            review when it is ready.
          </p>
        ) : (
          <ul className={styles.list}>
            {visible.map((draft) => {
              const editable = canEditArticleRecord(user.permissions, user.id, toAccessRecord(draft));
              return (
                <li key={draft.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <h2 className={styles.itemTitle}>
                      <Link href={editable ? `/dashboard/drafts/${draft.id}` : `/dashboard/drafts/${draft.id}/preview`}>
                        {draft.title}
                      </Link>
                    </h2>
                    <p className={styles.itemMeta}>
                      <StatusPill>{WORKFLOW_LABELS[draft.workflowStatus]}</StatusPill>
                      <span>
                        Last saved{" "}
                        {draft.updatedAt.toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className={styles.itemHint}>
                      {WORKFLOW_CONTRIBUTOR_HINTS[draft.workflowStatus]}
                    </p>
                  </div>
                  <div className={styles.itemLinks}>
                    {editable && (
                      <Link href={`/dashboard/drafts/${draft.id}`} className={styles.link}>
                        Edit
                      </Link>
                    )}
                    <Link href={`/dashboard/drafts/${draft.id}/preview`} className={styles.link}>
                      Preview
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}

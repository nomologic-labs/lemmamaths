import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { WORKFLOW_LABELS } from "@/lib/articles/workflow-labels";
import styles from "./Drafts.module.css";

export const metadata: Metadata = {
  title: "My drafts",
  robots: { index: false },
};

export default async function DraftsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/drafts");
  if (!user.handle) redirect("/onboarding/handle?callbackUrl=/dashboard/drafts");
  if (!canAccessDashboard(user.roles)) redirect("/dashboard");

  const drafts = hasPermission(user.roles, "article:read:any")
    ? await listAllArticles()
    : await listDraftsForUser(user.id);

  const visible = drafts.filter((draft) =>
    canReadArticle(user.roles, user.id, toAccessRecord(draft)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title="My drafts"
        lede="Create and continue work on structured mathematics articles."
      />
      <Container className={styles.page}>
        <div className={styles.actions}>
          {user.permissions.has("article:create") && (
            <form action={createDraftAction}>
              <button type="submit" className={styles.newButton}>
                New article
              </button>
            </form>
          )}
          <Link href="/dashboard" className={styles.back}>
            Back to dashboard
            <ArrowRightIcon size={16} />
          </Link>
        </div>

        {visible.length === 0 ? (
          <p className={styles.empty}>No drafts yet. Create a new article to begin writing.</p>
        ) : (
          <ul className={styles.list}>
            {visible.map((draft) => {
              const editable = canEditArticleRecord(user.roles, user.id, toAccessRecord(draft));
              return (
                <li key={draft.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <h2 className={styles.itemTitle}>
                      <Link href={editable ? `/dashboard/drafts/${draft.id}` : `/dashboard/drafts/${draft.id}/preview`}>
                        {draft.title}
                      </Link>
                    </h2>
                    <p className={styles.itemMeta}>
                      <span>{WORKFLOW_LABELS[draft.workflowStatus]}</span>
                      <span>·</span>
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

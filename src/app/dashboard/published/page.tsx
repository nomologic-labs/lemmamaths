import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ArrowRightIcon } from "@/components/ui/icons";
import { canReadArticle } from "@/lib/articles/access";
import { formatDate } from "@/lib/articles/labels";
import {
  listAllArticles,
  listDraftsForUser,
  toAccessRecord,
} from "@/lib/articles/store";
import { WORKFLOW_LABELS } from "@/lib/articles/workflow-labels";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { canAccessDashboard } from "@/lib/auth/nav-links";
import { hasPermission } from "@/lib/auth/permissions";
import styles from "../ArticleList.module.css";

export const metadata: Metadata = {
  title: "Published",
  robots: { index: false },
};

/**
 * A contributor's own published work, and every published article for administrators.
 * Read-only: publishing stays an administrator action in the editorial review queue,
 * and the rows here link to the public article rather than to the editor.
 */
export default async function PublishedPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/published");
  if (!user.handle) redirect("/onboarding/handle?callbackUrl=/dashboard/published");
  if (!canAccessDashboard(user.permissions)) redirect("/dashboard");

  const readsEverything = hasPermission(user.permissions, "article:read:any");
  const articles = readsEverything ? await listAllArticles() : await listDraftsForUser(user.id);

  const published = articles
    .filter(
      (article) =>
        article.workflowStatus === "PUBLISHED" &&
        canReadArticle(user.permissions, user.id, toAccessRecord(article)),
    )
    .sort((a, b) => (b.publishedOn ?? "").localeCompare(a.publishedOn ?? ""));

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title="Published"
        lede={
          readsEverything
            ? "Every article in the public archive."
            : "Your articles in the public archive. Published articles can no longer be edited."
        }
      />
      <Container className={styles.page}>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.back}>
            <ArrowRightIcon size={16} />
            Back to dashboard
          </Link>
        </div>

        {published.length === 0 ? (
          <p className={styles.empty}>
            Nothing published yet. An article appears here once it has been through peer review,
            approved, and published to the archive by an administrator.
          </p>
        ) : (
          <ul className={styles.list}>
            {published.map((article) => (
              <li key={article.id} className={styles.item}>
                <div className={styles.itemMain}>
                  <h2 className={styles.itemTitle}>
                    <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p className={styles.itemMeta}>
                    <StatusPill>{WORKFLOW_LABELS[article.workflowStatus]}</StatusPill>
                    <span>
                      {article.publishedOn
                        ? `Published ${formatDate(article.publishedOn)}`
                        : "Published"}
                    </span>
                  </p>
                </div>
                <div className={styles.itemLinks}>
                  <Link href={`/articles/${article.slug}`} className={styles.link}>
                    Read in the archive
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

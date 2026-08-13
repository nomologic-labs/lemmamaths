import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ArrowRightIcon } from "@/components/ui/icons";
import { canAccessAssignedReviews } from "@/lib/articles/review-access";
import { listAssignedReviewsForUser } from "@/lib/articles/review-store";
import { assignmentStatusLabel, reviewDecisionLabel } from "@/lib/articles/review-labels";
import { WORKFLOW_LABELS } from "@/lib/articles/workflow-labels";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import styles from "@/components/review/ReviewWorkspace.module.css";

export const metadata: Metadata = {
  title: "Peer review",
  robots: { index: false },
};

export default async function AssignedReviewsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/review/assigned");
  if (!user.handle) redirect("/onboarding/handle?callbackUrl=/dashboard/review/assigned");
  if (!canAccessAssignedReviews(user.permissions)) redirect("/dashboard");

  const items = await listAssignedReviewsForUser(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Peer review"
        title="Assigned to me"
        lede="Articles another contributor has written that you have been asked to read. You can only open articles assigned to you."
      />
      <Container className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.links}>
            <Link href="/dashboard" className={`${styles.link} ${styles.linkBack}`}>
              <ArrowRightIcon size={16} />
              Dashboard
            </Link>
            {user.permissions.has("article:approve") && (
              <Link href="/dashboard/review" className={styles.link}>
                Editorial review
              </Link>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>
            Nothing assigned to you yet. An administrator assigns reviewers once an article has
            been submitted for peer review.
          </p>
        ) : (
          <ul className={styles.assignedList}>
            {items.map((item) => (
              <li key={`${item.articleId}-${item.roundNumber}`} className={styles.assignedItem}>
                <h2 className={styles.itemTitle}>
                  <Link href={`/dashboard/review/${item.articleId}`}>{item.title}</Link>
                </h2>
                <p className={styles.itemMeta}>
                  <StatusPill>{WORKFLOW_LABELS[item.workflowStatus]}</StatusPill>
                  <span>{item.authorHandles.map((handle) => `@${handle}`).join(", ")}</span>
                  <span>·</span>
                  <span>Round {item.roundNumber}</span>
                  <span>·</span>
                  <span>
                    {reviewDecisionLabel(item.decision) ??
                      assignmentStatusLabel(item.assignmentStatus)}
                  </span>
                  <span>·</span>
                  <span>
                    Assigned{" "}
                    {item.assignedAt.toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <div className={styles.itemActions}>
                  <Link href={`/dashboard/review/${item.articleId}`} className={styles.buttonPrimary}>
                    Open review
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

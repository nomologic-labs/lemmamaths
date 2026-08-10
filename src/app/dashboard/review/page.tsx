import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ReviewQueueClient } from "@/components/review/ReviewQueueClient";
import { canManageReviewQueue } from "@/lib/articles/review-access";
import { listEligibleReviewers, listReviewQueue } from "@/lib/articles/review-store";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import styles from "@/components/review/ReviewWorkspace.module.css";

export const metadata: Metadata = {
  title: "Editorial review",
  robots: { index: false },
};

export default async function ReviewQueuePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/review");
  if (!user.handle) redirect("/onboarding/handle?callbackUrl=/dashboard/review");
  if (!canManageReviewQueue(user.roles)) redirect("/dashboard");

  const [items, eligibleReviewers] = await Promise.all([
    listReviewQueue(),
    listEligibleReviewers(),
  ]);

  const serializable = items.map((item) => ({
    ...item,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Review queue"
        lede="Submitted manuscripts, reviewer assignments, and editorial decisions."
      />
      <Container className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.links}>
            <Link href="/dashboard" className={styles.link}>
              ← Dashboard
            </Link>
            <Link href="/dashboard/review/assigned" className={styles.link}>
              Assigned to me
            </Link>
          </div>
        </div>
        <ReviewQueueClient items={serializable} eligibleReviewers={eligibleReviewers} />
        <Link href="/dashboard" className={styles.link} style={{ display: "inline-flex", marginTop: "2rem", gap: "0.35rem" }}>
          Back to dashboard
          <ArrowRightIcon size={16} />
        </Link>
      </Container>
    </>
  );
}

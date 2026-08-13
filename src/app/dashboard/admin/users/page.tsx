import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";
import { requirePermission } from "@/lib/auth/guards";
import { listManagedUsers } from "@/lib/auth/account-management";
import { AdminUsersTable } from "./AdminUsersTable";
import styles from "./AdminUsers.module.css";

export const metadata: Metadata = {
  title: "Accounts",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  let actor;
  try {
    actor = await requirePermission("account:manage");
  } catch {
    redirect("/dashboard");
  }

  const users = await listManagedUsers();

  return (
    <>
      <PageHeader
        eyebrow="Administer"
        title="Accounts"
        lede="Approve contributors, change account status, and edit names and handles. Every change is recorded in the audit log."
      />
      <Container className={styles.page}>
        <p className={styles.intro}>
          A new Google sign-in becomes a Contributor with the status Pending. Approving the
          account is what lets someone write, submit, and review articles.
        </p>
        <AdminUsersTable users={users} currentUserId={actor.id} />
        <Link href="/dashboard" className={styles.back}>
          <ArrowRightIcon size={16} />
          Back to dashboard
        </Link>
      </Container>
    </>
  );
}

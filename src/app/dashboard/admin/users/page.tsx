import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { listManagedUsers } from "@/lib/auth/role-management";
import { AdminUsersTable } from "./AdminUsersTable";
import styles from "./AdminUsers.module.css";

export const metadata: Metadata = {
  title: "User administration",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  let actor;
  try {
    actor = await requirePermission("role:manage");
  } catch {
    redirect("/dashboard");
  }

  const users = await listManagedUsers();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Lemma users"
        lede="Grant and revoke contributor roles. Role changes are recorded in the audit log."
      />
      <Container className={styles.page}>
        <p className={styles.intro}>
          A Lemma account alone does not confer contributor capabilities. Assign roles here after a
          student has signed in and chosen a handle.
        </p>
        <AdminUsersTable users={users} currentUserId={actor.id} />
        <Link href="/dashboard" className={styles.back}>
          Back to dashboard
        </Link>
      </Container>
    </>
  );
}

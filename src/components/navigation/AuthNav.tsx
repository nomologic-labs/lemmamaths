"use client";

import Link from "next/link";
import { signOutAction } from "@/lib/auth/sign-in";
import { navDisplayLabel, type NavSession } from "./session";
import styles from "./AuthNav.module.css";

type AuthNavProps = {
  session: NavSession;
  onNavigate?: () => void;
};

export function AuthNav({ session, onNavigate }: AuthNavProps) {
  if (!session) {
    return (
      <div>
        <p className={styles.groupLabel}>Contribute</p>
        <Link href="/dashboard" onClick={onNavigate} className={styles.dashboard}>
          Contributor dashboard
        </Link>
      </div>
    );
  }

  const label = navDisplayLabel(session.user);

  return (
    <div>
      <p className={styles.groupLabel}>Contribute</p>
      <div className={styles.signedIn}>
        <p className={styles.identity}>
          <span className={styles.identityLabel}>Signed in</span>
          <span className={styles.identityValue}>{label}</span>
        </p>
        {session.contributorLinks.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            onClick={onNavigate}
            className={styles.dashboard}
          >
            {link.label}
          </Link>
        ))}
        {session.contributorLinks.length === 0 ? (
          <p className={styles.awaiting}>
            Your account is waiting for a Lemma administrator to approve it.
          </p>
        ) : null}
        <form action={signOutAction}>
          <button type="submit" className={styles.signOut}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

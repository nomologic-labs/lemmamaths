import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  ArrowRightIcon,
  DashboardIcon,
  EditorialIcon,
  InReviewIcon,
  ReviewedIcon,
} from "@/components/ui/icons";
import { ACCOUNT_ROLE_LABELS } from "@/lib/auth/account-labels";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { getMissingAuthEnvVars } from "@/lib/auth/env";
import { canAccessDashboard } from "@/lib/auth/nav-links";
import { signInWithGoogle } from "@/lib/auth/sign-in";
import styles from "./Dashboard.module.css";

export const metadata: Metadata = {
  title: "Contributor dashboard",
  description: "Write, submit and review Lemma articles.",
  robots: { index: false },
};

/** Shown to signed-out visitors: what an approved account can do. */
const PREVIEW_PANELS = [
  {
    Icon: DashboardIcon,
    title: "My drafts",
    body: "Work in progress, written in a structured editor that produces an article's blocks directly rather than asking you to write markup.",
  },
  {
    Icon: EditorialIcon,
    title: "Peer review",
    body: "Articles assigned to you to read, with comments addressed to individual blocks of an article rather than to the piece as a whole.",
  },
  {
    Icon: ReviewedIcon,
    title: "Published",
    body: "Your articles once an administrator has published them to the archive, where anyone can read them.",
  },
] as const;

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const missingAuthEnvVars = getMissingAuthEnvVars();

  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Contribute"
          title="Contributor dashboard"
          lede="Where writing, peer review and publication happen."
        />
        <Container className={styles.page}>
          <p className={styles.notice}>
            <span className={styles.noticeTag}>Sign in</span>
            <span>
              Lemma is in beta. Sign in to create an account, then an administrator approves it
              before you can start writing.
            </span>
          </p>

          <p className={styles.intro}>
            An article goes one way through Lemma. You write a draft, submit it for peer review,
            another contributor reads it and comments, you revise and resubmit if they ask for
            changes, and an administrator approves and publishes the finished article to the
            archive.
          </p>

          <div className={styles.signInCard}>
            <p className={styles.signInIntro}>
              Contributors sign in with a personal Google account. Your school does not need to
              manage access.
            </p>
            {missingAuthEnvVars.length > 0 ? (
              <p className={styles.signInNote}>
                Authentication is not configured on this environment yet. Set{" "}
                <code>{missingAuthEnvVars.join(", ")}</code> in <code>.env.local</code>, or use
                the <Link href="/login">sign-in page</Link> for setup instructions.
              </p>
            ) : null}
            <form
              action={async () => {
                "use server";
                await signInWithGoogle("/dashboard");
              }}
            >
              <button
                type="submit"
                className={styles.googleButton}
                disabled={missingAuthEnvVars.length > 0}
              >
                Sign in with Google
              </button>
            </form>
            <p className={styles.signInNote}>
              Signing in creates a contributor account with the status Pending. An administrator
              approves it before writing and review become available.
            </p>
          </div>

          <div className={styles.panels}>
            {PREVIEW_PANELS.map(({ Icon, title, body }) => (
              <section key={title} className={styles.panel}>
                <div className={styles.panelHead}>
                  <Icon size={18} />
                  <h2 className={styles.panelTitle}>{title}</h2>
                </div>
                <p className={styles.panelBody}>{body}</p>
                <StatusPill className={styles.phase}>After approval</StatusPill>
              </section>
            ))}
          </div>

          <Link href="/about#writing" className={styles.back}>
            How writing for Lemma works today
            <ArrowRightIcon size={16} />
          </Link>
        </Container>
      </>
    );
  }

  if (!user.handle) {
    redirect("/onboarding/handle?callbackUrl=/dashboard");
  }

  if (user.accountStatus === "suspended") {
    return (
      <>
        <PageHeader
          eyebrow="Contribute"
          title="Account suspended"
          lede={`Signed in as @${user.handle}. Your Lemma account has been suspended.`}
        />
        <Container className={styles.page}>
          <p className={styles.notice}>
            <span className={styles.noticeTag}>Suspended</span>
            <span>
              Your account is suspended. Writing and peer review are unavailable until a Lemma
              administrator restores it. Your drafts are kept.
            </span>
          </p>
          <p className={styles.intro}>
            If you believe this is a mistake, contact a Lemma administrator.
          </p>
          <Link href="/about#writing" className={styles.back}>
            How writing for Lemma works today
            <ArrowRightIcon size={16} />
          </Link>
        </Container>
      </>
    );
  }

  if (user.accountStatus === "pending") {
    return (
      <>
        <PageHeader
          eyebrow="Contribute"
          title="Contributor dashboard"
          lede={`Signed in as @${user.handle}. Your account is awaiting approval.`}
        />
        <Container className={styles.page}>
          <p className={styles.notice}>
            <span className={styles.noticeTag}>Pending</span>
            <span>
              Your account is waiting for a Lemma administrator to approve it. You can set your
              handle now; writing and peer review become available once it is approved.
            </span>
          </p>
          <p className={styles.intro}>
            If you expected access already, contact a Lemma administrator.
          </p>
          <Link href="/about#writing" className={styles.back}>
            How writing for Lemma works today
            <ArrowRightIcon size={16} />
          </Link>
        </Container>
      </>
    );
  }

  if (!canAccessDashboard(user.permissions)) {
    redirect("/dashboard");
  }

  const roleLabel = ACCOUNT_ROLE_LABELS[user.accountRole];

  const panels = [
    {
      Icon: DashboardIcon,
      title: "My drafts",
      body: "Articles you are writing, and articles you have sent for peer review.",
      href: "/dashboard/drafts",
      show: user.permissions.has("article:create"),
    },
    {
      Icon: EditorialIcon,
      title: "Peer review",
      body: "Articles assigned to you to read, where you comment on individual blocks and send a recommendation.",
      href: "/dashboard/review/assigned",
      show: user.permissions.has("article:review"),
    },
    {
      Icon: ReviewedIcon,
      title: "Published",
      body: "Your articles in the public archive, once an administrator has published them.",
      href: "/dashboard/published",
      show: user.permissions.has("article:create"),
    },
    {
      Icon: InReviewIcon,
      title: "Editorial review",
      body: "Assign reviewers, request revisions, approve articles, and publish them to the archive.",
      href: "/dashboard/review",
      show: user.permissions.has("article:approve"),
    },
    {
      Icon: EditorialIcon,
      title: "Accounts",
      body: "Approve contributor accounts, suspend or restore them, and edit names and handles.",
      href: "/dashboard/admin/users",
      show: user.permissions.has("account:manage"),
    },
  ].filter((panel) => panel.show);

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title={user.accountRole === "administrator" ? "Administrator dashboard" : "Contributor dashboard"}
        lede={`Signed in as @${user.handle} with ${roleLabel} access.`}
      />
      <Container className={styles.page}>
        <p className={styles.notice}>
          <span className={styles.noticeTag}>Active</span>
          <span>
            Your account is approved. Everything below is available to you now.
          </span>
        </p>

        <p className={styles.intro}>
          Write in <Link href="/dashboard/drafts">My drafts</Link> and submit an article for peer
          review when it is ready. Another contributor reads it and comments; if they ask for
          changes, revise the draft and resubmit it. An administrator approves the finished
          article and publishes it, after which it appears in{" "}
          <Link href="/dashboard/published">Published</Link> and in the public archive.
        </p>

        <div className={styles.panels}>
          {panels.map(({ Icon, title, body, href }) => (
            <section key={title} className={styles.panel}>
              <div className={styles.panelHead}>
                <Icon size={18} />
                <h2 className={styles.panelTitle}>
                  <Link href={href}>{title}</Link>
                </h2>
              </div>
              <p className={styles.panelBody}>{body}</p>
            </section>
          ))}
        </div>

        <Link href="/about#writing" className={styles.back}>
          How writing for Lemma works
          <ArrowRightIcon size={16} />
        </Link>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ArrowRightIcon,
  DashboardIcon,
  EditorialIcon,
  InReviewIcon,
  ReviewedIcon,
} from "@/components/ui/icons";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { canAccessDashboard } from "@/lib/auth/nav-links";
import { signInWithGoogle } from "@/lib/auth/sign-in";
import styles from "./Dashboard.module.css";

export const metadata: Metadata = {
  title: "Author dashboard",
  description: "A preview of the authoring and review tools planned for Lemma.",
  robots: { index: false },
};

const PREVIEW_PANELS = [
  {
    Icon: DashboardIcon,
    title: "Drafts",
    body: "Work in progress, with the structured editor that produces an article's blocks directly rather than asking students to write markup.",
    phase: "Later phase",
  },
  {
    Icon: InReviewIcon,
    title: "Submissions",
    body: "What you have sent to the editors, where it is in the review process, and what a referee has asked you to change.",
    phase: "Later phase",
  },
  {
    Icon: EditorialIcon,
    title: "Refereeing",
    body: "Drafts assigned to you to read, with comments addressed to individual blocks of an article rather than to the piece as a whole.",
    phase: "Later phase",
  },
  {
    Icon: ReviewedIcon,
    title: "Published",
    body: "Your articles in the archive, their revision history, and the record of who refereed each one.",
    phase: "Later phase",
  },
] as const;

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Contribute"
          title="Author dashboard"
          lede="Where writing, submitting and refereeing will happen once Lemma has accounts."
        />
        <Container className={styles.page}>
          <p className={styles.notice}>
            <span className={styles.noticeTag}>Preview</span>
            <span>
              Nothing on this page is connected yet. Authentication, article storage and the
              review workflow are separate pieces of work, and this prototype deliberately
              implements none of them.
            </span>
          </p>

          <p className={styles.intro}>
            Lemma currently runs on conversations with the editorial team: an author brings a
            proposal, a draft is written, someone referees it, and an editor publishes it.
            The dashboard is where each of those steps will move once there is somewhere for
            an account to live. The sections below are the shape it is being built towards.
          </p>

          <div className={styles.signInCard}>
            <p className={styles.signInIntro}>
              Lemma contributors sign in with a personal Google account. Your school does not
              need to manage access.
            </p>
            <form
              action={async () => {
                "use server";
                await signInWithGoogle("/dashboard");
              }}
            >
              <button type="submit" className={styles.googleButton}>
                Sign in with Google
              </button>
            </form>
            <p className={styles.signInNote}>
              Signing in does not automatically make you an author. Editorial roles are granted
              separately once your account exists.
            </p>
          </div>

          <div className={styles.panels}>
            {PREVIEW_PANELS.map(({ Icon, title, body, phase }) => (
              <section key={title} className={styles.panel}>
                <div className={styles.panelHead}>
                  <Icon size={18} />
                  <h2 className={styles.panelTitle}>{title}</h2>
                </div>
                <p className={styles.panelBody}>{body}</p>
                <span className={styles.phase}>{phase}</span>
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

  if (!canAccessDashboard(user.roles)) {
    return (
      <>
        <PageHeader
          eyebrow="Contribute"
          title="Contributor dashboard"
          lede={`Signed in as @${user.handle}. Your Lemma account exists, but no contributor role has been assigned yet.`}
        />
        <Container className={styles.page}>
          <p className={styles.notice}>
            <span className={styles.noticeTag}>Awaiting access</span>
            <span>
              Authentication is complete and your handle is set. An editor or administrator must
              grant you a contributor role before drafting, review, or editorial tools become
              available.
            </span>
          </p>
          <p className={styles.intro}>
            If you expected access already, contact the Lemma editorial team. Signing in with
            Google does not automatically make you an author.
          </p>
          <Link href="/about#writing" className={styles.back}>
            How writing for Lemma works today
            <ArrowRightIcon size={16} />
          </Link>
        </Container>
      </>
    );
  }

  const panels = [
    {
      Icon: DashboardIcon,
      title: "Drafts",
      body: "Work in progress in the structured editor that produces an article's blocks directly.",
      phase: "Available",
      href: "/dashboard/drafts" as string | undefined,
      show: user.permissions.has("article:create"),
    },
    {
      Icon: InReviewIcon,
      title: "Submissions",
      body: "Editorial queue for submitted manuscripts, reviewer assignment, and decisions.",
      phase: "Available",
      href: "/dashboard/review",
      show: user.permissions.has("article:approve"),
    },
    {
      Icon: EditorialIcon,
      title: "Refereeing",
      body: "Articles assigned to you, with comments addressed to individual block ids.",
      phase: "Available",
      href: "/dashboard/review/assigned",
      show: user.permissions.has("article:review"),
    },
    {
      Icon: ReviewedIcon,
      title: "Published",
      body: "Your articles in the archive, their revision history, and the record of who refereed each one.",
      phase: "Later phase",
      href: undefined,
      show: true,
    },
  ].filter((panel) => panel.show);

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title="Contributor dashboard"
        lede={`Signed in as @${user.handle} with ${user.roles.join(", ")} access.`}
      />
      <Container className={styles.page}>
        <p className={styles.notice}>
          <span className={styles.noticeTag}>Authorized</span>
          <span>
            Drafting, submission, and block-level review tools are available according to your
            roles. Publishing to the public archive remains a later phase.
          </span>
        </p>

        <p className={styles.intro}>
          Use <Link href="/dashboard/drafts">My drafts</Link> to write. Editors manage the{" "}
          <Link href="/dashboard/review">review queue</Link>; referees open{" "}
          <Link href="/dashboard/review/assigned">assigned reviews</Link>.
        </p>

        <div className={styles.panels}>
          {panels.map(({ Icon, title, body, phase, href }) => (
            <section key={title} className={styles.panel}>
              <div className={styles.panelHead}>
                <Icon size={18} />
                <h2 className={styles.panelTitle}>
                  {href ? <Link href={href}>{title}</Link> : title}
                </h2>
              </div>
              <p className={styles.panelBody}>{body}</p>
              <span className={styles.phase}>{phase}</span>
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

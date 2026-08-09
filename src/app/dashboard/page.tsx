import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ArrowRightIcon,
  DashboardIcon,
  EditorialIcon,
  InReviewIcon,
  ReviewedIcon,
} from "@/components/ui/icons";
import styles from "./Dashboard.module.css";

export const metadata: Metadata = {
  title: "Author dashboard",
  description: "A preview of the authoring and review tools planned for Lemma.",
  robots: { index: false },
};

const PANELS = [
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
];

/**
 * A deliberate placeholder.
 *
 * Authoring, submission and refereeing all depend on real accounts, and accounts are a
 * separate phase with its own security decisions. Showing the shape of the dashboard
 * without wiring anything to it is honest; a page of controls that silently do nothing
 * would not be.
 */
export default function DashboardPage() {
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

        <div className={styles.panels}>
          {PANELS.map(({ Icon, title, body, phase }) => (
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

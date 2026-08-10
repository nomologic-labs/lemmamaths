import type { Metadata } from "next";
import Link from "next/link";
import { PeerReviewBadge } from "@/components/articles/PeerReviewBadge";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";
import { TOPICS } from "@/data/topics";
import { listPublishedSummaries, listPublicAuthors } from "@/lib/articles/public";
import { REVIEW_DESCRIPTIONS, REVIEW_ORDER } from "@/lib/articles/labels";
import styles from "./About.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Lemma is a student-run mathematical publication: writing by students, refereed by students, kept as a permanent archive rather than a newsletter.",
};

const STAGES = [
  {
    name: "Proposal",
    body: "An author brings a subject and an angle. Most are turned around at this stage — usually because the piece would be a summary of a textbook chapter rather than an argument about it.",
  },
  {
    name: "Drafting",
    body: "The author writes. Mathematics is typeset properly, figures are the author's own, and code is included when running it is part of the argument rather than decoration.",
  },
  {
    name: "Refereeing",
    body: "One or two other students read the draft in full and check it. A referee's job is to find the step that does not follow, not to agree that the subject is interesting.",
  },
  {
    name: "Revision and publication",
    body: "Corrections go back to the author. What is published records who refereed it and when, so a reader can see what the label is based on.",
  },
];

export default async function AboutPage() {
  const [summaries, authors] = await Promise.all([
    listPublishedSummaries(),
    listPublicAuthors(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="What Lemma is"
        lede="A journal and a permanent archive of mathematical writing by students, refereed by students."
      />
      <Container className={styles.page}>
        <div className={styles.prose}>
          <p className={styles.lead}>
            Students write a great deal of mathematics and almost none of it survives the
            term it was written in. An investigation gets handed in, marked and filed; a
            proof someone worked out properly for the first time ends up in a notebook. The
            work is often good. It simply has nowhere to go.
          </p>
          <p>
            Lemma exists to give it somewhere. It publishes articles, investigations,
            essays, problem sets and reports across {TOPICS.length} fields of mathematics,
            and it keeps them. There are currently {summaries.length} pieces in the
            archive from {authors.length} contributors, and nothing is ever taken down
            because it has stopped being recent.
          </p>

          <h2 id="writing" className={styles.h2}>
            Written by students
          </h2>
          <p>
            Every author here is at school. That is the point rather than a caveat: writing
            something up for a reader who is not marking it is a different exercise from
            answering a question, and it is the one that turns a result you can reproduce
            into a result you understand.
          </p>
          <p>
            It also means the writing is pitched at the people doing the same courses.
            An article on the epsilon-delta definition is written by someone who found it
            confusing recently enough to remember why, which is not something a textbook
            can offer.
          </p>

          <h2 id="review" className={styles.h2}>
            Refereed by students
          </h2>
          <p>
            Nothing appears without having been read by someone other than its author.
            Refereeing at Lemma is a genuine obligation rather than a formality — a
            referee reads the whole piece, checks the mathematics, and returns the places
            where an argument has a hole in it.
          </p>
          <ol className={styles.stages}>
            {STAGES.map((stage) => (
              <li key={stage.name} className={styles.stage}>
                <div>
                  <h3 className={styles.stageName}>{stage.name}</h3>
                  <p className={styles.stageBody}>{stage.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p>
            Not everything warrants the same scrutiny, so the archive says which kind of
            reading a piece has had. The label is on every card and at the foot of every
            article.
          </p>
          <div className={styles.labels}>
            {REVIEW_ORDER.map((status) => (
              <div key={status} className={styles.label}>
                <PeerReviewBadge status={status} size="large" />
                <p className={styles.labelBody}>{REVIEW_DESCRIPTIONS[status]}</p>
              </div>
            ))}
          </div>

          <h2 className={styles.h2}>A publication, not a feed</h2>
          <p>
            Lemma is built as an archive first. Articles are filed under fields rather than
            dated into a stream, the search covers the full text of everything published,
            and every filtered view is a link that will still work in five years. A piece
            from two years ago is as findable as one from this week, which is the only
            arrangement under which writing something down is worth the effort.
          </p>
          <p>
            Mathematics is typeset rather than screenshotted, figures carry captions and
            alternative text, and code blocks are highlighted from their source so that a
            reader can copy and run them. These are not features so much as the minimum
            for taking the writing seriously.
          </p>

          <div className={styles.actions}>
            <Link href="/articles" className={`${styles.action} ${styles.actionPrimary}`}>
              Read the archive
              <ArrowRightIcon size={16} />
            </Link>
            <Link href="/topics" className={styles.action}>
              Browse by field
              <ArrowRightIcon size={16} />
            </Link>
            <Link href="/authors" className={styles.action}>
              Meet the contributors
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}

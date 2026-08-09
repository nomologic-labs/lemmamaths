import type { Metadata } from "next";
import { AuthorList } from "@/components/authors/AuthorCard";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { countArticlesByAuthor } from "@/data/articles";
import { AUTHORS } from "@/data/authors";
import styles from "./Authors.module.css";

export const metadata: Metadata = {
  title: "Authors",
  description:
    "The students who write and referee for Lemma, with what each of them has published.",
};

export default function AuthorsPage() {
  // Most prolific first, ties alphabetical: an index of contributors, not a sign-up list.
  const authors = [...AUTHORS].sort(
    (a, b) =>
      countArticlesByAuthor(b.id) - countArticlesByAuthor(a.id) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        eyebrow="Contributors"
        title="Authors"
        lede="Everything in the archive was written by a student, and most of it was refereed by one. These are the people currently writing for Lemma."
      />
      <Container className={styles.page}>
        <AuthorList authors={authors} />
        <p className={styles.note}>
          Author profiles are part of the prototype and are not yet accounts. Writing for
          Lemma currently means talking to the editorial team.
        </p>
      </Container>
    </>
  );
}

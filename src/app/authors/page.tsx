import type { Metadata } from "next";
import { AuthorList } from "@/components/authors/AuthorCard";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  countArticlesByAuthorHandle,
  listPublicAuthors,
} from "@/lib/articles/public";
import styles from "./Authors.module.css";

export const metadata: Metadata = {
  title: "Authors",
  description:
    "The students who write and referee for Lemma, with what each of them has published.",
};

export default async function AuthorsPage() {
  const authors = await listPublicAuthors();
  const counts = Object.fromEntries(
    await Promise.all(
      authors.map(async (author) => [author.id, await countArticlesByAuthorHandle(author.id)]),
    ),
  );

  const sorted = [...authors].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        eyebrow="Contributors"
        title="Authors"
        lede="Everything in the archive was written by a student, and most of it was refereed by one. These are the people currently writing for Lemma."
      />
      <Container className={styles.page}>
        <AuthorList authors={sorted} articleCounts={counts} />
        <p className={styles.note}>
          Public author pages show only published profiles. Signing in does not create a
          public author page until a public profile is set.
        </p>
      </Container>
    </>
  );
}

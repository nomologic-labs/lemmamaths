import Link from "next/link";
import { topicName } from "@/data/topics";
import type { Author } from "@/data/types";
import styles from "./AuthorCard.module.css";

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AuthorCard({
  author,
  articleCount = 0,
}: {
  author: Author;
  articleCount?: number;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.monogram} aria-hidden="true">
        {initials(author.name)}
      </span>
      <h2 className={styles.name}>
        <Link href={`/authors/${author.id}`}>{author.name}</Link>
        <span className={styles.role}>{author.role}</span>
      </h2>
      <p className={styles.bio}>{author.bio}</p>
      <div className={styles.meta}>
        <span className={styles.count}>
          {articleCount} {articleCount === 1 ? "article" : "articles"}
        </span>
        <span>{author.interests.map(topicName).join(" · ")}</span>
      </div>
    </article>
  );
}

export function AuthorList({
  authors,
  articleCounts = {},
}: {
  authors: readonly Author[];
  articleCounts?: Record<string, number>;
}) {
  return (
    <div className={styles.list}>
      {authors.map((author) => (
        <AuthorCard
          key={author.id}
          author={author}
          articleCount={articleCounts[author.id] ?? 0}
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import styles from "./ArticleContents.module.css";

export type ContentsEntry = { id: string; text: string; level: 2 | 3 };

/**
 * The section rail beside a long article.
 *
 * Which entry is current is decided from the headings' positions on each scroll rather
 * than from an IntersectionObserver: the observer answers "is this heading on screen",
 * which is not the same question. Between two headings none is on screen, and the rail
 * would go blank exactly where the reader is doing most of their reading.
 */
export function ArticleContents({ entries }: { entries: ContentsEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    if (entries.length === 0) return;

    const update = () => {
      // The heading whose top has most recently passed the reading line, which sits a
      // little below the fixed header.
      const line = window.innerHeight * 0.25;
      let current = entries[0]!.id;
      for (const entry of entries) {
        const element = document.getElementById(entry.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= line) current = entry.id;
        else break;
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav className={styles.contents} aria-label="Sections of this article">
      <p className={styles.label}>Contents</p>
      <ol className={styles.list}>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={[styles.item, entry.level === 3 ? styles.sub : ""].filter(Boolean).join(" ")}
            data-active={entry.id === activeId}
          >
            <a href={`#${entry.id}`} aria-current={entry.id === activeId ? "true" : undefined}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

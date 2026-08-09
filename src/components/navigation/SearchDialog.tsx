"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
import type { SearchEntry } from "@/lib/articles/search-index";
import { FORMAT_LABELS } from "@/lib/articles/labels";
import { useDialog } from "@/lib/hooks/useDialog";
import styles from "./SearchDialog.module.css";

const MAX_RESULTS = 7;

export type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
  index: readonly SearchEntry[];
};

/**
 * A quick way into a known article. It is intentionally not the archive: it matches on
 * title, author, topic and tag only, shows at most seven results, and hands anything
 * more involved to /articles, which has the real filtering.
 *
 * Mounted only while open so the term and highlight reset without an effect.
 */
export function SearchDialog({ open, onClose, index }: SearchDialogProps) {
  if (!open) return null;
  return <SearchDialogOpen onClose={onClose} index={index} />;
}

function SearchDialogOpen({
  onClose,
  index,
}: {
  onClose: () => void;
  index: readonly SearchEntry[];
}) {
  const router = useRouter();
  const ref = useDialog(true, onClose);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const terms = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return index.slice(0, MAX_RESULTS);
    return index
      .filter((entry) => terms.every((t) => entry.match.includes(t)))
      .slice(0, MAX_RESULTS);
  }, [index, term]);

  // Keep the highlighted row visible when the reader arrows past the fold.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (slug: string) => {
    onClose();
    router.push(`/articles/${slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = results[active];
      if (chosen) go(chosen.slug);
      else if (term.trim()) {
        onClose();
        router.push(`/articles?q=${encodeURIComponent(term.trim())}`);
      }
    }
  };

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search articles"
        onKeyDown={onKeyDown}
      >
        <div className={styles.field}>
          <SearchIcon size={19} />
          <input
            className={styles.input}
            type="search"
            placeholder="Search by title, author, topic or tag"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setActive(0);
            }}
            autoComplete="off"
            spellCheck={false}
            aria-controls="lemma-search-results"
          />
          <button type="button" className={styles.dismiss} onClick={onClose}>
            Esc
          </button>
        </div>

        <div className={styles.results} id="lemma-search-results" ref={listRef} role="listbox">
          {results.length === 0 ? (
            <p className={styles.empty}>
              Nothing matches “{term.trim()}”.
              <span className={styles.emptyHint}>
                <br />
                Press Enter to search the full archive instead.
              </span>
            </p>
          ) : (
            results.map((entry, i) => (
              <button
                key={entry.slug}
                type="button"
                role="option"
                aria-selected={i === active}
                className={[styles.result, i === active ? styles.resultActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(entry.slug)}
              >
                <span className={styles.resultTitle}>{entry.title}</span>
                <span className={styles.resultMeta}>
                  {entry.authors} · {entry.topic} · {FORMAT_LABELS[entry.format]}
                </span>
              </button>
            ))
          )}
        </div>

        <div className={styles.foot}>
          <span className={styles.keys}>↑↓ to move · Enter to open · Esc to close</span>
          <button
            type="button"
            className={styles.footLink}
            onClick={() => {
              onClose();
              router.push(term.trim() ? `/articles?q=${encodeURIComponent(term.trim())}` : "/articles");
            }}
          >
            Browse the full archive
            <ArrowRightIcon size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTHORS } from "@/data/authors";
import { TOPICS } from "@/data/topics";
import { FORMAT_LABELS, FORMAT_ORDER, REVIEW_LABELS, REVIEW_ORDER } from "@/lib/articles/labels";
import {
  SORT_KEYS,
  SORT_LABELS,
  countActiveFilters,
  serialiseArchiveQuery,
  type ArchiveQuery,
  type FacetCounts,
  type SortKey,
} from "@/lib/articles/query";
import { CheckIcon, ChevronDownIcon, CloseIcon, FilterIcon, SearchIcon } from "@/components/ui/icons";
import styles from "./ArchiveFilters.module.css";

export type ArchiveFiltersProps = {
  query: ArchiveQuery;
  facets: FacetCounts;
};

type Option = { value: string; label: string; count: number };
type FacetName = "topic" | "format" | "review" | "author";
type Selection = Record<FacetName, string[]>;

const FACET_KEYS: readonly FacetName[] = ["topic", "format", "review", "author"];

function selectionFrom(query: ArchiveQuery): Selection {
  return {
    topic: [...query.topics],
    format: [...query.formats],
    review: [...query.review],
    author: [...query.authors],
  };
}

/**
 * The archive's controls.
 *
 * The whole thing is one `<form method="get" action="/articles">` whose input names are
 * the query parameters `parseArchiveQuery` reads, so submitting it natively — with
 * scripting off — produces a correctly filtered archive. What this component adds is
 * immediacy: a checkbox or sort change rewrites the URL at once, and typing does so
 * after a short pause rather than on every keystroke.
 *
 * Local state is re-seeded when the serialised URL query changes (chip links, back
 * button) by adjusting state during render — the pattern React recommends instead of a
 * syncing effect, so typing is not fought and the filter panel stays open.
 *
 * `router.replace` rather than `push` keeps the back button meaning "the page before the
 * archive" instead of replaying every intermediate filter state.
 */
export function ArchiveFilters({ query, facets }: ArchiveFiltersProps) {
  const router = useRouter();
  const panelId = useId();
  const queryKey = serialiseArchiveQuery(query);

  const [search, setSearch] = useState(query.search);
  const [sort, setSort] = useState<SortKey>(query.sort);
  const [selection, setSelection] = useState<Selection>(() => selectionFrom(query));
  const [panelOpen, setPanelOpen] = useState(false);
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);

  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey);
    setSearch(query.search);
    setSort(query.sort);
    setSelection(selectionFrom(query));
  }

  const navigate = useCallback(
    (next: { search: string; sort: SortKey; selection: Selection }) => {
      const params = new URLSearchParams();
      if (next.search.trim()) params.set("q", next.search.trim());
      for (const key of FACET_KEYS) {
        for (const value of next.selection[key]) params.append(key, value);
      }
      if (next.sort !== "newest") params.set("sort", next.sort);
      const href = params.toString();
      router.replace(href ? `/articles?${href}` : "/articles", { scroll: false });
    },
    [router],
  );

  // Debounced so a typed word is one navigation rather than one per letter.
  useEffect(() => {
    if (search === query.search) return;
    const timer = setTimeout(() => {
      navigate({ search, sort, selection });
    }, 320);
    return () => clearTimeout(timer);
  }, [search, query.search, sort, selection, navigate]);

  const toggle = (facet: FacetName, value: string, checked: boolean) => {
    const nextSelection = {
      ...selection,
      [facet]: checked
        ? [...selection[facet], value]
        : selection[facet].filter((entry) => entry !== value),
    };
    setSelection(nextSelection);
    navigate({ search, sort, selection: nextSelection });
  };

  const changeSort = (value: SortKey) => {
    setSort(value);
    navigate({ search, sort: value, selection });
  };

  const activeCount = countActiveFilters(query);

  const options: Record<FacetName, Option[]> = {
    topic: TOPICS.map((topic) => ({
      value: topic.id,
      label: topic.name,
      count: facets.topics[topic.id] ?? 0,
    })),
    format: FORMAT_ORDER.map((format) => ({
      value: format,
      label: FORMAT_LABELS[format],
      count: facets.formats[format] ?? 0,
    })),
    review: REVIEW_ORDER.map((status) => ({
      value: status,
      label: REVIEW_LABELS[status],
      count: facets.review[status] ?? 0,
    })),
    // Authors are ordered by how much they have in the current view, since nine names
    // in publication order tells the reader nothing.
    author: AUTHORS.map((author) => ({
      value: author.id,
      label: author.name,
      count: facets.authors[author.id] ?? 0,
    })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };

  return (
    <form className={styles.form} action="/articles" method="get">
      <div className={styles.bar}>
        <div className={styles.search}>
          <SearchIcon size={17} className={styles.searchIcon} />
          <input
            type="search"
            name="q"
            className={styles.searchInput}
            placeholder="Search titles, authors, topics and tags"
            aria-label="Search the archive"
            value={search}
            maxLength={120}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <CloseIcon size={15} />
            </button>
          )}
        </div>

        <label className={styles.sort}>
          Sort
          <select
            name="sort"
            className={styles.select}
            value={sort}
            onChange={(event) => changeSort(event.target.value as SortKey)}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => setPanelOpen((open) => !open)}
        >
          <FilterIcon size={17} />
          Filters
          {activeCount > 0 && <span className={styles.toggleCount}>{activeCount}</span>}
        </button>

        <button type="submit" className={styles.submit}>
          Apply
        </button>
      </div>

      <div id={panelId} className={styles.panel} hidden={!panelOpen}>
        <Group facet="topic" legend="Topic" options={options.topic} selected={selection.topic} onToggle={toggle} defaultOpen />
        <Group facet="format" legend="Format" options={options.format} selected={selection.format} onToggle={toggle} defaultOpen />
        <Group facet="review" legend="Review" options={options.review} selected={selection.review} onToggle={toggle} defaultOpen />
        <Group facet="author" legend="Author" options={options.author} selected={selection.author} onToggle={toggle} />
      </div>
    </form>
  );
}

type GroupProps = {
  facet: FacetName;
  legend: string;
  options: Option[];
  selected: string[];
  onToggle: (facet: FacetName, value: string, checked: boolean) => void;
  defaultOpen?: boolean;
};

/**
 * A `<details>` rather than a scripted disclosure: the browser already implements this
 * correctly, including on a phone, and it keeps the rail short without the reader
 * losing sight of which groups exist.
 */
function Group({ facet, legend, options, selected, onToggle, defaultOpen = false }: GroupProps) {
  return (
    <details className={styles.group} open={defaultOpen || selected.length > 0}>
      <summary>
        {legend}
        <ChevronDownIcon size={15} className={styles.chevron} />
      </summary>
      <div className={styles.options}>
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label key={option.value} className={styles.option}>
              <input
                type="checkbox"
                name={facet}
                value={option.value}
                checked={checked}
                disabled={option.count === 0 && !checked}
                onChange={(event) => onToggle(facet, option.value, event.target.checked)}
              />
              <span className={styles.box}>
                <CheckIcon size={11} />
              </span>
              <span>{option.label}</span>
              <span className={styles.count}>{option.count}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

import type { ArticleFormat, PeerReviewStatus } from "@/data/types";

export const FORMAT_LABELS: Record<ArticleFormat, string> = {
  article: "Article",
  investigation: "Investigation",
  essay: "Essay",
  "problem-set": "Problem set",
  report: "Report",
};

export const FORMAT_ORDER: readonly ArticleFormat[] = [
  "article",
  "investigation",
  "essay",
  "problem-set",
  "report",
];

export const REVIEW_LABELS: Record<PeerReviewStatus, string> = {
  "peer-reviewed": "Peer reviewed",
  "editorial-review": "Editorial review",
  "under-review": "Under review",
};

/** Shown in a tooltip and on the article page, so the badge is never just a colour. */
export const REVIEW_DESCRIPTIONS: Record<PeerReviewStatus, string> = {
  "peer-reviewed":
    "Read and checked by at least one student referee before publication, with corrections returned to the author.",
  "editorial-review":
    "Checked by the editorial team for clarity and accuracy, but not formally refereed. Usual for essays and problem sets.",
  "under-review":
    "Published while refereeing continues. The mathematics may still change.",
};

export const REVIEW_ORDER: readonly PeerReviewStatus[] = [
  "peer-reviewed",
  "editorial-review",
  "under-review",
];

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_FORMAT_SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "18 June 2026". Fixed to UTC so server and client agree. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(`${iso}T00:00:00Z`));
}

/** "18 Jun 2026", for card metadata lines where space is tight. */
export function formatDateShort(iso: string): string {
  return DATE_FORMAT_SHORT.format(new Date(`${iso}T00:00:00Z`));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

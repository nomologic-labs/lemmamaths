/*
 * The Lemma content model.
 *
 * Article bodies are a typed block tree rather than Markdown or MDX. Three reasons,
 * all of which outlive this prototype:
 *
 *   1. The authoring tool in a later phase is aimed at students who do not write code.
 *      A block tree is the document model such an editor needs; a Markdown string is
 *      not, and would have to be parsed back into one on every keystroke.
 *   2. Article content is user-generated. MDX is executable JavaScript, so accepting it
 *      from submitting authors would mean running their code on our server and in every
 *      reader's browser. A closed set of block kinds cannot express anything we have
 *      not already decided to render.
 *   3. It stores as a single JSON column when a database is chosen, and peer-review
 *      comments can eventually address individual blocks by index or id.
 *
 * V0.1 keeps these values in TypeScript files under src/data/. Nothing outside
 * src/data/ and src/lib/articles/ should assume that.
 */

// ---------------------------------------------------------------- Topics

/**
 * The nine primary topics from .cursor/rules/00-lemma-core.mdc. Narrower subjects are
 * tags, not topics; adding a member here is a product decision, not an editorial one.
 */
export type TopicId =
  | "algebra"
  | "calculus"
  | "linear-algebra"
  | "topology"
  | "arithmetic"
  | "statistics-probability"
  | "number-theory"
  | "computer-science"
  | "numerical-analysis";

export interface Topic {
  id: TopicId;
  name: string;
  /** One sentence, shown on the topic grid and at the head of the topic page. */
  blurb: string;
  /** A short KaTeX expression used as a large, low-contrast watermark on topic cards. */
  glyph: string;
}

// ---------------------------------------------------------------- Authors

export interface Author {
  id: string;
  name: string;
  /** Year group or role, e.g. "Year 13" or "Editor". Shown beside the name. */
  role: string;
  /** Two to three sentences. Appears on the authors index and the author page. */
  bio: string;
  /** Topics this author most often writes about, for the author page header. */
  interests: TopicId[];
  joinedOn: string;
}

// ---------------------------------------------------------------- Articles

/** Derived from the kinds of work Lemma publishes (core rules, section 1). */
export type ArticleFormat = "article" | "investigation" | "essay" | "problem-set" | "report";

/**
 * The public review signal, which is not the same thing as the editorial workflow
 * state. Everything in the archive has reached PUBLISHED; this records how it got
 * there, because a formally refereed proof and an opinion essay warrant different
 * confidence from a reader.
 */
export type PeerReviewStatus = "peer-reviewed" | "editorial-review" | "under-review";

export interface ReviewRecord {
  status: PeerReviewStatus;
  /** Author ids of the student referees, for `peer-reviewed` pieces. */
  reviewerIds?: string[];
  completedOn?: string;
}

// ---- Inline content ----

/** A bare string is literal text; everything else is a marked-up span. */
export type InlineNode =
  | string
  | { kind: "math"; tex: string }
  | { kind: "emphasis"; content: InlineNode[] }
  | { kind: "strong"; content: InlineNode[] }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; content: InlineNode[] };

// ---- Block content ----

export type StatementVariant =
  | "definition"
  | "theorem"
  | "lemma"
  | "proposition"
  | "corollary"
  | "example"
  | "remark"
  | "exercise";

export type ArticleBlock =
  /** Sections only. Article titles are `h1`, so bodies start at `h2`. */
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; content: InlineNode[] }
  /** Display mathematics. `tag` renders as a right-aligned equation number. */
  | { kind: "math"; tex: string; tag?: string }
  | {
      kind: "statement";
      variant: StatementVariant;
      /** Optional name, e.g. "Lagrange" renders as "Theorem 2.1 (Lagrange)". */
      title?: string;
      number?: string;
      content: ArticleBlock[];
    }
  | { kind: "proof"; of?: string; content: ArticleBlock[] }
  | { kind: "list"; ordered: boolean; items: InlineNode[][] }
  | {
      kind: "figure";
      /** Path under /public. Uploaded PNG/JPEG only, per the engineering rules. */
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: InlineNode[];
    }
  /** Highlighted at render time by Shiki; never stored pre-rendered. */
  | { kind: "code"; language: string; code: string; caption?: string }
  | { kind: "quote"; content: InlineNode[]; attribution?: string };

export interface Article {
  slug: string;
  title: string;
  /** Optional deck shown under the title on the article page and featured card. */
  standfirst?: string;
  authorIds: string[];
  publishedOn: string;
  updatedOn?: string;
  /** Used on cards, in search results and as the page meta description. */
  description: string;
  topics: TopicId[];
  tags: string[];
  format: ArticleFormat;
  readingMinutes: number;
  review: ReviewRecord;
  /** At most one article should carry this; the homepage shows the newest that does. */
  featured?: boolean;
  body: ArticleBlock[];
}

/**
 * An article without its body. This is the only article shape that crosses into client
 * components — the archive filters and the search dialog receive summaries so that
 * article bodies stay out of the JavaScript bundle.
 */
export type ArticleSummary = Omit<Article, "body">;

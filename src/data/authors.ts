import type { Author } from "./types";

/**
 * Mock contributors. `id` is used as the URL segment for /authors/[id] and is the key
 * articles reference, so it is stable and readable — when real accounts arrive, an
 * account row can carry this as its public handle rather than exposing a database key.
 */
export const AUTHORS: readonly Author[] = [
  {
    id: "nadia-okonkwo",
    name: "Nadia Okonkwo",
    role: "Year 13",
    bio: "Reads too much algebra for someone who claims to prefer geometry. Spends most of her free periods trying to explain quotient constructions to anyone who will sit still. Applying to read mathematics next year.",
    interests: ["algebra", "topology"],
    joinedOn: "2023-09-04",
  },
  {
    id: "tomas-lindqvist",
    name: "Tomás Lindqvist",
    role: "Year 12",
    bio: "Came to mathematics through programming and has not fully left. Writes about the places where floating-point arithmetic quietly disagrees with the real numbers.",
    interests: ["computer-science", "numerical-analysis"],
    joinedOn: "2024-09-02",
  },
  {
    id: "priya-raman",
    name: "Priya Raman",
    role: "Year 13 · Reviewing editor",
    bio: "Coordinates peer review for Lemma and referees most of what appears under Statistics & Probability. Believes that a simulation is worth writing only if you can also say what it is estimating.",
    interests: ["statistics-probability", "numerical-analysis"],
    joinedOn: "2023-09-04",
  },
  {
    id: "aoife-brennan",
    name: "Aoife Brennan",
    role: "Year 12",
    bio: "Interested in the parts of analysis that look obvious until you try to prove them. Has a standing argument with the rest of the editorial team about whether Dedekind cuts are more honest than Cauchy sequences.",
    interests: ["calculus", "arithmetic"],
    joinedOn: "2024-09-02",
  },
  {
    id: "marcus-oyelaran",
    name: "Marcus Oyelaran",
    role: "Year 13",
    bio: "Number theory, mostly, and the computational side of it. Maintains the small library of scripts Lemma authors use to generate plots for their articles.",
    interests: ["number-theory", "computer-science"],
    joinedOn: "2023-09-04",
  },
  {
    id: "hana-sato",
    name: "Hana Sato",
    role: "Year 12",
    bio: "Draws before she writes, which is why her articles have more diagrams than everyone else's. Currently working through a first course in point-set topology ahead of schedule.",
    interests: ["topology", "linear-algebra"],
    joinedOn: "2024-09-02",
  },
  {
    id: "daniel-whitmore",
    name: "Daniel Whitmore",
    role: "Year 13 · Editor",
    bio: "Founded Lemma after failing to find anywhere to publish a write-up on continued fractions. Handles commissioning and spends an unreasonable amount of time on typography.",
    interests: ["number-theory", "algebra"],
    joinedOn: "2023-09-04",
  },
  {
    id: "leila-farouk",
    name: "Leila Farouk",
    role: "Year 12",
    bio: "Arrived convinced that linear algebra was a bookkeeping exercise and left convinced it is geometry. Writes the kind of article she wished she had been given first.",
    interests: ["linear-algebra", "calculus"],
    joinedOn: "2024-09-02",
  },
  {
    id: "sam-achterberg",
    name: "Sam Achterberg",
    role: "Year 13",
    bio: "Competition problems by preference, complexity theory by curiosity. Sets the problem columns and is unrepentant about how long the last part usually takes.",
    interests: ["computer-science", "algebra"],
    joinedOn: "2023-09-04",
  },
];

const AUTHOR_BY_ID = new Map<string, Author>(AUTHORS.map((author) => [author.id, author]));

export function getAuthor(id: string): Author | undefined {
  return AUTHOR_BY_ID.get(id);
}

export function getAuthors(ids: readonly string[]): Author[] {
  return ids.map((id) => AUTHOR_BY_ID.get(id)).filter((a): a is Author => a !== undefined);
}

/** "Nadia Okonkwo", "Nadia Okonkwo and Hana Sato", "A, B and C". */
export function formatAuthorNames(ids: readonly string[]): string {
  const names = getAuthors(ids).map((a) => a.name);
  if (names.length === 0) return "Unattributed";
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]!}`;
}

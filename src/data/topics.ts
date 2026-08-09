import type { Topic, TopicId } from "./types";

/**
 * The nine primary topics, in the order they are presented across the site. The order
 * is editorial (roughly: structure, change, space, number, computation) rather than
 * alphabetical, and is reused by the homepage grid, /topics and the archive filters so
 * readers learn one arrangement.
 */
export const TOPICS: readonly Topic[] = [
  {
    id: "algebra",
    name: "Algebra",
    blurb: "Structure for its own sake: groups, rings, fields and the maps between them.",
    glyph: "\\mathbb{Z}[x]",
  },
  {
    id: "calculus",
    name: "Calculus",
    blurb: "Limits, derivatives and integrals, and the analysis that makes them rigorous.",
    glyph: "\\int",
  },
  {
    id: "linear-algebra",
    name: "Linear Algebra",
    blurb: "Vectors, matrices and linear maps — the language most of applied mathematics is written in.",
    glyph: "A\\mathbf{v}",
  },
  {
    id: "topology",
    name: "Topology",
    blurb: "What survives continuous deformation: openness, connectedness, holes.",
    glyph: "\\mathcal{T}",
  },
  {
    id: "arithmetic",
    name: "Arithmetic",
    blurb: "Divisibility, congruence and the foundations of the number systems themselves.",
    glyph: "a \\equiv b",
  },
  {
    id: "statistics-probability",
    name: "Statistics & Probability",
    blurb: "Reasoning under uncertainty, from sample spaces to inference.",
    glyph: "\\mathbb{P}",
  },
  {
    id: "number-theory",
    name: "Number Theory",
    blurb: "The primes and everything that follows from taking them seriously.",
    glyph: "\\zeta(s)",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    blurb: "Algorithms, complexity and computation treated as mathematics.",
    glyph: "\\mathcal{O}(n)",
  },
  {
    id: "numerical-analysis",
    name: "Numerical Analysis",
    blurb: "Getting usable answers out of exact mathematics, and knowing the error you paid.",
    glyph: "\\varepsilon",
  },
] as const;

const TOPIC_BY_ID = new Map<TopicId, Topic>(TOPICS.map((topic) => [topic.id, topic]));

export function getTopic(id: TopicId): Topic | undefined {
  return TOPIC_BY_ID.get(id);
}

/** Throws for unknown ids; use where the id is known to be valid (e.g. from an Article). */
export function requireTopic(id: TopicId): Topic {
  const topic = TOPIC_BY_ID.get(id);
  if (!topic) throw new Error(`Unknown topic id: ${id}`);
  return topic;
}

export function isTopicId(value: string): value is TopicId {
  return TOPIC_BY_ID.has(value as TopicId);
}

export function topicName(id: TopicId): string {
  return TOPIC_BY_ID.get(id)?.name ?? id;
}

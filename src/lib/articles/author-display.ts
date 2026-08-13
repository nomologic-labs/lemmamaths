/**
 * Pure author-name formatting for public UI. Names come from the public data layer
 * (handle → display name); never from internal user UUIDs.
 */

export type AuthorNameLookup = ReadonlyMap<string, string> | Readonly<Record<string, string>>;

export type BylineAuthor = {
  id: string;
  name: string;
  href?: string;
};

const INTERNAL_USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for Lemma `users.id` values. Public handles are shorter and never match. */
export function isInternalUserId(value: string): boolean {
  return INTERNAL_USER_ID.test(value);
}

function isMapLookup(lookup: AuthorNameLookup): lookup is ReadonlyMap<string, string> {
  return typeof (lookup as ReadonlyMap<string, string>).get === "function";
}

export function resolveAuthorName(id: string, lookup?: AuthorNameLookup): string {
  if (!lookup) return id;
  if (isMapLookup(lookup)) return lookup.get(id) ?? id;
  return lookup[id] ?? id;
}

export function formatAuthorNames(
  ids: readonly string[],
  lookup?: AuthorNameLookup,
): string {
  const names = ids.map((id) => resolveAuthorName(id, lookup)).filter(Boolean);
  if (names.length === 0) return "Unattributed";
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]!}`;
}

/**
 * Authors shown in a byline. Prefers resolved display names; falls back to stored
 * public handles. Never invents a name and never prints an internal user id.
 */
export function authorsForByline(
  authorIds: readonly string[],
  overrides?: readonly BylineAuthor[],
): BylineAuthor[] {
  if (overrides && overrides.length > 0) {
    return overrides.filter((author) => author.name.trim().length > 0);
  }

  return authorIds
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && !isInternalUserId(id))
    .map((id) => ({
      id,
      name: id.startsWith("@") ? id : `@${id}`,
    }));
}

export function authorLookupToRecord(lookup: AuthorNameLookup): Record<string, string> {
  if (isMapLookup(lookup)) {
    return Object.fromEntries(lookup.entries());
  }
  return { ...lookup };
}

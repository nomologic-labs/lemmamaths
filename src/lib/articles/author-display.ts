/**
 * Pure author-name formatting for public UI. Names come from the public data layer
 * (handle → display name); never from internal user UUIDs.
 */

export type AuthorNameLookup = ReadonlyMap<string, string> | Readonly<Record<string, string>>;

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

export function authorLookupToRecord(lookup: AuthorNameLookup): Record<string, string> {
  if (isMapLookup(lookup)) {
    return Object.fromEntries(lookup.entries());
  }
  return { ...lookup };
}

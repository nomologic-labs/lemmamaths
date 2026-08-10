/**
 * Lemma public handle validation and reserved-name policy.
 * Handles are application-owned and normally immutable after creation.
 */

const HANDLE_PATTERN = /^[a-z][a-z0-9-]{2,23}$/;

/** Route-like and system handles that must never be claimed. */
export const RESERVED_HANDLES = new Set([
  "about",
  "admin",
  "api",
  "articles",
  "auth",
  "authors",
  "dashboard",
  "editor",
  "help",
  "home",
  "login",
  "logout",
  "lemma",
  "null",
  "onboarding",
  "reviewer",
  "settings",
  "signin",
  "signout",
  "support",
  "topics",
  "undefined",
  "www",
]);

export type HandleValidationResult =
  | { ok: true; handle: string }
  | { ok: false; error: string };

export function normalizeHandleInput(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateHandle(raw: string): HandleValidationResult {
  const handle = normalizeHandleInput(raw);

  if (handle.length < 3 || handle.length > 24) {
    return { ok: false, error: "Handle must be 3–24 characters." };
  }

  if (!HANDLE_PATTERN.test(handle)) {
    return {
      ok: false,
      error: "Use lowercase letters, numbers, and hyphens. The handle must begin with a letter.",
    };
  }

  if (handle.endsWith("-")) {
    return { ok: false, error: "Handle cannot end with a hyphen." };
  }

  if (handle.includes("--")) {
    return { ok: false, error: "Handle cannot contain consecutive hyphens." };
  }

  if (RESERVED_HANDLES.has(handle)) {
    return { ok: false, error: "That handle is reserved." };
  }

  return { ok: true, handle };
}

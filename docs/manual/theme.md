# Theme system

## Purpose

Light and dark themes that stay inside Lemma’s warm parchment / chocolate identity. Preference persists across visits and defaults to the system setting on first visit.

## Important files

```text
src/styles/tokens.css                 Semantic tokens for light + dark
src/lib/theme/constants.ts            Storage key + preference types
src/lib/theme/theme-script.tsx        Blocking <head> script (no flash)
src/lib/theme/ThemeProvider.tsx       React preference API
src/components/navigation/AppearanceControl.tsx
```

## Palette

Brand colours (also in `rules/10-design-system.mdc` and decision 006):

```text
#F5EDE0  Parchment
#2B1509  Dark Chocolate
#4A2410  Brown
#8C4A1E  Saddle
#B8894A  Brass
#C9A876  Tan
```

Light mode: parchment page, chocolate text.  
Dark mode: very dark brown page (`#1c0e05` / chocolate raised surfaces), parchment text, brass/saddle accents — not a cool grey/blue dark theme.

## Token layers

1. **Raw** `--lemma-*` — brand constants; do not use in components.
2. **Semantic** `--surface-*`, `--text-*`, `--accent-*`, `--rule-*` — flipped under `[data-theme="light"|"dark"]`.

Components bind to the semantic layer so a theme switch is a single attribute change on `<html>`.

## Preference model

| Preference | Behaviour |
|------------|-----------|
| `light` | Force light; stored in `localStorage` key `lemma-theme` |
| `dark` | Force dark; stored |
| `system` | Follow `prefers-color-scheme`; storage key removed |

`ThemeProvider` reads preference and system scheme via `useSyncExternalStore`. `setPreference` writes storage and dispatches a same-tab event so subscribers update.

## Anti-flash

`ThemeScript` runs inline in `<head>` before paint:

1. Sets `data-theme` from storage or system.
2. Sets `data-js="on"` for progressive enhancement hooks.
3. Sets `data-motion="on"` only when reduced motion is **not** requested.

Because the script may disagree with the server-rendered default, `<html>` uses `suppressHydrationWarning`.

## Logo adaptation

`LemmaLogo` supports:

- `tone="adaptive"` (default) — tile/letter/dot follow theme tokens
- `tone="brand"` — pinned reference colours from the artwork

Reference artwork: `public/brand/lemma-logo-reference.png`. Implementation: `src/components/brand/LemmaLogo.tsx` (measured SVG; do not duplicate the path elsewhere).

## Appearance UI

`AppearanceControl` in the navigation drawer exposes Light / Dark / System. It is the only first-class theme control in V0.1.

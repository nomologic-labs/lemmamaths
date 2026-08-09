# Troubleshooting

## Theme flashes light then dark (or the reverse)

The blocking script in `src/lib/theme/theme-script.tsx` must remain in `<head>` via `ThemeScript`. If it is removed, the first paint uses the server default before `ThemeProvider` reconciles.

Check that `localStorage["lemma-theme"]` is one of `light`, `dark`, or absent (system).

## Scroll sections stay invisible

Reveals start hidden only when `data-motion="on"` is set. If JavaScript fails or `prefers-reduced-motion: reduce` is on, content should render visible. If something is stuck invisible, inspect `Reveal` / `data-motion` and the corresponding CSS.

## Archive filters do nothing without JS

The filter UI is a GET form to `/articles`. A full submit still works. Auto-apply on checkbox change requires JavaScript (`data-js`).

## Code blocks unstyled or missing colours

Highlighting runs on the server. Client navigation to an article should still include pre-rendered HTML. If a language is unsupported, you get escaped plain text — add grammars in `src/lib/code/highlight.ts` only when needed.

## KaTeX looks unstyled

Ensure `katex/dist/katex.min.css` remains imported from `src/app/layout.tsx`.

## Build fails on Shiki / memory

Shiki loads selected grammars only. Avoid importing `shiki` from Client Components. Keep `serverExternalPackages: ["shiki"]`.

## Logo looks wrong in one theme

Use `LemmaLogo` with `tone="adaptive"` for chrome. Compare against `public/brand/lemma-logo-reference.png`. Do not invent a second SVG mark.

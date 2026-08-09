# Article rendering

## Purpose

Turn a typed `ArticleBlock[]` into a calm, readable mathematical page with KaTeX, editorial statement styling, figures, and syntax-highlighted code.

## Important files

```text
src/app/articles/[slug]/page.tsx
src/components/articles/ArticleHeader.tsx
src/components/articles/ArticleBody.tsx
src/components/articles/ArticleContents.tsx
src/components/articles/RelatedArticles.tsx
src/components/articles/ReviewNote.tsx
src/components/articles/PeerReviewBadge.tsx
src/components/articles/blocks/Inline.tsx
src/components/articles/blocks/CodeBlock.tsx
src/components/articles/blocks/CopyButton.tsx
src/components/ui/Math.tsx
src/lib/math/render.ts
src/lib/code/highlight.ts
src/lib/code/theme.ts
```

## Page composition

`/articles/[slug]` renders:

1. **ArticleHeader** — title, standfirst, authors, date, topics, tags, reading time, peer-review badge
2. **ArticleBody** — closed switch over `ArticleBlock`
3. **ReviewNote** — short explanation of the review status
4. **ArticleContents** — sticky rail of `h2`/`h3` anchors (desktop)
5. **RelatedArticles** — from `findRelated` in `src/lib/articles/query.ts`

All article paths are known at build time (`generateStaticParams`).

## Mathematics

- `src/lib/math/render.ts` wraps KaTeX.
- `Inline` nodes with `kind: "math"` render inline.
- `DisplayMath` renders display equations; optional `tag` becomes a right-aligned equation number.
- Global KaTeX CSS is imported once from `src/app/layout.tsx`.

## Statements and proofs

`statement` blocks use a `data-variant` attribute for styling. Proofs lead with “Proof.” into the first paragraph and close with a tombstone (QED square), matching print convention.

## Figures

- Sourced from `public/figures/` (and referenced as `/figures/…`).
- Numbered in document order by `ArticleBody` (`withFigureNumbers`), not stored in the data.
- Captions use `Figure N.` prefix plus inline caption nodes.
- Next.js `Image` is used with explicit width/height from the block.

## Code blocks

- Shiki highlights on the **server** (`highlightCode`).
- Highlighted HTML is **not** stored in article data.
- Both Lemma light and dark Shiki themes are emitted as CSS custom properties so theme toggles do not re-highlight (`src/lib/code/theme.ts`, `CodeBlock.module.css`).
- Supported languages today: python, typescript, javascript, bash, c, json (plus common aliases). Unknown languages fall back to escaped plain text.
- `CopyButton` is a small client island on each block.

## Safety

There is no `dangerouslySetInnerHTML` path from arbitrary article strings except:

- KaTeX output (from trusted mock TeX in V0.1)
- Shiki output (from trusted mock code in V0.1)

When user-generated content arrives, keep the closed block union and continue to treat TeX/code as data to be rendered by these libraries — never as HTML authored by students.

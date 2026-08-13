# Frontend

## Routes

| Path | Role |
|------|------|
| `/` | Homepage: hero → recently published → featured → topics → browse archive |
| `/articles` | Full archive with search, filters, sort |
| `/articles/[slug]` | Article reading experience |
| `/topics` | Nine primary topics; each links into `/articles?topic=…` |
| `/authors` | Author index |
| `/authors/[id]` | Author profile + their articles |
| `/about` | Product explanation |
| `/dashboard` | Contributor dashboard: account state and links to the tools the account can use |
| `/dashboard/drafts`, `/dashboard/published`, `/dashboard/review*`, `/dashboard/admin/users` | Contributor, peer-review, editorial and account tools (see [Article editor](./article-editor.md), [Review system](./review-system.md), [Authorization](./authorization.md)) |

There are **no** separate topic article pages. Topic browsing is a filtered archive URL so filtering behaviour stays identical wherever the reader arrives from.

## Component layout

```text
src/components/
├── brand/          LemmaLogo, LemmaWordmark
├── navigation/     SiteChrome, SiteHeader, NavigationDrawer, SearchDialog,
│                   AppearanceControl, SiteFooter, AuthNav, nav-items
├── home/           Hero, RecentlyPublished, FeaturedArticle, ExploreTopics, BrowseArchive
├── articles/       Archive*, Article*, PeerReviewBadge, RelatedArticles, blocks/
├── editor/         ArticleEditor, BlockList, BlockEditor, MetadataPanel, MathPreview
├── review/         ReviewQueueClient, ReviewSidebar, AuthorFeedbackPanel, ReviewInteractive
├── topics/         TopicGrid
├── authors/        AuthorCard
└── ui/             Container, PageHeader, SectionHeading, Reveal, Math, StatusPill, icons
```

Pages under `src/app/` stay thin: they load data and compose these components.

## Styling

- Design tokens: `src/styles/tokens.css` (brand palette → semantic `--surface-*`, `--text-*`, `--accent-*`).
- Global base: `src/styles/globals.css`.
- Component styles: co-located `*.module.css`.
- Fonts: `src/styles/fonts.ts` via `next/font` — Newsreader (display), Literata (body), Inter (UI), JetBrains Mono (code).

Components should consume **semantic** tokens, not raw `--lemma-*` brand values, so light/dark switching does not require per-component changes.

## Typography roles

| Role | Family | Typical use |
|------|--------|-------------|
| Display serif | Newsreader | Hero name, major titles |
| Body serif | Literata | Article prose |
| UI sans | Inter | Nav, filters, metadata, buttons |
| Mono | JetBrains Mono | Code blocks |

## Motion

- Entrance and scroll reveals use opacity/transform only.
- `Reveal` (`src/components/ui/Reveal.tsx`) uses IntersectionObserver and respects `prefers-reduced-motion` via `useSyncExternalStore`.
- A blocking script sets `data-motion="on"` only when motion is allowed (`src/lib/theme/theme-script.tsx`), so reduced-motion / no-JS readers never leave content at opacity 0.

## Accessibility notes implemented today

- Skip link to `#main`
- Drawer as modal dialog with focus management (`useDialog`)
- Visible focus rings via tokens
- Figure alt text required on figure blocks
- Theme and motion respect system preferences on first visit

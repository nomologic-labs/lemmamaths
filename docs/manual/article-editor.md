# Article editor

## Status

**Implemented** for drafting, structured editing, autosave, preview, and contributor submit/resubmit.

**Also implemented:** reviewer feedback panel on drafts with revision comments; links into the review system.

**Not implemented:** collaborative editing, object storage for images, revision diff UI, in-place edit of published articles.

Image upload to `public/uploads/` is enabled only for local development. On Vercel (and production unless explicitly opted in on a single-node host) uploads are disabled; use `/figures/…` paths. See [Media](./media.md).

## Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/drafts` | Articles still in progress (every state except `PUBLISHED`); create new drafts |
| `/dashboard/drafts/[id]` | Block-based editor |
| `/dashboard/drafts/[id]/preview` | Authenticated preview using public renderers |
| `/dashboard/published` | Read-only list of the user's `PUBLISHED` articles, linking to the archive |
| `/api/articles/[id]/upload-image` | PNG/JPEG upload for figure blocks |

`/dashboard/drafts` and `/dashboard/published` show the caller's own articles; holders of
`article:read:any` see everyone's.

Draft and other unpublished workflow states are **never** served from `/articles/[slug]` (404). The public archive reads only `PUBLISHED` rows via `src/lib/articles/public.ts`. Published articles cannot be edited through the normal draft save path.

## Architecture

The editor is a client UI over the canonical `ArticleBlock[]` model in `src/data/types.ts`. Every block has a stable `id` (`blk_…`).

```text
ArticleEditor (client)
  ↓ structured ArticleBlock[] with stable ids
saveDraftAction (server action)
  ↓ Zod validation (src/lib/articles/validation.ts) — ids required + unique
  ↓ authorization (src/lib/articles/access.ts)
  ↓ Drizzle (src/lib/articles/store.ts)
  ↓ PostgreSQL JSONB body column
```

The source of truth is the schema + server validation + database, not the React state.

## Layout

- **Top toolbar** — workflow status, save state, Save draft, Preview, Submit for peer review
- **Under the toolbar** — one sentence explaining the current state and the next action, plus an inline error banner when a submit fails
- **Main area** — block list with add / reorder / duplicate / delete (delete uses the danger styling)
- **Right panel** — metadata (title, standfirst, description, format, topics, tags, authors, featured)

## Block IDs

| Behaviour | Result |
|-----------|--------|
| Add block | New `blk_…` id |
| Reorder | Ids unchanged |
| Duplicate | New ids for the cloned tree (including nested statement/proof children) |
| Delete | Other ids unchanged |
| Autosave / refresh | Ids persist in JSONB |
| Legacy body without ids | `ensureBlockIds` assigns ids on load and save |

Helpers: `src/lib/articles/block-ids.ts`, `src/lib/articles/editor-types.ts`.

## Block editing

Supported block kinds in the editor:

| Menu label | `ArticleBlock` kind | Notes |
|------------|---------------------|-------|
| Paragraph | `paragraph` | Plain text (stored as `InlineNode[]`) |
| Heading | `heading` | Levels 2 and 3 |
| Equation | `math` | LaTeX input with live KaTeX preview |
| Theorem | `statement` | Variant selector (theorem, lemma, definition, …) |
| Proof | `proof` | Proof body |
| Example | `statement` (`variant: "example"`) | Same structure as theorems |
| Figure | `figure` | Upload or path, alt text, caption, dimensions |
| Code | `code` | Language select + monospace input + caption |
| Quote | `quote` | Quote text plus optional attribution |

Block kind names come from `BLOCK_KIND_LABELS` in `src/lib/articles/block-labels.ts`, so the
Add menu, the block header in the editor, and the review workspace all use the same word.

### Not editable in v1

| Kind | Reason |
|------|--------|
| `list` | Existing blocks are preserved in the body but show a read-only notice in the editor. Full list editing is planned. |

## Mathematics

Equation blocks use LaTeX in a textarea. `MathPreview` (`src/components/editor/MathPreview.tsx`) renders client-side KaTeX with `trust: false`, matching `src/lib/math/render.ts`.

Malformed expressions show inline KaTeX error styling and an accessible error message.

## Code blocks

Contributors choose a language and enter code as plain text. The editor does not execute code.

Published and preview rendering use the existing Shiki server component (`CodeBlock`) via `ArticleBody`.

Supported editor languages (`CODE_LANGUAGES`): Python, JavaScript, TypeScript, Java, C, C++, HTML, CSS, SQL, Bash.

**Known gap:** the Shiki highlighter in `src/lib/code/highlight.ts` loads only `python`,
`typescript`, `javascript`, `bash`, `c`, and `json`. Choosing Java, C++, HTML, CSS, or SQL
stores and renders the code correctly but without syntax colouring.

## Images

- PNG and JPEG only
- Max 5 MB
- Magic-byte validation on the server (MIME type is not trusted alone)
- Stored under `public/uploads/articles/[articleId]/`
- **Known limitation:** local filesystem storage is acceptable for prototyping only. It is **not** production-ready on Vercel (ephemeral disk). Object storage (S3/R2 or similar) is deferred to a future phase.
- Figure `src` is a public URL path

## Metadata

- **Title** — the article's title
- **Standfirst** — one or two sentences printed under the title
- **Description** — summary used on cards, in search, and as the page meta description
- **Format** — one of the five `ArticleFormat` values
- **Topics** — constrained to the nine `TopicId` values in `src/data/topics.ts`
- **Tags** — comma-separated narrower subjects
- **Authors** — selected from active accounts with a claimed handle; the saving user must be
  listed unless they hold `article:edit:any`
- **Featured** — administrators only (`article:publish` or `article:edit:any`)

Each field carries a one-line hint in the panel, so a contributor does not have to know what
a standfirst is before writing one.

## Autosave

Debounced autosave runs **2.5 seconds** after the last change. The toolbar shows:

- `Saving…`
- `Unsaved changes`
- `Saved [timestamp]`
- `Save failed: [message]`

Manual **Save draft** is also available.

Guarantees:

- Initial page load does **not** immediately overwrite the database
- Saves are serialized; if edits arrive during an in-flight save, the latest payload is flushed afterward (avoids stale overwrites)
- Failed saves surface the server error message
- **Submit for peer review** flushes pending edits first and aborts the submission if that
  save fails, so a contributor never submits a version the server rejected. Submit failures
  render as an inline error banner under the toolbar; the draft is left untouched.

## Workflow (editor UI)

Database workflow states (`src/lib/articles/workflow.ts`):

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `REVISION_REQUESTED` → `RESUBMITTED` → `APPROVED` → `PUBLISHED`

Contributors may edit only in `DRAFT` and `REVISION_REQUESTED`. Administrators with `article:edit:any` may edit through `APPROVED`.

**Submit for peer review** (contributor UI):

- `DRAFT` → `SUBMITTED`
- `REVISION_REQUESTED` → `RESUBMITTED` (the button reads *Resubmit for peer review*)

Submit also writes a row to `article_revisions` (snapshot seam) and an audit log entry.

Editorial queue and reviewer UI live under `/dashboard/review` (see [Review system](./review-system.md)).

Publishing (`APPROVED` → `PUBLISHED`) is implemented as `publishArticleAction` and exposed to
`article:publish` holders from the editorial review queue. It is not exposed in the editor,
because contributors cannot publish.

`WORKFLOW_CONTRIBUTOR_HINTS` in `src/lib/articles/workflow-labels.ts` holds the one-sentence
explanation of each state shown in the editor, the drafts list, and the preview.

All transitions go through `canPerformTransition` — permissions and ownership are enforced server-side.

## Preview

`/dashboard/drafts/[id]/preview` requires authentication and read permission. It renders:

- `ArticleHeader` (with database author overrides)
- `ArticleBody` (same component as public articles)

There is no separate preview renderer. The preview carries the article's real
`peerReviewStatus` so the badge matches what a reader will see, and its toolbar shows the
workflow state, the state hint, and — once published — a link to the archive.

## Security

- No MDX, no arbitrary HTML, no code execution
- All mutations go through server actions with session + permission checks
- Client-side validation is mirrored by Zod on the server
- Draft routes are `robots: noindex`
- Hidden or disabled buttons are never treated as authorization

## Related files

| Area | Location |
|------|----------|
| Editor UI | `src/components/editor/` |
| Block ids | `src/lib/articles/block-ids.ts` |
| Validation | `src/lib/articles/validation.ts` |
| Workflow rules | `src/lib/articles/workflow.ts` |
| Store | `src/lib/articles/store.ts` |
| Access control | `src/lib/articles/access.ts` |
| Server actions | `src/lib/articles/actions.ts` |
| Schema | `src/lib/db/articles-schema.ts` |
| Block/workflow/account labels | `src/lib/articles/block-labels.ts`, `src/lib/articles/workflow-labels.ts`, `src/lib/auth/account-labels.ts` |
| Migrations | `drizzle/0003_articles.sql` … `drizzle/0007_account_role_status.sql` |

## Planned (not implemented)

- Inline emphasis, links, and inline math within paragraphs
- List block editing
- Object storage for images (S3/R2)
- Syntax highlighting for the five editor languages Shiki does not currently load

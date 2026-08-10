# Article editor

## Status

**Implemented** for drafting, structured editing, autosave, preview, and author submit/resubmit.

**Also implemented:** author feedback panel on drafts with revision comments; links into the review system.

**Not implemented:** collaborative editing, object storage for images, revision diff UI, in-place edit of published articles.

Image upload to `public/uploads/` is enabled only for local development. On Vercel (and production unless explicitly opted in on a single-node host) uploads are disabled; use `/figures/…` paths. See [Media](./media.md).

## Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/drafts` | List drafts; create new articles |
| `/dashboard/drafts/[id]` | Block-based editor |
| `/dashboard/drafts/[id]/preview` | Authenticated preview using public renderers |
| `/api/articles/[id]/upload-image` | PNG/JPEG upload for figure blocks |

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

- **Top toolbar** — workflow status, save state, Save draft, Preview, Submit for review
- **Main area** — block list with add / reorder / duplicate / delete
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
| Image | `figure` | Upload + alt text + dimensions |
| Code | `code` | Language select + monospace input |

### Not editable in v1

| Kind | Reason |
|------|--------|
| `list` | Existing blocks are preserved in the body but show a read-only notice in the editor. Full list editing is planned. |
| `quote` | Supported if present in imported data; not in the Add block menu yet. |

## Mathematics

Equation blocks use LaTeX in a textarea. `MathPreview` (`src/components/editor/MathPreview.tsx`) renders client-side KaTeX with `trust: false`, matching `src/lib/math/render.ts`.

Malformed expressions show inline KaTeX error styling and an accessible error message.

## Code blocks

Authors choose a language and enter code as plain text. The editor does not execute code.

Published and preview rendering use the existing Shiki server component (`CodeBlock`) via `ArticleBody`.

Supported editor languages: Python, JavaScript, TypeScript, Java, C, C++, HTML, CSS, SQL, Bash.

## Images

- PNG and JPEG only
- Max 5 MB
- Magic-byte validation on the server (MIME type is not trusted alone)
- Stored under `public/uploads/articles/[articleId]/`
- **Known limitation:** local filesystem storage is acceptable for prototyping only. It is **not** production-ready on Vercel (ephemeral disk). Object storage (S3/R2 or similar) is deferred to a future phase.
- Figure `src` is a public URL path

## Metadata

- **Topics** — constrained to the nine `TopicId` values in `src/data/topics.ts`
- **Authors** — selected from users with a contributor role and a claimed handle
- **Featured** — editors only (`article:publish` or `article:edit:any`)

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

## Workflow (editor UI)

Database workflow states (`src/lib/articles/workflow.ts`):

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `REVISION_REQUESTED` → `RESUBMITTED` → `APPROVED` → `PUBLISHED`

Authors may edit only in `DRAFT` and `REVISION_REQUESTED`. Editors with `article:edit:any` may edit through `APPROVED`.

**Submit for review** (author UI):

- `DRAFT` → `SUBMITTED`
- `REVISION_REQUESTED` → `RESUBMITTED`

Submit also writes a row to `article_revisions` (snapshot seam) and an audit log entry.

Editorial queue and reviewer UI live under `/dashboard/review` (see [Review system](./review-system.md)).

Publishing is intentionally not exposed.

All transitions go through `canPerformTransition` — permissions and ownership are enforced server-side.

## Preview

`/dashboard/drafts/[id]/preview` requires authentication and read permission. It renders:

- `ArticleHeader` (with database author overrides)
- `ArticleBody` (same component as public articles)

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
| Migrations | `drizzle/0003_articles.sql` … `drizzle/0005_review_rounds_and_comments.sql` |

## Planned (not implemented)

- Inline emphasis, links, and inline math within paragraphs
- List block editing
- Quote block in Add menu
- Object storage for images (S3/R2)
- Publishing UI and public archive migration from mock data

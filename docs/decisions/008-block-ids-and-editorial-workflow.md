# Decision 008 — Stable block IDs and editorial workflow foundation

Status: Accepted  
Date: 2026-08-09

## Context

Database-backed drafts and the browser editor already persist `ArticleBlock[]` in JSONB. The next editorial phase needs:

1. Block-level review comments that survive reorder and edit
2. A single authoritative place for legal workflow transitions
3. Reviewer assignment and revision snapshots without building the full review UI yet

## Decisions

### Stable block IDs

Every `ArticleBlock` carries a required `id` string of the form `blk_` + alphanumeric characters.

- New editor blocks receive random ids via `createBlockId()`
- Duplicating a block regenerates ids for the whole cloned subtree
- Reorder and delete do not change other blocks' ids
- Zod validation on save requires unique valid ids within a body
- Mock articles may omit ids in source files; `materializeArticle` / `materializeArticles` assign deterministic ids from the article slug so public rendering stays stable
- Legacy database bodies without ids are repaired by `ensureBlockIds` on load and save

Array indexes are never used as persistent identifiers.

### Workflow transitions

Legal transitions are defined only in `src/lib/articles/workflow.ts` (`WORKFLOW_TRANSITIONS`, `canTransition`, `getTransition`).

Server actions must authenticate the session, check permissions/ownership via `canPerformTransition`, validate the current status, write an audit entry, and revalidate paths. Arbitrary client-supplied status values are rejected.

Publishing (`APPROVED` → `PUBLISHED`) is defined as a legal edge but is **not** exposed as a server action in this phase.

### Reviewer assignment and revisions

- `article_reviewers` stores assignment metadata (article, reviewer, assigning editor, timestamps, status, optional decision)
- `article_revisions` stores intentional snapshots (metadata + body + authors + actor + time), created on submit/resubmit — not on every autosave
- No reviewer UI, block comments, or diff viewer in this phase

### Image storage

Uploads remain under `public/uploads/articles/[articleId]/` for local prototyping. This is **not** the production architecture on Vercel (ephemeral filesystem). Object storage is deferred.

### Public archive

Public `/articles` continues to use mock data in `src/data/`. No migration of published content to PostgreSQL in this phase.

## Consequences

- Future block comments can reference `block.id`
- Editorial UI can call the existing workflow server actions without inventing new authorization paths
- Operators must apply migrations `0003_articles` and `0004_reviewers_and_revisions` where not already applied

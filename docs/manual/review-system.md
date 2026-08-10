# Review system

## Status

**Implemented** for editorial assignment, block-level comments, reviewer decisions, and author feedback.

**Also implemented:** editorial **Publish** on approved queue items (`publishArticleAction`).

**Not implemented:** email notifications, revision diff UI, real-time collaboration, post-publication fork/re-edit.

## Architecture

Reviews are organized as **rounds**:

```text
Article
  ├── Review Round N (OPEN | COMPLETED)
  │     ├── article_reviewers (assignments + decisions)
  │     └── article_review_comments (blockId → ArticleBlock.id)
  └── article_revisions (submit/resubmit snapshots)
```

Decision record: [009](../decisions/009-review-rounds-and-block-comments.md).

## Routes

| Route | Audience | Purpose |
|-------|----------|---------|
| `/dashboard/review` | Editors/admins (`article:approve`) | Editorial queue, assign reviewers, start review, request revisions, approve, publish |
| `/dashboard/review/assigned` | Reviewers (`article:review`) | Assignments for the signed-in user |
| `/dashboard/review/[articleId]` | Assigned reviewers, authors (own), editors | Article + block comments + decisions |

All routes enforce access server-side. Guessing an article id does not grant access.

## Workflow integration

Uses the existing transition table in `src/lib/articles/workflow.ts`.

| Action | Transition | Who |
|--------|------------|-----|
| Author submit / resubmit | `DRAFT`→`SUBMITTED` / `REVISION_REQUESTED`→`RESUBMITTED` | Author (`article:submit`) |
| Start review | `SUBMITTED`\|`RESUBMITTED`→`UNDER_REVIEW` | Editor; also ensures an OPEN round |
| Request revisions | `UNDER_REVIEW`→`REVISION_REQUESTED` | Editor; completes OPEN round |
| Approve | `UNDER_REVIEW`→`APPROVED` | Editor; completes OPEN round |
| Publish | `APPROVED`→`PUBLISHED` | Editor (`article:publish`); separate from approve |

Public pages only show `PUBLISHED` articles. See [Decision 010](../decisions/010-publishing-and-public-data.md).

## Reviewer decisions

On an active assignment in an OPEN round, a reviewer may submit:

- `request_revisions`
- `recommend_approval`

These complete the assignment. They do **not** change article workflow by themselves — editors act on the queue.

Authors cannot be assigned as reviewers of their own articles.

## Block-level comments

Comments store `blockId` = `ArticleBlock.id`.

- Reorder does not move comments
- Delete does not reassign comments; orphaned comments are shown as referring to a removed block
- Comments remain on their historical round when a new round opens
- Max body length: 4000 characters
- Rendered as plain text (`white-space: pre-wrap`), never as HTML

## Author feedback

When an article has review comments, the draft editor (`/dashboard/drafts/[id]`) shows an author feedback panel. Authors may mark comments addressed (resolve).

## Server actions

`src/lib/articles/review-actions.ts`:

- `assignReviewerAction` / `removeReviewerAction`
- `startArticleReviewAction`
- `editorRequestRevisionAction` / `editorApproveArticleAction`
- `createReviewCommentAction` / `updateReviewCommentAction` / `resolveReviewCommentAction`
- `submitReviewDecisionAction`

Publishing lives in `src/lib/articles/actions.ts` (`publishArticleAction`), invoked from the editorial queue UI.

## Important files

| Area | Location |
|------|----------|
| Schema | `src/lib/db/articles-schema.ts` |
| Migration | `drizzle/0005_review_rounds_and_comments.sql` |
| Access | `src/lib/articles/review-access.ts` |
| Store | `src/lib/articles/review-store.ts` |
| Validation | `src/lib/articles/review-validation.ts` |
| UI | `src/components/review/` |

## Testing

```bash
npm run test:review
npm run test:articles
npm run test:auth
```

## Known limitations

- No email notifications when assignments or decisions change
- No side-by-side revision diff
- Image uploads remain local-prototype storage
- Local DB features require `DATABASE_URL` and applied migrations through `0006`

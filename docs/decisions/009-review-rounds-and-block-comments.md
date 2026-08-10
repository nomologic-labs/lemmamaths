# Decision 009 — Review rounds and block-level comments

Status: Accepted  
Date: 2026-08-09

## Context

Phase 4 established stable `ArticleBlock.id` values, workflow transitions, `article_reviewers`, and `article_revisions`. Phase 5 needs a real editorial review system: assignment, block-level comments, reviewer decisions, and author feedback — without publishing or public DB migration.

## Decisions

### Review rounds

Reviews are organized as **rounds**, not a flat bag of comments.

- Table `article_review_rounds` stores `articleId`, `roundNumber`, `status` (`OPEN` | `COMPLETED`), timestamps, and creating editor.
- A new OPEN round is created when an editor starts review (or on first assignment if none exists).
- Requesting revision or approving completes the open round.
- Resubmission followed by start-review opens the next round number.
- Historical comments stay on their round forever.

### Assignments

`article_reviewers` gains `roundId`. Uniqueness is `(roundId, reviewerUserId)` so the same person may be assigned in later rounds.

Reviewer decisions on an assignment:

- `request_revisions`
- `recommend_approval`

Reviewers cannot publish and cannot approve the article directly. Editors act on the workflow after seeing decisions.

### Block comments

`article_review_comments` stores:

- `roundId`, `articleId`, `authorUserId`, `blockId`, `body`, resolve fields, timestamps

Comments reference `ArticleBlock.id` only — never array indexes. If a block later disappears, the comment remains and is shown as referring to a removed block.

### Access

- Reviewers may only access articles they are assigned to (plus editors with `article:read:any`).
- A reviewer must not review an article they author.
- Authors may read feedback on their own articles.
- All mutations are server actions with session + permission checks and audit entries.

## Consequences

- Publishing remains deferred.
- Diff UI between revisions remains deferred.
- Operators apply migration `0005_review_rounds_and_comments`.

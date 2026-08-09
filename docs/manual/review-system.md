# Review system

## Status

**Not implemented as a workflow backend in V0.1.**

What exists today is **display metadata** only:

- `Article.review.status`: `peer-reviewed` | `editorial-review` | `under-review`
- Optional `reviewerIds` and `completedOn`
- UI: `PeerReviewBadge`, `ReviewNote` on article pages
- About page copy explaining the intended human process

There is no queue, no referee assignment, no revision requests, and no transition between DRAFT → PUBLISHED states in software.

## Intended workflow (product, not code)

From core rules:

```text
DRAFT → SUBMITTED → UNDER REVIEW → REVISION REQUESTED
      → RESUBMITTED → APPROVED → PUBLISHED
```

Only published content should appear in public discovery once a real CMS exists. The mock archive assumes every listed article is already public.

# Media

## Status

Static brand/figure assets live in `public/`. Contributor image uploads to the local filesystem are a **local-development prototype only**.

## Locations

```text
public/brand/
  lemma-logo-reference.png   Authoritative logo reference (not used at runtime)
  field-light.svg            Atmospheric field for light theme
  field-dark.svg             Atmospheric field for dark theme

public/figures/              Checked-in article figures (PNG), referenced by figure blocks
public/uploads/articles/     Local-dev draft uploads only (disabled on Vercel)
public/fonts/                (if present) local font assets
public/images/               Miscellaneous static images
```

## Article figures

Figure blocks store:

- `src` — must be a site path under `/figures/` or `/uploads/` (validated on save and at render)
- `alt`, `width`, `height`
- optional `caption` as inline nodes
- stable block `id`

Formats allowed by engineering rules: **PNG** and **JPEG/JPG**.

Remote hosts are not allowed in figure `src` during this beta architecture. Object storage will replace `/uploads/` later.

## Draft image uploads (beta policy)

Route: `POST /api/articles/[id]/upload-image`

When **enabled** (local `next dev` only by default):

- Requires an authenticated session and edit permission on the article
- PNG/JPEG only, max 5 MB, magic-byte checked
- Writes to `public/uploads/articles/[articleId]/[uuid].(png|jpg)`
- Returns a public path used as the figure block `src`

When **disabled** (always on Vercel; also in `NODE_ENV=production` unless `LEMMA_ALLOW_LOCAL_UPLOADS=true` on a single-node host):

- The upload route returns **403**
- The editor hides the file picker and explains that uploads are unavailable
- Contributors may still set figure `src` to a checked-in `/figures/…` path

### Why uploads are off on Vercel

Vercel’s serverless filesystem is **ephemeral**. Files written under `public/uploads/` during a request are not a durable shared store across instances or deploys. Leaving uploads enabled would let beta users create figure URLs that Lemma then treats as permanent but that disappear after redeploy.

Object storage (S3, R2, etc.) is the intended next infrastructure phase. Until then, beta on Vercel should use `/figures/` assets only.

## Brand / hero atmosphere

Homepage hero backdrop styling uses CSS tokens plus the field SVGs under `public/brand/`. The leather theme is colour and craft, not a literal leather texture overlay.

## Not implemented

- CDN / blob / object storage
- Server-side Python plotting
- Responsive srcset generation beyond Next.js `Image` defaults
- Production media pipeline for published articles

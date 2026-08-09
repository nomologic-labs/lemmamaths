# Media

## Status in V0.1

Media is **static files in `public/`**. There is no upload pipeline, image processing service, or object storage.

## Locations

```text
public/brand/
  lemma-logo-reference.png   Authoritative logo reference (not used at runtime)
  field-light.svg            Atmospheric field for light theme
  field-dark.svg             Atmospheric field for dark theme

public/figures/              Article figures (PNG), referenced by figure blocks
public/fonts/                (if present) local font assets
public/images/               Miscellaneous static images
```

## Article figures

Figure blocks store:

- `src` — path under `/public` (e.g. `/figures/newton-basins.png`)
- `alt`, `width`, `height`
- optional `caption` as inline nodes

Formats allowed by engineering rules: **PNG** and **JPEG/JPG**. Graphs in V0.1 were generated offline (see `scripts/figures/`) and checked in as PNGs — not generated on the server at request time.

## Brand / hero atmosphere

Homepage hero backdrop styling uses CSS tokens plus the field SVGs under `public/brand/`. The leather theme is colour and craft, not a literal leather texture overlay.

## Not implemented

- Author image upload
- CDN / blob storage
- Server-side Python plotting
- Responsive srcset generation beyond Next.js `Image` defaults

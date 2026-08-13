# Deployment

## Target

Production deployment is intended for **Vercel** (`docs/decisions/002-technology-stack.md`).

Production requires `DATABASE_URL` (and Auth.js Google credentials) for published content and contributor features. A build without `DATABASE_URL` can succeed for CI typechecking (empty public lists / JWT auth soft-path); it does not exercise live database reads.

Set `AUTH_URL` to the real public origin (e.g. `https://your-domain`). That value drives Auth.js and `metadataBase` / sitemap URLs. Do not leave a placeholder domain in production.

Local image uploads are **disabled on Vercel**. See [Media](./media.md).

## Local development

```bash
npm install
npm run dev        # next dev
npm run build      # production build
npm run start      # serve the build
npm run lint
npm run typecheck
```

## Build characteristics

- Root layout is `force-dynamic` so published content is read from PostgreSQL at request time
- `/articles/[slug]` and `/authors/[id]` use `generateStaticParams` when the DB is available at build
- Archive filtering remains URL-driven on the server
- Shiki loaded as a server external package
- Local image uploads under `public/uploads/` are **not** production-ready on Vercel (see [Media](./media.md))

## Configuration

`next.config.ts` currently sets:

- `reactStrictMode: true`
- `agentRules: false` (project rules live in `rules/` + `docs/`)
- `devIndicators: false`
- `serverExternalPackages: ["shiki"]`

## Not configured in-repo yet

- Vercel project linking
- Custom domain
- Analytics

`metadataBase` in `src/app/layout.tsx` comes from `resolveMetadataBase()` (`src/lib/site-url.ts`): `AUTH_URL` if set, otherwise the Vercel deployment host, otherwise `http://localhost:3000`. Set `AUTH_URL` to the real public origin in production.

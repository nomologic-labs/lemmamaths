# Deployment

## Target

Production deployment is intended for **Vercel** (`docs/decisions/002-technology-stack.md`). V0.1 does not require environment variables for core reading features.

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

- Static generation for article and author pages
- Dynamic server rendering for `/articles` (search params)
- Shiki loaded as a server external package

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
- Environment-specific secrets (none required for V0.1 mock data)

`metadataBase` in `src/app/layout.tsx` uses a placeholder origin (`https://lemma.example`) until a real site URL is chosen.

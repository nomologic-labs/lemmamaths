# Dependencies

## Runtime (`package.json`)

| Package | Why it is present |
|---------|-------------------|
| `next` | App framework, routing, font/image optimisation, Vercel target |
| `react` / `react-dom` | UI |
| `katex` | Mathematical typesetting (inline + display) |
| `shiki` | Server-side syntax highlighting with dual themes |
| `server-only` | Compile-time guard so server modules are not bundled for the client |
| `drizzle-orm` | Type-safe PostgreSQL access for user accounts |
| `@neondatabase/serverless` | Neon HTTP driver for Vercel-compatible database connections |
| `next-auth` | Auth.js v5 (beta) — Google OAuth and database sessions |
| `@auth/drizzle-adapter` | Auth.js ↔ Drizzle PostgreSQL adapter |
| `zod` | Server-side validation for article drafts and `ArticleBlock[]` (including required stable block ids) |

## Dev tooling

| Package | Why |
|---------|-----|
| `typescript` | Typechecking |
| `eslint` / `eslint-config-next` | Lint, including React Compiler–oriented rules |
| `@types/*` | Type definitions |
| `drizzle-kit` | Schema migrations (`drizzle/` output) |
| `tsx` | Runs seed/tests (`npm run db:seed`, `test:*`) |
| `puppeteer-core` | Optional screenshot scripts under `scripts/` (not required to run the site) |

## Deliberately not added yet

- Email providers (`resend`, `nodemailer`) — not in auth plan
- Tailwind / CSS-in-JS libraries — CSS Modules + tokens cover the design system
- Markdown/MDX loaders — content is a typed block tree
- Client-side highlight.js / Prism — Shiki on the server avoids shipping grammars to readers
- Animation libraries (Framer Motion, GSAP) — CSS + small IntersectionObserver reveals suffice
- State libraries — URL + React state cover prototype needs

Before adding a dependency, check whether tokens, Next.js, KaTeX, Shiki, or Drizzle already solve the problem (`rules/20-engineering.mdc`).

## Database scripts

```bash
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:seed          # author profiles + published mock articles (requires DATABASE_URL)
npm run test:auth         # authorization permission unit tests
npm run test:articles     # article validation, block ids, workflow, access, publish gates
npm run test:review       # review authorization, comments, workflow integration
npm run test:publishing   # public visibility semantics + seed fixture integrity
npm run test:url-policy   # href/figure URL allowlist
```

Migrations through `0006_publishing_fields` require a configured `DATABASE_URL`. Without it, seed/migrate and live DB-backed public reads cannot be verified locally.

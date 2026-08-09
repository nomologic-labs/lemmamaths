# Dependencies

## Runtime (`package.json`)

| Package | Why it is present |
|---------|-------------------|
| `next` | App framework, routing, font/image optimisation, Vercel target |
| `react` / `react-dom` | UI |
| `katex` | Mathematical typesetting (inline + display) |
| `shiki` | Server-side syntax highlighting with dual themes |
| `server-only` | Compile-time guard so server modules are not bundled for the client |

## Dev tooling

| Package | Why |
|---------|-----|
| `typescript` | Typechecking |
| `eslint` / `eslint-config-next` | Lint, including React Compiler–oriented rules |
| `@types/*` | Type definitions |
| `puppeteer-core` | Optional screenshot scripts under `scripts/` (not required to run the site) |

## Deliberately not added in V0.1

- Tailwind / CSS-in-JS libraries — CSS Modules + tokens already cover the design system
- Markdown/MDX loaders — content is a typed block tree
- Client-side highlight.js / Prism — Shiki on the server avoids shipping grammars to readers
- Animation libraries (Framer Motion, GSAP) — CSS + small IntersectionObserver reveals suffice
- State libraries — URL + React state cover prototype needs
- Auth / database SDKs — deferred until providers are chosen

Before adding a dependency, check whether tokens, Next.js, KaTeX, or Shiki already solve the problem (`rules/20-engineering.mdc`).

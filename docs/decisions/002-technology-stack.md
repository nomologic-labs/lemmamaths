Decision 002 — Technology Stack

Status: Accepted
Date: 2026-08-08

Frontend / Application

Lemma will use:

Next.js
React
TypeScript
Deployment

The production application will be deployed through Vercel.

Vercel is considered the deployment/platform layer.

Backend

The backend architecture will use Vercel-compatible server-side functionality and external services where appropriate.

A specific database, authentication provider, and object-storage provider have not yet been permanently selected.

Do not hard-code a provider before that decision is made.

Mathematics

Use KaTeX for mathematical rendering.

Content

The article system should support structured mathematical content rather than treating articles as ordinary plain text.

Code

Use a dedicated syntax-highlighting system capable of rendering common programming languages.

Architectural Principle

The application should avoid unnecessary vendor lock-in where practical.

Technology decisions should support the primary goal: a maintainable student publication that can survive the transition between student contributors.
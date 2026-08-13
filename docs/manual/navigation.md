# Navigation

## Purpose

Primary navigation is a **drawer**, not a top mega-menu. It should feel editorial — part of the publication — rather than like an application sidebar.

## Important files

```text
src/components/navigation/SiteChrome.tsx       Owns open state for drawer + search
src/components/navigation/SiteHeader.tsx
src/components/navigation/NavigationDrawer.tsx
src/components/navigation/SearchDialog.tsx
src/components/navigation/AppearanceControl.tsx
src/components/navigation/SiteFooter.tsx
src/components/navigation/nav-items.ts
src/lib/hooks/useDialog.ts
```

## Structure

`SiteChrome` (client) wraps:

1. **SiteHeader** — menu button, optional brand (hidden on unscrolled homepage), search affordance
2. **NavigationDrawer** — modal dialog; full-screen-friendly on small viewports
3. **SearchDialog** — separate modal for quick search

The root layout mounts `SiteChrome` above `<main>` and `SiteFooter` below.

## Drawer contents

From product rules / `nav-items.ts` + drawer chrome:

- Lemma wordmark / logo
- Search trigger
- Home, Articles, Topics, Authors, About (with counts where useful)
- Appearance control (light / dark / system)
- Contributor section (`AuthNav`): signed out, a *Contributor dashboard* link; signed in, the
  links the account's permissions allow — Dashboard, My drafts, Published, Peer review, and
  (for administrators) Editorial review and Accounts. Sources: `src/lib/auth/nav-links.ts`.

Active section highlighting uses `isActivePath` so `/articles/some-slug` lights **Articles**.

## Behaviour

- Scrim click, Escape, and the close control dismiss the drawer (`useDialog` handles focus trap / restore).
- Closed drawer stays mounted with `inert` so open/close transitions can run both ways without tabbing into hidden UI.
- Opening search from the drawer closes the drawer first.
- `/` key opens search globally unless the user is typing in a field.

## Responsive

- Desktop: side drawer over the page.
- Mobile: near-full-screen navigation surface (CSS in `NavigationDrawer.module.css`).

## Footer

`SiteFooter` repeats primary destinations and branding for readers who reach the end of a long page without reopening the drawer.

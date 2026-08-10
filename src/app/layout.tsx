import type { Metadata, Viewport } from "next";
import { SiteChrome } from "@/components/navigation/SiteChrome";
import type { NavSession } from "@/components/navigation/session";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { TOPICS } from "@/data/topics";
import { listPublishedSummaries, listPublicAuthors } from "@/lib/articles/public";
import { buildSearchIndex } from "@/lib/articles/search-index";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { getContributorNavLinks } from "@/lib/auth/nav-links";
import { resolveMetadataBase } from "@/lib/site-url";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ThemeScript } from "@/lib/theme/theme-script";
import { fontVariables } from "@/styles/fonts";

import "katex/dist/katex.min.css";
import "@/styles/globals.css";

/** Public chrome and listings read published rows from PostgreSQL. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Lemma — a student mathematical publication",
    template: "%s · Lemma",
  },
  description:
    "A student-run journal and archive of mathematical writing: articles, investigations, essays and problems, refereed by students.",
};

export const viewport: Viewport = {
  // Both themes' page backgrounds, so the browser chrome matches on mobile.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5ede0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c0e05" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [authUser, summaries, authors, searchIndex] = await Promise.all([
    getAuthenticatedUser(),
    listPublishedSummaries(),
    listPublicAuthors(),
    buildSearchIndex(),
  ]);

  const counts = {
    articles: summaries.length,
    topics: TOPICS.length,
    authors: authors.length,
  };

  const navSession: NavSession = authUser
    ? {
        user: {
          handle: authUser.handle,
          name: authUser.name,
        },
        contributorLinks: getContributorNavLinks(authUser.roles),
      }
    : null;

  return (
    // The inline theme script sets data-theme before React hydrates, so the server
    // markup and the live DOM legitimately differ on this one attribute.
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={fontVariables}>
        <ThemeProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <SiteChrome counts={counts} searchIndex={searchIndex} session={navSession} />
          <main id="main">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

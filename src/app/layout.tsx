import type { Metadata, Viewport } from "next";
import { SiteChrome } from "@/components/navigation/SiteChrome";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { ARTICLE_SUMMARIES } from "@/data/articles";
import { AUTHORS } from "@/data/authors";
import { TOPICS } from "@/data/topics";
import { buildSearchIndex } from "@/lib/articles/search-index";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ThemeScript } from "@/lib/theme/theme-script";
import { fontVariables } from "@/styles/fonts";

import "katex/dist/katex.min.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lemma.example"),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const counts = {
    articles: ARTICLE_SUMMARIES.length,
    topics: TOPICS.length,
    authors: AUTHORS.length,
  };

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
          <SiteChrome counts={counts} searchIndex={buildSearchIndex()} />
          <main id="main">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

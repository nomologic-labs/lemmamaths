import "server-only";

import { createHighlighter, type Highlighter } from "shiki";
import { lemmaDark, lemmaLight } from "./theme";

/*
 * Syntax highlighting runs on the server at render time and produces plain HTML, so no
 * highlighter reaches the browser. The engineering rules require that highlighted HTML
 * is never stored as article content; storing it would freeze the colours of every
 * published article against the theme they happened to be written under.
 *
 * Both themes are emitted in a single pass. Shiki writes --shiki-light and --shiki-dark
 * custom properties onto each token, and src/components/articles/blocks/CodeBlock.module.css
 * picks one according to [data-theme]. This is what makes the theme toggle instant on a
 * page full of code, with no re-render and no flash.
 */

const LANGUAGES = ["python", "typescript", "javascript", "bash", "c", "json"] as const;

type SupportedLanguage = (typeof LANGUAGES)[number];

const ALIASES: Record<string, SupportedLanguage> = {
  py: "python",
  ts: "typescript",
  js: "javascript",
  sh: "bash",
  shell: "bash",
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  // Loading grammars is expensive, so the instance is created once and reused for every
  // article rendered in this process.
  highlighterPromise ??= createHighlighter({
    themes: [lemmaLight, lemmaDark],
    langs: [...LANGUAGES],
  });
  return highlighterPromise;
}

function resolveLanguage(language: string): SupportedLanguage | "text" {
  const normalised = language.toLowerCase().trim();
  if ((LANGUAGES as readonly string[]).includes(normalised)) {
    return normalised as SupportedLanguage;
  }
  return ALIASES[normalised] ?? "text";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Returns a `<pre class="shiki">` fragment. Falls back to escaped plain text for an
 * unknown language rather than failing the page — an article should still be readable
 * if an author labels a block with something we do not have a grammar for.
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  const resolved = resolveLanguage(language);
  if (resolved === "text") {
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }

  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: resolved,
    themes: { light: "lemma-light", dark: "lemma-dark" },
    // Emit both themes as custom properties instead of picking one at build time.
    defaultColor: false,
  });
}

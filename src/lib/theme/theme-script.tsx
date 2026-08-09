import { THEME_STORAGE_KEY } from "./constants";

/*
 * Runs synchronously in <head>, before first paint. It does three things.
 *
 * 1. Sets data-theme, so the parchment background never flashes on a dark-mode
 *    reader's screen.
 * 2. Sets data-js="on". Anything that only makes sense with scripting — the archive's
 *    auto-submitting filters, for instance — is hidden or shown against this flag, so
 *    the no-JS fallback is the default rather than an afterthought.
 * 3. Sets data-motion="on", which is what allows scroll reveals to start hidden.
 *    That flag is only set when the reader has not asked for reduced motion, so with
 *    JavaScript disabled — or with reduced motion on — every revealed section renders
 *    in its final visible state instead of staying at opacity zero waiting for an
 *    observer that will never run.
 *
 * It is deliberately tiny and dependency-free because it blocks rendering.
 */
const script = `(function(){var d=document.documentElement;d.dataset.js="on";try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});d.dataset.theme=s==="light"||s==="dark"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");if(!matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.motion="on";}catch(e){d.dataset.theme="light";}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

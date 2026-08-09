import katex from "katex";

/*
 * Mathematics is rendered to HTML on the server. KaTeX is synchronous and fast enough
 * to run during the render pass, which means equations are present in the initial HTML:
 * no client-side typesetting library, no reflow as formulae appear, and the page is
 * readable with JavaScript disabled.
 *
 * KaTeX emits both HTML and MathML. The MathML is what screen readers announce and the
 * HTML is what is painted; katex.min.css hides whichever is not needed.
 */

const BASE_OPTIONS: katex.KatexOptions = {
  // Never throw during a page render. A malformed expression from an author should
  // show as a marked-up error in place of that one formula, not take down the article.
  throwOnError: false,
  errorColor: "#b3261e",
  // Author TeX is untrusted input. Leaving `trust` false disables \href, \htmlClass,
  // \includegraphics and the other commands that can inject markup or navigate away.
  trust: false,
  strict: false,
  output: "htmlAndMathml",
};

export function renderInlineMath(tex: string): string {
  return katex.renderToString(tex, { ...BASE_OPTIONS, displayMode: false });
}

export function renderDisplayMath(tex: string): string {
  return katex.renderToString(tex, { ...BASE_OPTIONS, displayMode: true });
}

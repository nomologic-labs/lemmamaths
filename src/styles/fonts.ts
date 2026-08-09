import { Inter, JetBrains_Mono, Literata, Newsreader } from "next/font/google";

/*
 * All four families are downloaded and self-hosted at build time by next/font, so the
 * running site makes no request to Google and there is no layout shift beyond the
 * `swap` fallback period.
 *
 * Newsreader and Literata are variable fonts with an optical-size axis. Requesting
 * `opsz` lets the browser use the display cut for the hero and the text cut for body
 * copy from a single file, which is why headings hold contrast at 9rem while article
 * prose stays comfortable at 17px.
 */

export const displaySerif = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const bodySerif = Literata({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-body",
});

export const uiSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

export const codeMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const fontVariables = [
  displaySerif.variable,
  bodySerif.variable,
  uiSans.variable,
  codeMono.variable,
].join(" ");

import type { ThemeRegistrationRaw } from "shiki";

/*
 * Two hand-written TextMate themes in the Lemma palette.
 *
 * Every bundled Shiki theme is built for a code editor and assumes a cool grey or near
 * black background; dropping one into a parchment page looks like a screenshot from a
 * different website. These use ink for identifiers, saddle for keywords, a muted moss
 * green for literals and a faded brown for comments — five roles, which is as many as a
 * reader needs, and no hue that fights the brand.
 *
 * Backgrounds are deliberately omitted from the rendered output; the code block sets
 * its own surface from the theme tokens. See src/lib/code/highlight.ts.
 */

export const lemmaLight: ThemeRegistrationRaw = {
  name: "lemma-light",
  type: "light",
  settings: [
    { settings: { foreground: "#2b1509" } },
    {
      scope: ["comment", "punctuation.definition.comment", "string.quoted.docstring"],
      settings: { foreground: "#9a7752", fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.logical",
        "storage",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#8c4a1e", fontStyle: "bold" },
    },
    {
      scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"],
      settings: { foreground: "#55632f" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character", "support.constant"],
      settings: { foreground: "#a1622a" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call.generic"],
      settings: { foreground: "#2b1509", fontStyle: "bold" },
    },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: "#7a3f2a", fontStyle: "bold" },
    },
    { scope: ["variable.parameter", "variable.other"], settings: { foreground: "#3d2110" } },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: "#7a5638" },
    },
    { scope: ["invalid"], settings: { foreground: "#b3261e" } },
  ],
};

export const lemmaDark: ThemeRegistrationRaw = {
  name: "lemma-dark",
  type: "dark",
  settings: [
    { settings: { foreground: "#efe4d3" } },
    {
      scope: ["comment", "punctuation.definition.comment", "string.quoted.docstring"],
      settings: { foreground: "#a2825d", fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.logical",
        "storage",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#dda767", fontStyle: "bold" },
    },
    {
      scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"],
      settings: { foreground: "#a9bd7c" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character", "support.constant"],
      settings: { foreground: "#e3b483" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call.generic"],
      settings: { foreground: "#f7efe3", fontStyle: "bold" },
    },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: "#e0b9a0", fontStyle: "bold" },
    },
    { scope: ["variable.parameter", "variable.other"], settings: { foreground: "#e2d3bd" } },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: "#bb9a70" },
    },
    { scope: ["invalid"], settings: { foreground: "#e8827a" } },
  ],
};

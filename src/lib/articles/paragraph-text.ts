import type { InlineNode } from "@/data/types";

export function paragraphToText(content: InlineNode[]): string {
  return content
    .map((node) => {
      if (typeof node === "string") return node;
      if (node.kind === "code") return node.text;
      if (node.kind === "math") return `$${node.tex}$`;
      if (node.kind === "link" || node.kind === "emphasis" || node.kind === "strong") {
        return paragraphToText(node.content);
      }
      return "";
    })
    .join("");
}

export function textToParagraph(text: string): InlineNode[] {
  return text ? [text] : [""];
}

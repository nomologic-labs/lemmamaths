import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBlockId } from "../../src/lib/articles/block-ids";
import { isSafeFigureSrc, isSafeHref } from "../../src/lib/articles/url-policy";
import { parseArticleBody } from "../../src/lib/articles/validation";

describe("isSafeHref", () => {
  it("accepts valid HTTPS URL", () => {
    assert.equal(isSafeHref("https://example.com/path"), true);
  });

  it("accepts valid HTTP URL", () => {
    assert.equal(isSafeHref("http://example.com"), true);
  });

  it("accepts valid relative URL", () => {
    assert.equal(isSafeHref("/articles/newton"), true);
    assert.equal(isSafeHref("/authors/nadia-okonkwo"), true);
  });

  it("rejects javascript URL", () => {
    assert.equal(isSafeHref("javascript:alert(1)"), false);
    assert.equal(isSafeHref("JAVASCRIPT:alert(1)"), false);
  });

  it("rejects data URL", () => {
    assert.equal(isSafeHref("data:text/html,hi"), false);
  });

  it("rejects vbscript URL", () => {
    assert.equal(isSafeHref("vbscript:msgbox(1)"), false);
  });

  it("rejects arbitrary custom schemes", () => {
    assert.equal(isSafeHref("ftp://files.example.com/a"), false);
    assert.equal(isSafeHref("lemma://internal"), false);
  });

  it("rejects protocol-relative and traversal paths", () => {
    assert.equal(isSafeHref("//evil.example/path"), false);
    assert.equal(isSafeHref("/../secret"), false);
  });
});

describe("isSafeFigureSrc", () => {
  it("accepts /figures and /uploads paths", () => {
    assert.equal(isSafeFigureSrc("/figures/newton-basins.png"), true);
    assert.equal(
      isSafeFigureSrc("/uploads/articles/11111111-1111-1111-1111-111111111111/a.png"),
      true,
    );
  });

  it("rejects remote and unsafe sources", () => {
    assert.equal(isSafeFigureSrc("https://cdn.example.com/x.png"), false);
    assert.equal(isSafeFigureSrc("javascript:alert(1)"), false);
    assert.equal(isSafeFigureSrc("//cdn.example.com/x.png"), false);
    assert.equal(isSafeFigureSrc("/etc/passwd"), false);
    assert.equal(isSafeFigureSrc("/figures/../uploads/x.png"), false);
  });
});

describe("article body URL validation", () => {
  const id = () => createBlockId();

  it("accepts safe links and figure paths", () => {
    const body = parseArticleBody([
      {
        id: id(),
        kind: "paragraph",
        content: [
          {
            kind: "link",
            href: "https://example.com",
            content: ["Example"],
          },
        ],
      },
      {
        id: id(),
        kind: "figure",
        src: "/figures/newton-basins.png",
        alt: "Basins",
        width: 800,
        height: 600,
      },
    ]);
    assert.equal(body.length, 2);
  });

  it("rejects javascript and data links at storage time", () => {
    assert.throws(() =>
      parseArticleBody([
        {
          id: id(),
          kind: "paragraph",
          content: [{ kind: "link", href: "javascript:alert(1)", content: ["x"] }],
        },
      ]),
    );
    assert.throws(() =>
      parseArticleBody([
        {
          id: id(),
          kind: "paragraph",
          content: [{ kind: "link", href: "data:text/html,hi", content: ["x"] }],
        },
      ]),
    );
  });

  it("rejects remote figure sources at storage time", () => {
    assert.throws(() =>
      parseArticleBody([
        {
          id: id(),
          kind: "figure",
          src: "https://evil.example/x.png",
          alt: "x",
          width: 1,
          height: 1,
        },
      ]),
    );
  });
});

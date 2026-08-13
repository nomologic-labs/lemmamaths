"use client";

import { useState } from "react";
import type { ArticleBlock } from "@/data/types";
import { createBlockId } from "@/lib/articles/block-ids";
import { CODE_LANGUAGES } from "@/lib/articles/editor-types";
import { paragraphToText, textToParagraph } from "@/lib/articles/paragraph-text";
import { MathPreview } from "./MathPreview";
import styles from "./BlockEditor.module.css";

type BlockEditorProps = {
  block: ArticleBlock;
  articleId: string;
  uploadsEnabled: boolean;
  onChange: (block: ArticleBlock) => void;
};

export function BlockEditor({ block, articleId, uploadsEnabled, onChange }: BlockEditorProps) {
  switch (block.kind) {
    case "paragraph":
      return (
        <label className={styles.field}>
          <span className={styles.label}>Paragraph</span>
          <textarea
            className={styles.textarea}
            value={paragraphToText(block.content)}
            onChange={(event) =>
              onChange({ ...block, content: textToParagraph(event.target.value) })
            }
            rows={4}
          />
        </label>
      );

    case "heading":
      return (
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Level</span>
            <select
              className={styles.select}
              value={block.level}
              onChange={(event) =>
                onChange({
                  ...block,
                  level: Number(event.target.value) as 2 | 3,
                })
              }
            >
              <option value={2}>Section (H2)</option>
              <option value={3}>Subsection (H3)</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Heading</span>
            <input
              className={styles.input}
              value={block.text}
              onChange={(event) => onChange({ ...block, text: event.target.value })}
            />
          </label>
        </div>
      );

    case "math":
      return (
        <div className={styles.stack}>
          <label className={styles.field}>
            <span className={styles.label}>LaTeX</span>
            <textarea
              className={styles.textareaMono}
              value={block.tex}
              onChange={(event) => onChange({ ...block, tex: event.target.value })}
              rows={3}
              spellCheck={false}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Equation number (optional)</span>
            <input
              className={styles.input}
              value={block.tag ?? ""}
              onChange={(event) =>
                onChange({ ...block, tag: event.target.value || undefined })
              }
            />
          </label>
          <MathPreview tex={block.tex} />
        </div>
      );

    case "statement":
      return (
        <div className={styles.stack}>
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Type</span>
              <select
                className={styles.select}
                value={block.variant}
                onChange={(event) =>
                  onChange({
                    ...block,
                    variant: event.target.value as typeof block.variant,
                  })
                }
              >
                <option value="theorem">Theorem</option>
                <option value="lemma">Lemma</option>
                <option value="proposition">Proposition</option>
                <option value="corollary">Corollary</option>
                <option value="definition">Definition</option>
                <option value="example">Example</option>
                <option value="remark">Remark</option>
                <option value="exercise">Exercise</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Title (optional)</span>
              <input
                className={styles.input}
                value={block.title ?? ""}
                onChange={(event) =>
                  onChange({ ...block, title: event.target.value || undefined })
                }
              />
            </label>
          </div>
          <NestedParagraphEditor
            label="Statement"
            blocks={block.content}
            onChange={(content) => onChange({ ...block, content })}
          />
        </div>
      );

    case "proof":
      return (
        <div className={styles.stack}>
          <label className={styles.field}>
            <span className={styles.label}>Proof of (optional)</span>
            <input
              className={styles.input}
              value={block.of ?? ""}
              onChange={(event) => onChange({ ...block, of: event.target.value || undefined })}
            />
          </label>
          <NestedParagraphEditor
            label="Proof body"
            blocks={block.content}
            onChange={(content) => onChange({ ...block, content })}
          />
        </div>
      );

    case "figure":
      return (
        <FigureBlockEditor
          block={block}
          articleId={articleId}
          uploadsEnabled={uploadsEnabled}
          onChange={onChange}
        />
      );

    case "code":
      return (
        <div className={styles.stack}>
          <label className={styles.field}>
            <span className={styles.label}>Language</span>
            <select
              className={styles.select}
              value={block.language}
              onChange={(event) => onChange({ ...block, language: event.target.value })}
            >
              {CODE_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Code</span>
            <textarea
              className={styles.textareaMono}
              value={block.code}
              onChange={(event) => onChange({ ...block, code: event.target.value })}
              rows={10}
              spellCheck={false}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Caption (optional)</span>
            <input
              className={styles.input}
              value={block.caption ?? ""}
              onChange={(event) =>
                onChange({ ...block, caption: event.target.value || undefined })
              }
            />
          </label>
        </div>
      );

    case "list":
      return (
        <p className={styles.unsupported}>
          Lists cannot be edited yet. This list will still publish as it is — to change it,
          rewrite it as paragraphs and delete this block.
        </p>
      );

    case "quote":
      return (
        <div className={styles.stack}>
          <label className={styles.field}>
            <span className={styles.label}>Quote</span>
            <textarea
              className={styles.textarea}
              value={paragraphToText(block.content)}
              onChange={(event) =>
                onChange({ ...block, content: textToParagraph(event.target.value) })
              }
              rows={3}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Attribution (optional)</span>
            <input
              className={styles.input}
              value={block.attribution ?? ""}
              onChange={(event) =>
                onChange({ ...block, attribution: event.target.value || undefined })
              }
            />
          </label>
        </div>
      );
  }
}

function FigureBlockEditor({
  block,
  articleId,
  uploadsEnabled,
  onChange,
}: {
  block: Extract<ArticleBlock, { kind: "figure" }>;
  articleId: string;
  uploadsEnabled: boolean;
  onChange: (block: ArticleBlock) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/articles/${articleId}/upload-image`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { src?: string; error?: string };
      if (!response.ok || !payload.src) {
        setUploadError(payload.error ?? "Upload failed. The image was not attached.");
        return;
      }
      onChange({ ...block, src: payload.src });
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.stack}>
      <label className={styles.field}>
        <span className={styles.label}>Alt text (described for screen readers)</span>
        <input
          className={styles.input}
          value={block.alt}
          onChange={(event) => onChange({ ...block, alt: event.target.value })}
        />
      </label>
      {uploadsEnabled ? (
        <label className={styles.field}>
          <span className={styles.label}>Upload image (PNG or JPEG, max 5 MB)</span>
          <input
            className={styles.file}
            type="file"
            accept="image/png,image/jpeg"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </label>
      ) : (
        <p className={styles.hint}>
          Image upload is disabled in this environment (not durable on Vercel). Use a
          path under <code>/figures/</code> for checked-in assets.
        </p>
      )}
      {uploading && <p className={styles.hint}>Uploading…</p>}
      {uploadError && (
        <p className={styles.error} role="alert">
          {uploadError}
        </p>
      )}
      <label className={styles.field}>
        <span className={styles.label}>Image path</span>
        <input
          className={styles.input}
          value={block.src}
          placeholder="/figures/example.png"
          onChange={(event) => onChange({ ...block, src: event.target.value })}
        />
      </label>
      {block.src && (
        <p className={styles.hint}>
          Current image: <code>{block.src}</code>
        </p>
      )}
      <label className={styles.field}>
        <span className={styles.label}>Caption (optional)</span>
        <input
          className={styles.input}
          value={block.caption ? paragraphToText(block.caption) : ""}
          placeholder="Shown under the image as “Figure 1. …”"
          onChange={(event) => {
            const text = event.target.value;
            onChange({ ...block, caption: text ? textToParagraph(text) : undefined });
          }}
        />
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Width (px)</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={block.width}
            onChange={(event) => onChange({ ...block, width: Number(event.target.value) || 1 })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Height (px)</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={block.height}
            onChange={(event) => onChange({ ...block, height: Number(event.target.value) || 1 })}
          />
        </label>
      </div>
    </div>
  );
}

function NestedParagraphEditor({
  label,
  blocks,
  onChange,
}: {
  label: string;
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}) {
  const paragraph =
    blocks.find((block): block is Extract<ArticleBlock, { kind: "paragraph" }> => block.kind === "paragraph") ??
    ({ id: createBlockId(), kind: "paragraph", content: [""] } as const);

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <textarea
        className={styles.textarea}
        value={paragraphToText(paragraph.content)}
        onChange={(event) =>
          onChange([
            {
              id: paragraph.id,
              kind: "paragraph",
              content: textToParagraph(event.target.value),
            },
          ])
        }
        rows={5}
      />
    </label>
  );
}

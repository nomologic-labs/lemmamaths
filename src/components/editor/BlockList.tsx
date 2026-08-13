"use client";

import { useState } from "react";
import type { ArticleBlock } from "@/data/types";
import { BLOCK_KIND_LABELS } from "@/lib/articles/block-labels";
import {
  BLOCK_MENU_ITEMS,
  createEditorBlock,
  defaultBlockForKind,
  duplicateEditorBlock,
  type EditorBlock,
} from "@/lib/articles/editor-types";
import { BlockEditor } from "./BlockEditor";
import styles from "./BlockList.module.css";

type BlockListProps = {
  blocks: EditorBlock[];
  articleId: string;
  uploadsEnabled: boolean;
  onChange: (blocks: EditorBlock[]) => void;
};

export function BlockList({ blocks, articleId, uploadsEnabled, onChange }: BlockListProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function updateBlock(id: string, block: ArticleBlock) {
    onChange(blocks.map((entry) => (entry.id === id ? { ...entry, block } : entry)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((entry) => entry.id !== id));
  }

  function duplicateBlock(id: string) {
    const index = blocks.findIndex((entry) => entry.id === id);
    if (index === -1) return;
    const copy = duplicateEditorBlock(blocks[index]!);
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((entry) => entry.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next);
  }

  function addBlock(kind: (typeof BLOCK_MENU_ITEMS)[number]["kind"]) {
    onChange([...blocks, createEditorBlock(defaultBlockForKind(kind))]);
    setMenuOpen(false);
  }

  return (
    <div className={styles.list}>
      {blocks.map((entry, index) => (
        <section key={entry.id} className={styles.block} data-kind={entry.block.kind}>
          <header className={styles.blockHead}>
            <span className={styles.blockType}>{BLOCK_KIND_LABELS[entry.block.kind]}</span>
            <div className={styles.blockActions}>
              <button
                type="button"
                className={styles.action}
                onClick={() => moveBlock(entry.id, -1)}
                disabled={index === 0}
                aria-label="Move block up"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.action}
                onClick={() => moveBlock(entry.id, 1)}
                disabled={index === blocks.length - 1}
                aria-label="Move block down"
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.action}
                onClick={() => duplicateBlock(entry.id)}
                aria-label="Duplicate block"
              >
                Duplicate
              </button>
              <button
                type="button"
                className={styles.actionDanger}
                onClick={() => removeBlock(entry.id)}
                aria-label="Delete block"
              >
                Delete
              </button>
            </div>
          </header>
          <BlockEditor
            block={entry.block}
            articleId={articleId}
            uploadsEnabled={uploadsEnabled}
            onChange={(block) => updateBlock(entry.id, block)}
          />
        </section>
      ))}

      <div className={styles.addWrap}>
        <button type="button" className={styles.addButton} onClick={() => setMenuOpen((open) => !open)}>
          + Add block
        </button>
        {menuOpen && (
          <menu className={styles.addMenu}>
            {BLOCK_MENU_ITEMS.map((item) => (
              <li key={item.kind}>
                <button type="button" onClick={() => addBlock(item.kind)}>
                  {item.label}
                </button>
              </li>
            ))}
          </menu>
        )}
      </div>
    </div>
  );
}

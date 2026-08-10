"use client";

import { TOPICS } from "@/data/topics";
import type { ArticleFormat, TopicId } from "@/data/types";
import { FORMAT_LABELS, FORMAT_ORDER } from "@/lib/articles/labels";
import type { EligibleAuthor } from "@/lib/articles/store";
import styles from "./MetadataPanel.module.css";

export type EditorMetadata = {
  title: string;
  standfirst: string;
  description: string;
  format: ArticleFormat;
  topics: TopicId[];
  tags: string;
  authorUserIds: string[];
  featured: boolean;
};

type MetadataPanelProps = {
  metadata: EditorMetadata;
  eligibleAuthors: EligibleAuthor[];
  canEditFeatured: boolean;
  onChange: (metadata: EditorMetadata) => void;
};

export function MetadataPanel({
  metadata,
  eligibleAuthors,
  canEditFeatured,
  onChange,
}: MetadataPanelProps) {
  function toggleTopic(topic: TopicId) {
    const has = metadata.topics.includes(topic);
    const topics = has
      ? metadata.topics.filter((entry) => entry !== topic)
      : [...metadata.topics, topic];
    onChange({ ...metadata, topics });
  }

  function toggleAuthor(userId: string) {
    const has = metadata.authorUserIds.includes(userId);
    const authorUserIds = has
      ? metadata.authorUserIds.filter((id) => id !== userId)
      : [...metadata.authorUserIds, userId];
    onChange({ ...metadata, authorUserIds });
  }

  return (
    <aside className={styles.panel}>
      <h2 className={styles.heading}>Article settings</h2>

      <label className={styles.field}>
        <span className={styles.label}>Title</span>
        <input
          className={styles.input}
          value={metadata.title}
          onChange={(event) => onChange({ ...metadata, title: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Standfirst</span>
        <textarea
          className={styles.textarea}
          value={metadata.standfirst}
          onChange={(event) => onChange({ ...metadata, standfirst: event.target.value })}
          rows={2}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Description</span>
        <textarea
          className={styles.textarea}
          value={metadata.description}
          onChange={(event) => onChange({ ...metadata, description: event.target.value })}
          rows={3}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Format</span>
        <select
          className={styles.select}
          value={metadata.format}
          onChange={(event) =>
            onChange({ ...metadata, format: event.target.value as ArticleFormat })
          }
        >
          {FORMAT_ORDER.map((format) => (
            <option key={format} value={format}>
              {FORMAT_LABELS[format]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Topics</legend>
        <div className={styles.chips}>
          {TOPICS.map((topic) => (
            <label key={topic.id} className={styles.chip}>
              <input
                type="checkbox"
                checked={metadata.topics.includes(topic.id)}
                onChange={() => toggleTopic(topic.id)}
              />
              <span>{topic.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>Tags (comma-separated)</span>
        <input
          className={styles.input}
          value={metadata.tags}
          onChange={(event) => onChange({ ...metadata, tags: event.target.value })}
        />
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Authors</legend>
        <div className={styles.chips}>
          {eligibleAuthors.map((author) => (
            <label key={author.id} className={styles.chip}>
              <input
                type="checkbox"
                checked={metadata.authorUserIds.includes(author.id)}
                onChange={() => toggleAuthor(author.id)}
              />
              <span>@{author.handle}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {canEditFeatured && (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={metadata.featured}
            onChange={(event) => onChange({ ...metadata, featured: event.target.checked })}
          />
          <span>Featured article</span>
        </label>
      )}
    </aside>
  );
}

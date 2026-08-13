"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArticleFormat, TopicId } from "@/data/types";
import { saveDraftAction, submitDraftAction } from "@/lib/articles/actions";
import {
  stripEditorBlocks,
  type EditorBlock,
  type EditorMetadata,
} from "@/lib/articles/editor-types";
import type { EligibleAuthor } from "@/lib/articles/store";
import type { ArticleWorkflowStatus } from "@/lib/articles/workflow";
import {
  WORKFLOW_CONTRIBUTOR_HINTS,
  WORKFLOW_LABELS,
} from "@/lib/articles/workflow-labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { ArrowRightIcon } from "@/components/ui/icons";
import { BlockList } from "./BlockList";
import { MetadataPanel } from "./MetadataPanel";
import styles from "./ArticleEditor.module.css";

type SaveState = "saved" | "saving" | "dirty" | "error";

type ArticleEditorProps = {
  articleId: string;
  initialMetadata: EditorMetadata;
  initialBlocks: EditorBlock[];
  workflowStatus: ArticleWorkflowStatus;
  eligibleAuthors: EligibleAuthor[];
  canEditFeatured: boolean;
  canSubmit: boolean;
  lastSavedAt: string;
  uploadsEnabled: boolean;
};

const AUTOSAVE_MS = 2500;

type SavePayload = {
  articleId: string;
  metadata: {
    title: string;
    standfirst?: string;
    description: string;
    format: ArticleFormat;
    topics: TopicId[];
    tags: string[];
    authorUserIds: string[];
    featured: boolean;
  };
  body: ReturnType<typeof stripEditorBlocks>;
};

function buildPayload(
  articleId: string,
  metadata: EditorMetadata,
  blocks: EditorBlock[],
): SavePayload {
  return {
    articleId,
    metadata: {
      title: metadata.title.trim() || "Untitled",
      standfirst: metadata.standfirst.trim() || undefined,
      description: metadata.description,
      format: metadata.format,
      topics: metadata.topics,
      tags: metadata.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      authorUserIds: metadata.authorUserIds,
      featured: metadata.featured,
    },
    body: stripEditorBlocks(blocks),
  };
}

export function ArticleEditor({
  articleId,
  initialMetadata,
  initialBlocks,
  workflowStatus,
  eligibleAuthors,
  canEditFeatured,
  canSubmit,
  lastSavedAt,
  uploadsEnabled,
}: ArticleEditorProps) {
  const [metadata, setMetadata] = useState(initialMetadata);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveMessage, setSaveMessage] = useState(
    `Saved ${new Date(lastSavedAt).toLocaleString("en-GB")}`,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutosave = useRef(true);
  const metadataRef = useRef(metadata);
  const blocksRef = useRef(blocks);
  const persistInFlight = useRef(false);
  const persistQueued = useRef(false);

  useEffect(() => {
    metadataRef.current = metadata;
    blocksRef.current = blocks;
  }, [metadata, blocks]);

  const persist = useCallback(async (): Promise<boolean> => {
    // Serialize saves and always flush the latest payload when the in-flight
    // request finishes, so rapid edits cannot land a stale body in the database.
    if (persistInFlight.current) {
      persistQueued.current = true;
      return false;
    }

    persistInFlight.current = true;
    setSaveState("saving");

    try {
      do {
        persistQueued.current = false;
        const payload = buildPayload(articleId, metadataRef.current, blocksRef.current);
        const result = await saveDraftAction(payload);

        if (persistQueued.current) {
          continue;
        }

        if (!result.ok) {
          setSaveState("error");
          setSaveMessage(result.error);
          return false;
        }

        setSaveState("saved");
        setSaveMessage(
          `Saved ${new Date(result.data?.updatedAt ?? result.savedAt ?? Date.now()).toLocaleString("en-GB")}`,
        );
      } while (persistQueued.current);
    } finally {
      persistInFlight.current = false;
    }
    return true;
  }, [articleId]);

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist();
    }, AUTOSAVE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [metadata, blocks, persist]);

  async function handleManualSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persist();
  }

  /**
   * Submitting flushes pending edits first. If that save fails the article is not
   * submitted, so a contributor never sends a version the server did not accept.
   */
  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);

    const saved = await persist();
    if (!saved) {
      setSubmitting(false);
      setSubmitError(
        "Your latest changes could not be saved, so nothing was submitted. Your draft is still here — fix the problem and try again.",
      );
      return;
    }

    const result = await submitDraftAction(articleId);
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(`${result.error} Your draft has been saved and is unchanged.`);
      return;
    }
    router.refresh();
  }

  return (
    <div className={styles.editor}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Link href="/dashboard/drafts" className={styles.back}>
            <ArrowRightIcon size={16} />
            My drafts
          </Link>
          <StatusPill tone="accent">{WORKFLOW_LABELS[workflowStatus]}</StatusPill>
          <span className={styles.saveState} data-state={saveState} aria-live="polite">
            {saveState === "saving" && "Saving…"}
            {saveState === "dirty" && "Unsaved changes"}
            {saveState === "saved" && saveMessage}
            {saveState === "error" && `Save failed: ${saveMessage}`}
          </span>
        </div>
        <div className={styles.toolbarRight}>
          <button type="button" className={styles.button} onClick={() => void handleManualSave()}>
            Save draft
          </button>
          <Link href={`/dashboard/drafts/${articleId}/preview`} className={styles.button}>
            Preview
          </Link>
          {canSubmit && (
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {workflowStatus === "REVISION_REQUESTED"
                ? "Resubmit for peer review"
                : "Submit for peer review"}
            </button>
          )}
        </div>
      </header>

      <p className={styles.statusHint}>{WORKFLOW_CONTRIBUTOR_HINTS[workflowStatus]}</p>

      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}

      <div className={styles.layout}>
        <main className={styles.main}>
          <BlockList
            blocks={blocks}
            articleId={articleId}
            uploadsEnabled={uploadsEnabled}
            onChange={setBlocks}
          />
        </main>
        <MetadataPanel
          metadata={metadata}
          eligibleAuthors={eligibleAuthors}
          canEditFeatured={canEditFeatured}
          onChange={setMetadata}
        />
      </div>
    </div>
  );
}

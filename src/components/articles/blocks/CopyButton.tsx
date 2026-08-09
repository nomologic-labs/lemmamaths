"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";
import styles from "./CodeBlock.module.css";

/**
 * The only interactive part of a code block, so it is the only part that ships as
 * JavaScript — the highlighted markup around it is rendered on the server.
 *
 * The confirmation is announced as well as shown: a tick that only appears visually
 * tells a screen-reader user nothing about whether the copy worked.
 */
export function CopyButton({ code, label }: { code: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      // Denied permission, or an insecure origin. Saying so is better than a tick that
      // claims a copy that did not happen.
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  };

  return (
    <button
      type="button"
      className={styles.copy}
      onClick={copy}
      data-state={state}
      aria-label={`Copy the ${label} example`}
    >
      {state === "copied" ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      <span aria-hidden="true">
        {state === "copied" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
      </span>
      <span role="status" className="visually-hidden">
        {state === "copied" ? "Copied to the clipboard" : state === "failed" ? "Could not copy" : ""}
      </span>
    </button>
  );
}

"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Modal surface behaviour shared by the navigation drawer and the search dialog:
 * Escape to close, focus moved in and trapped while open, focus returned to whatever
 * opened it, and the page behind held still.
 *
 * Returns a ref to attach to the dialog element.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const surface = ref.current;
    if (!surface) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    // Move focus in, preferring a text input if the surface has one.
    const focusables = () => Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = surface.querySelector<HTMLElement>("input") ?? focusables()[0];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === firstItem || !surface.contains(active))) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Compensate for the scrollbar so the page does not shift sideways when it locks.
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

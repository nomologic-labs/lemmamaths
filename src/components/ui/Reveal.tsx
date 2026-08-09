"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import styles from "./Reveal.module.css";

export type RevealProps = {
  children: ReactNode;
  /** Milliseconds to stagger this element behind its siblings. */
  delay?: number;
  /** Distance to travel, e.g. "2rem". Smaller for large blocks. */
  shift?: string;
  as?: ElementType;
  className?: string;
};

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(MOTION_QUERY).matches;
}

/** SSR assumes reduced motion so content is never hidden waiting for hydration. */
function getReducedMotionServerSnapshot() {
  return true;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

/**
 * Fades and lifts its children into place the first time they scroll into view, once.
 *
 * A single IntersectionObserver per element is cheap and, unlike a scroll listener,
 * costs nothing while the reader is simply reading. Under `prefers-reduced-motion` the
 * observer is never created and the content renders in its final state.
 */
export function Reveal({ children, delay = 0, shift, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  const visible = reducedMotion || shown;

  useEffect(() => {
    if (reducedMotion) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      // Fire a little before the element reaches the fold, so it has finished settling
      // by the time the reader is actually looking at it.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const style = {
    "--reveal-delay": `${delay}ms`,
    ...(shift ? { "--reveal-shift": shift } : {}),
  } as CSSProperties;

  return (
    <Tag
      ref={ref}
      style={style}
      className={[styles.reveal, visible ? styles.shown : "", className].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}

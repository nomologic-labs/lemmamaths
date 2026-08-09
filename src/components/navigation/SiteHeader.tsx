"use client";

import Link from "next/link";
import { LemmaWordmark } from "@/components/brand/LemmaWordmark";
import { MenuIcon, SearchIcon } from "@/components/ui/icons";
import styles from "./SiteHeader.module.css";

export type SiteHeaderProps = {
  onOpenNavigation: () => void;
  onOpenSearch: () => void;
  /** True once the reader has scrolled off the first screen. */
  solid: boolean;
  /** True on the homepage while the hero is still in view. */
  hideBrand: boolean;
};

export function SiteHeader({ onOpenNavigation, onOpenSearch, solid, hideBrand }: SiteHeaderProps) {
  return (
    <header className={[styles.header, solid ? styles.headerSolid : ""].filter(Boolean).join(" ")}>
      <button
        type="button"
        className={styles.button}
        onClick={onOpenNavigation}
        aria-label="Open navigation"
        aria-controls="lemma-navigation"
      >
        <MenuIcon size={20} />
        <span className={styles.menuLabel}>Menu</span>
      </button>

      <Link
        href="/"
        className={[styles.brand, hideBrand ? styles.brandHidden : ""].filter(Boolean).join(" ")}
        aria-label="Lemma, home"
        tabIndex={hideBrand ? -1 : undefined}
        aria-hidden={hideBrand || undefined}
      >
        <LemmaWordmark size="sm" />
      </Link>

      <span className={hideBrand ? styles.spacer : ""} />

      <button type="button" className={styles.button} onClick={onOpenSearch} aria-label="Search articles">
        <SearchIcon size={19} />
        <span className={styles.searchLabel}>Search</span>
      </button>
    </header>
  );
}

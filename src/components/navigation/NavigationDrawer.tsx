"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LemmaWordmark } from "@/components/brand/LemmaWordmark";
import { CloseIcon, DashboardIcon, SearchIcon } from "@/components/ui/icons";
import { useDialog } from "@/lib/hooks/useDialog";
import { AppearanceControl } from "./AppearanceControl";
import { isActivePath, PRIMARY_NAV } from "./nav-items";
import styles from "./NavigationDrawer.module.css";

export type DrawerCounts = {
  articles: number;
  topics: number;
  authors: number;
};

export type NavigationDrawerProps = {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  counts: DrawerCounts;
};

const COUNT_BY_HREF: Record<string, keyof DrawerCounts> = {
  "/articles": "articles",
  "/topics": "topics",
  "/authors": "authors",
};

export function NavigationDrawer({ open, onClose, onOpenSearch, counts }: NavigationDrawerProps) {
  const pathname = usePathname();
  const ref = useDialog(open, onClose);

  return (
    <>
      <div
        className={[styles.scrim, open ? styles.scrimOpen : ""].filter(Boolean).join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        id="lemma-navigation"
        className={[styles.drawer, open ? styles.drawerOpen : ""].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal={open}
        aria-label="Site navigation"
        // Keeps the closed drawer out of the tab order and away from screen readers
        // without unmounting it, so the slide transition can play in both directions.
        inert={!open}
      >
        <div className={styles.head}>
          <Link href="/" onClick={onClose} aria-label="Lemma, home">
            <LemmaWordmark size="sm" tagline="Mathematical Publication" />
          </Link>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close navigation">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <button
            type="button"
            className={styles.searchTrigger}
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
          >
            <SearchIcon size={17} />
            Search articles
            <span className={styles.searchHint} aria-hidden="true">
              /
            </span>
          </button>

          <div>
            <p className={styles.groupLabel}>Browse</p>
            <nav className={styles.nav} aria-label="Primary">
              {PRIMARY_NAV.map((item) => {
                const active = isActivePath(pathname, item.href);
                const countKey = COUNT_BY_HREF[item.href];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={[styles.link, active ? styles.linkActive : ""]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className={styles.linkLabel}>{item.label}</span>
                    {countKey ? (
                      <span className={styles.count}>{counts[countKey]}</span>
                    ) : (
                      <span className={styles.linkNote}>{item.note}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className={styles.groupLabel}>Contribute</p>
            <Link href="/dashboard" onClick={onClose} className={styles.dashboard}>
              <DashboardIcon size={17} />
              Author dashboard
              <span className={styles.dashboardTag}>Preview</span>
            </Link>
          </div>

          <div>
            <p className={styles.groupLabel}>Appearance</p>
            <AppearanceControl />
          </div>

          <p className={styles.foot}>
            Lemma is a student-run mathematical publication. Everything here is written,
            refereed and edited by students.
          </p>
        </div>
      </div>
    </>
  );
}

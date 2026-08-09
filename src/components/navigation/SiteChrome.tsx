"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SearchEntry } from "@/lib/articles/search-index";
import { NavigationDrawer, type DrawerCounts } from "./NavigationDrawer";
import { SearchDialog } from "./SearchDialog";
import { SiteHeader } from "./SiteHeader";

export type SiteChromeProps = {
  counts: DrawerCounts;
  searchIndex: readonly SearchEntry[];
};

/**
 * Owns the two pieces of interactive chrome and the small amount of state they share.
 * Everything below this in the tree — pages, articles, cards — stays a server
 * component, so the client bundle for a reader who never opens the menu is the header
 * plus the theme provider.
 */
export function SiteChrome({ counts, searchIndex }: SiteChromeProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" opens search from anywhere, as long as the reader is not already typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  return (
    <>
      <SiteHeader
        onOpenNavigation={() => setNavOpen(true)}
        onOpenSearch={openSearch}
        solid={scrolled}
        hideBrand={isHome && !scrolled}
      />
      <NavigationDrawer
        open={navOpen}
        onClose={closeNav}
        onOpenSearch={openSearch}
        counts={counts}
      />
      <SearchDialog open={searchOpen} onClose={closeSearch} index={searchIndex} />
    </>
  );
}

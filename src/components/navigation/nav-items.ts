export type NavItem = {
  href: string;
  label: string;
  /** Short editorial gloss shown beneath the label in the drawer. */
  note: string;
};

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Home", note: "The current issue" },
  { href: "/articles", label: "Articles", note: "The complete archive" },
  { href: "/topics", label: "Topics", note: "Nine fields of mathematics" },
  { href: "/authors", label: "Authors", note: "Who writes for Lemma" },
  { href: "/about", label: "About", note: "How Lemma works" },
];

/** True for the section the given path belongs to, so /articles/x lights up "Articles". */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

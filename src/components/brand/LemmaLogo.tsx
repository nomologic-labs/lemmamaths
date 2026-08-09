import styles from "./LemmaLogo.module.css";

/*
 * The Lemma mark, traced from public/brand/lemma-logo-reference.png.
 *
 * The reference is 2560x1440; the tile occupies a 1126px square at (717, 157). Every
 * coordinate below is a measured pixel from that artwork translated into tile-local
 * space, which is why the viewBox is 1126 rather than a round number — it keeps the
 * numbers checkable against the source image.
 *
 * Measurements taken from the reference:
 *   tile          1126 square, 74px outer corner radius, 6px #C9A876 rule
 *   cap height    471 (392 -> 863 local), i.e. 41.8% of the tile
 *   stem          70 wide, 296..493 top serif (2.83x the stem)
 *   arm terminal  flat-topped wedge, apex at y=723, right edge 673 -> 663
 *   dot           a true 136 square on the baseline, 43px clear of the arm
 * The L and the dot are optically centred as one unit, sitting slightly below the
 * tile's geometric centre, exactly as in the reference.
 *
 * This is the single source of the mark. Do not inline this SVG elsewhere.
 */

const TILE = 1126;

const LETTER_PATH = [
  "M296 392",
  "H493",
  "V414",
  "C449 415 428 432 428 456",
  "V804",
  "C428 830 448 837 505 837",
  "C543 837 576 834 589 823",
  "C597 811 645 747 650 723",
  "H673",
  "L663 863",
  "H296",
  "V841",
  "C333 841 359 827 359 806",
  "V456",
  "C359 432 329 416 296 414",
  "Z",
].join(" ");

export type LemmaLogoProps = {
  /** Rendered edge length in pixels. The mark is square. */
  size?: number;
  /**
   * `adaptive` re-colours the tile with theme tokens so the mark belongs to the page.
   * `brand` pins the reference artwork's own colours.
   */
  tone?: "adaptive" | "brand";
  /**
   * Accessible name. Omit when the mark sits beside a visible "Lemma" wordmark, in
   * which case it is marked decorative to avoid a duplicate announcement.
   */
  label?: string;
  className?: string;
};

export function LemmaLogo({ size = 40, tone = "adaptive", label, className }: LemmaLogoProps) {
  const decorative = label === undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${TILE} ${TILE}`}
      className={[styles.logo, styles[tone], className].filter(Boolean).join(" ")}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      focusable="false"
    >
      {!decorative && <title>{label}</title>}
      <rect
        className={styles.tile}
        x={3}
        y={3}
        width={TILE - 6}
        height={TILE - 6}
        rx={71}
        strokeWidth={6}
      />
      <path className={styles.letter} d={LETTER_PATH} />
      <rect className={styles.dot} x={715} y={727} width={136} height={136} />
    </svg>
  );
}

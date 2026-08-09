/*
 * Generates the homepage hero backdrop: the level sets of a smooth function of two
 * variables, drawn as an engraved contour plate.
 *
 * Written to two static SVGs (one per theme) rather than inlined into the page, because
 * the path data is ~90KB and would otherwise be re-sent with every homepage render. As
 * files they are cached, and the hero animates the container rather than the paths.
 *
 * Run with: node scripts/generate-backdrop.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const WIDTH = 1600;
const HEIGHT = 900;
const COLS = 168;
const ROWS = 94;

// A sum of three incommensurate waves. Chosen so the level sets are smooth and open,
// with no repeating tile and no symmetry axis running through the middle of the type.
function field(x, y) {
  return (
    Math.sin(2.05 * x) * Math.cos(1.63 * y) +
    0.62 * Math.sin(1.27 * x + 2.11 * y) +
    0.34 * Math.cos(3.07 * x - 1.42 * y) +
    0.18 * Math.sin(0.61 * x - 0.9 * y)
  );
}

// A narrow window on the field, so features are large and calm across the frame. A
// wider window packs in more detail but reads as texture rather than as a plate.
const DOMAIN = { x0: 0.2, x1: 8.5, y0: 0.1, y1: 4.75 };

const values = [];
for (let r = 0; r <= ROWS; r++) {
  const row = [];
  for (let c = 0; c <= COLS; c++) {
    const x = DOMAIN.x0 + ((DOMAIN.x1 - DOMAIN.x0) * c) / COLS;
    const y = DOMAIN.y0 + ((DOMAIN.y1 - DOMAIN.y0) * r) / ROWS;
    row.push(field(x, y));
  }
  values.push(row);
}

const px = (c) => (c / COLS) * WIDTH;
const py = (r) => (r / ROWS) * HEIGHT;

/** Linear interpolation of the crossing point along a cell edge. */
function crossing(v1, v2, level, a, b) {
  const t = (level - v1) / (v2 - v1);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function segmentsForLevel(level) {
  const segments = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = values[r][c];
      const tr = values[r][c + 1];
      const br = values[r + 1][c + 1];
      const bl = values[r + 1][c];

      const index =
        (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (index === 0 || index === 15) continue;

      const P = {
        tl: [px(c), py(r)],
        tr: [px(c + 1), py(r)],
        br: [px(c + 1), py(r + 1)],
        bl: [px(c), py(r + 1)],
      };
      const top = () => crossing(tl, tr, level, P.tl, P.tr);
      const right = () => crossing(tr, br, level, P.tr, P.br);
      const bottom = () => crossing(bl, br, level, P.bl, P.br);
      const left = () => crossing(tl, bl, level, P.tl, P.bl);

      switch (index) {
        case 1: case 14: segments.push([left(), bottom()]); break;
        case 2: case 13: segments.push([bottom(), right()]); break;
        case 3: case 12: segments.push([left(), right()]); break;
        case 4: case 11: segments.push([top(), right()]); break;
        case 5: segments.push([left(), top()], [bottom(), right()]); break;
        case 6: case 9: segments.push([top(), bottom()]); break;
        case 7: case 8: segments.push([left(), top()]); break;
        case 10: segments.push([left(), bottom()], [top(), right()]); break;
      }
    }
  }
  return segments;
}

const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

/** Greedily chains segments end-to-end so each contour becomes one path. */
function chain(segments) {
  const starts = new Map();
  for (const seg of segments) {
    const k = key(seg[0]);
    if (!starts.has(k)) starts.set(k, []);
    starts.get(k).push(seg);
  }

  const used = new Set();
  const polylines = [];

  for (const seg of segments) {
    if (used.has(seg)) continue;
    used.add(seg);
    const points = [seg[0], seg[1]];

    for (;;) {
      const candidates = starts.get(key(points[points.length - 1])) ?? [];
      const next = candidates.find((s) => !used.has(s));
      if (!next) break;
      used.add(next);
      points.push(next[1]);
      if (points.length > 4000) break;
    }
    if (points.length >= 3) polylines.push(points);
  }
  return polylines;
}

function toPath(points) {
  const n = (v) => {
    const r = Math.round(v * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  let last = points[0];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    // Drop points closer than 6px to the last one kept. The contours are smooth and
    // drawn at 1.1px with very low opacity, so this is invisible and cuts the file by
    // roughly three quarters.
    if (i < points.length - 1 && Math.hypot(p[0] - last[0], p[1] - last[1]) < 6) continue;
    d += `L${n(p[0])} ${n(p[1])}`;
    last = p;
  }
  return d;
}

const LEVELS = [];
for (let i = -5; i <= 5; i++) LEVELS.push(i * 0.34);

const bands = LEVELS.map((level) => {
  const paths = chain(segmentsForLevel(level))
    .map(toPath)
    .filter((d) => d.length > 40);
  // Contours nearer the zero level are drawn slightly stronger, which gives the plate
  // a sense of depth without any gradient.
  const emphasis = 1 - Math.min(1, Math.abs(level) / 1.7) * 0.55;
  return { paths, emphasis };
});

function svg({ stroke, baseOpacity }) {
  const groups = bands
    .map(
      ({ paths, emphasis }) =>
        `<g stroke-opacity="${(baseOpacity * emphasis).toFixed(3)}">` +
        paths.map((d) => `<path d="${d}"/>`).join("") +
        `</g>`,
    )
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" fill="none" ` +
    `stroke="${stroke}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">` +
    groups +
    `</svg>\n`
  );
}

mkdirSync(new URL("../public/brand/", import.meta.url), { recursive: true });

const light = svg({ stroke: "#4a2410", baseOpacity: 0.5 });
const dark = svg({ stroke: "#c9a876", baseOpacity: 0.55 });

writeFileSync(new URL("../public/brand/field-light.svg", import.meta.url), light);
writeFileSync(new URL("../public/brand/field-dark.svg", import.meta.url), dark);

const total = bands.reduce((n, b) => n + b.paths.length, 0);
console.log(`contours: ${total} paths across ${LEVELS.length} levels`);
console.log(`field-light.svg  ${(light.length / 1024).toFixed(1)} KB`);
console.log(`field-dark.svg   ${(dark.length / 1024).toFixed(1)} KB`);

// A raster preview of the light plate as it will actually appear over parchment, so the
// composition can be judged rather than guessed at. Not shipped.
if (process.argv.includes("--preview")) {
  const { Canvas, hex } = await import("./png.mjs");
  const SCALE = 0.55;
  const canvas = new Canvas(Math.round(WIDTH * SCALE), Math.round(HEIGHT * SCALE), [
    ...hex("#f5ede0"),
    255,
  ]);
  const ink = hex("#4a2410");
  const stroke = 1.1 * SCALE;

  for (const { paths, emphasis } of bands) {
    const alpha = 0.5 * emphasis;
    for (const d of paths) {
      const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      for (let i = 2; i + 1 < nums.length; i += 2) {
        const ax = nums[i - 2] * SCALE, ay = nums[i - 1] * SCALE;
        const bx = nums[i] * SCALE, by = nums[i + 1] * SCALE;
        const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2) + 1;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = ax + (bx - ax) * t;
          const y = ay + (by - ay) * t;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const cover = Math.max(0, 1 - Math.hypot(dx, dy) / (stroke + 0.6));
              if (cover > 0) canvas.blend(Math.round(x) + dx, Math.round(y) + dy, ink, alpha * cover * 0.5);
            }
        }
      }
    }
  }
  writeFileSync(new URL("./backdrop-preview.png", import.meta.url), canvas.toPng());
  console.log("wrote scripts/backdrop-preview.png");
}

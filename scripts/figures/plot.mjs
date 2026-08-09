// Minimal plotting helpers shared by the SVG figures.
//
// These figures stand in for the images an author would upload, so they are produced as
// PNGs (the only graph format the engineering rules accept) by rasterising SVG in the
// same headless browser scripts/shoot.mjs already uses. Drawing them as SVG first is
// what makes real axis labels and mathematical notation possible.

export const INK = "#2b1509";
export const MUTED = "#7a5638";
export const FAINT = "#9a7752";
export const RULE = "#cbb392";
export const ACCENT = "#8c4a1e";
export const BRASS = "#b8894a";
export const TAN = "#c9a876";
export const PAPER = "#f5ede0";

export const SERIF = "'Literata', 'Palatino Linotype', Palatino, Georgia, serif";
export const SANS = "'Inter', 'Segoe UI', system-ui, sans-serif";

export function linear(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const scale = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  scale.invert = (p) => d0 + ((p - r0) / (r1 - r0)) * (d1 - d0);
  scale.domain = domain;
  scale.range = range;
  return scale;
}

export function log10(domain, range) {
  const [d0, d1] = domain.map(Math.log10);
  const [r0, r1] = range;
  const scale = (v) => r0 + ((Math.log10(v) - d0) / (d1 - d0)) * (r1 - r0);
  scale.domain = domain;
  scale.range = range;
  return scale;
}

/** Decade ticks for a log axis, e.g. 1e-16, 1e-12, ... */
export function decades(domain, step = 1) {
  const ticks = [];
  const from = Math.ceil(Math.log10(domain[0]));
  const to = Math.floor(Math.log10(domain[1]));
  for (let e = from; e <= to; e += step) ticks.push(10 ** e);
  return ticks;
}

export function superscript(exponent) {
  const digits = { "-": "\u2212", 0: "\u2070", 1: "\u00b9", 2: "\u00b2", 3: "\u00b3" };
  return String(exponent)
    .split("")
    .map((c) => digits[c] ?? "\u2074\u2075\u2076\u2077\u2078\u2079"[Number(c) - 4] ?? c)
    .join("");
}

export function powerLabel(value) {
  const exponent = Math.round(Math.log10(value));
  if (exponent === 0) return "1";
  return `10${superscript(exponent)}`;
}

export function text(x, y, content, options = {}) {
  const {
    size = 22,
    fill = MUTED,
    anchor = "middle",
    family = SANS,
    style = "normal",
    weight = 400,
    baseline = "middle",
    rotate,
    letterSpacing,
  } = options;
  const transform = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : "";
  const spacing = letterSpacing ? ` letter-spacing="${letterSpacing}"` : "";
  return (
    `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}" ` +
    `text-anchor="${anchor}" dominant-baseline="${baseline}" font-style="${style}" ` +
    `font-weight="${weight}"${spacing}${transform}>${escapeXml(content)}</text>`
  );
}

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function path(d, options = {}) {
  const {
    stroke = INK,
    width = 2,
    fill = "none",
    opacity = 1,
    dash,
    cap = "round",
    join = "round",
  } = options;
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
  return (
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ` +
    `stroke-linecap="${cap}" stroke-linejoin="${join}" opacity="${opacity}"${dashAttr}/>`
  );
}

export function line(x1, y1, x2, y2, options = {}) {
  return path(`M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`, options);
}

export function circle(cx, cy, r, options = {}) {
  const { fill = ACCENT, stroke = "none", width = 0, opacity = 1 } = options;
  return (
    `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" fill="${fill}" ` +
    `stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"/>`
  );
}

export function polygon(points, options = {}) {
  const { fill = "none", stroke = INK, width = 2, opacity = 1 } = options;
  const d = points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
  return (
    `<polygon points="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ` +
    `stroke-linejoin="round" opacity="${opacity}"/>`
  );
}

export function round(value) {
  return Math.round(value * 100) / 100;
}

/** An arrowhead marker definition, used for the vectors in the determinant figure. */
export function arrowMarker(id, colour) {
  return (
    `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" ` +
    `markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0.8L9.5 5L0 9.2z" fill="${colour}"/></marker>`
  );
}

/**
 * A deterministic generator, so regenerating a figure does not silently change the data
 * an article's prose describes.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function document({ width, height, body, background = PAPER }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${background}"/>${body}</svg>`
  );
}

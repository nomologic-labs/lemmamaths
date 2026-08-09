// How well fractions approximate pi, plotted against the size of their denominator.
// The convergents form the lower frontier, and 355/113 falls off it.
import {
  ACCENT,
  BRASS,
  FAINT,
  INK,
  MUTED,
  RULE,
  SANS,
  SERIF,
  circle,
  document,
  line,
  log10,
  path,
  powerLabel,
  round,
  text,
} from "./plot.mjs";

const WIDTH = 1600;
const HEIGHT = 1000;
const MAX_Q = 400;

// p/q with the p that minimises the error for each q, which is the only one worth
// plotting: any other numerator is further away by construction.
function bestFractions() {
  const points = [];
  for (let q = 1; q <= MAX_Q; q++) {
    const p = Math.round(Math.PI * q);
    const error = Math.abs(Math.PI - p / q);
    if (error > 0) points.push({ p, q, error });
  }
  return points;
}

const CONVERGENTS = [
  { p: 3, q: 1 },
  { p: 22, q: 7 },
  { p: 333, q: 106 },
  { p: 355, q: 113 },
].map(({ p, q }) => ({ p, q, error: Math.abs(Math.PI - p / q) }));

export function svg() {
  const left = 150;
  const right = WIDTH - 90;
  const top = 110;
  const bottom = HEIGHT - 150;

  const x = log10([1, MAX_Q * 1.2], [left, right]);
  const y = log10([1e-7, 1], [bottom, top]);

  const body = [];

  body.push(
    text(left - 60, 56, "How closely a fraction can approximate \u03c0", {
      size: 32,
      family: SERIF,
      fill: INK,
      anchor: "start",
      weight: 600,
    }),
  );

  // Grid, one line per decade, drawn under everything.
  for (let e = 0; e >= -7; e--) {
    const yy = y(10 ** e);
    body.push(line(left, yy, right, yy, { stroke: RULE, width: 1, opacity: 0.55 }));
    body.push(
      text(left - 18, yy, powerLabel(10 ** e), { size: 21, fill: FAINT, anchor: "end" }),
    );
  }
  for (const q of [1, 10, 100]) {
    body.push(line(x(q), top, x(q), bottom, { stroke: RULE, width: 1, opacity: 0.55 }));
    body.push(text(x(q), bottom + 34, String(q), { size: 21, fill: FAINT }));
  }
  body.push(line(left, top, left, bottom, { stroke: RULE, width: 1.5 }));
  body.push(line(left, bottom, right, bottom, { stroke: RULE, width: 1.5 }));

  // Reference line 1/q^2: the rate Dirichlet guarantees is always achievable.
  body.push(
    path(`M${round(x(1))} ${round(y(1))}L${round(x(MAX_Q * 1.2))} ${round(y(1 / (MAX_Q * 1.2) ** 2))}`, {
      stroke: BRASS,
      width: 2.5,
      dash: "12 9",
    }),
  );
  body.push(
    text(x(230), y(1 / 230 ** 2) - 26, "1/q\u00b2", {
      size: 26,
      family: SERIF,
      style: "italic",
      fill: BRASS,
    }),
  );

  for (const point of bestFractions()) {
    body.push(circle(x(point.q), y(point.error), 3.4, { fill: MUTED, opacity: 0.34 }));
  }

  for (const point of CONVERGENTS) {
    body.push(circle(x(point.q), y(point.error), 11, { fill: ACCENT }));
    body.push(circle(x(point.q), y(point.error), 19, { fill: "none", stroke: ACCENT, width: 2, opacity: 0.45 }));
  }

  const labels = [
    { index: 0, dx: 26, dy: -6, anchor: "start" },
    { index: 1, dx: 26, dy: -6, anchor: "start" },
    { index: 2, dx: -26, dy: -14, anchor: "end" },
    { index: 3, dx: 30, dy: 6, anchor: "start" },
  ];
  for (const { index, dx, dy, anchor } of labels) {
    const point = CONVERGENTS[index];
    body.push(
      text(x(point.q) + dx, y(point.error) + dy, `${point.p}/${point.q}`, {
        size: 27,
        family: SERIF,
        fill: INK,
        weight: 600,
        anchor,
      }),
    );
  }

  // The one annotation the plate exists for. It runs left along an otherwise empty row
  // rather than down and right, where it would leave the plate.
  const star = CONVERGENTS[3];
  body.push(
    line(x(star.q) - 26, y(star.error), x(star.q) - 62, y(star.error), {
      stroke: FAINT,
      width: 1.6,
    }),
  );
  body.push(
    text(x(star.q) - 76, y(star.error), "next partial quotient is 292", {
      size: 22,
      fill: MUTED,
      anchor: "end",
      family: SANS,
    }),
  );

  body.push(
    text((left + right) / 2, HEIGHT - 74, "denominator q", {
      size: 24,
      family: SERIF,
      style: "italic",
      fill: MUTED,
    }),
  );
  body.push(
    text(52, (top + bottom) / 2, "|\u03c0 \u2212 p/q|", {
      size: 24,
      family: SERIF,
      style: "italic",
      fill: MUTED,
      rotate: -90,
    }),
  );

  return {
    width: WIDTH,
    height: HEIGHT,
    markup: document({ width: WIDTH, height: HEIGHT, body: body.join("") }),
  };
}

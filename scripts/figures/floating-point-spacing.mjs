// The gap to the next representable double, as a staircase in the magnitude.
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
const HEIGHT = 900;

const MIN_EXPONENT = -10;
const MAX_EXPONENT = 62;

export function svg() {
  const left = 170;
  const right = WIDTH - 80;
  const top = 110;
  const bottom = HEIGHT - 140;

  const x = log10([2 ** MIN_EXPONENT, 2 ** MAX_EXPONENT], [left, right]);
  const y = log10([2 ** (MIN_EXPONENT - 52), 2 ** (MAX_EXPONENT - 52)], [bottom, top]);

  const body = [];

  body.push(
    text(left - 90, 54, "The gap between neighbouring doubles", {
      size: 32,
      family: SERIF,
      fill: INK,
      anchor: "start",
      weight: 600,
    }),
  );

  for (const tick of [1e-3, 1, 1e3, 1e6, 1e9, 1e12, 1e15, 1e18]) {
    body.push(line(x(tick), top, x(tick), bottom, { stroke: RULE, width: 1, opacity: 0.5 }));
    body.push(text(x(tick), bottom + 34, powerLabel(tick), { size: 21, fill: FAINT }));
  }
  for (const tick of [1e-18, 1e-15, 1e-12, 1e-9, 1e-6, 1e-3, 1, 1e3]) {
    body.push(line(left, y(tick), right, y(tick), { stroke: RULE, width: 1, opacity: 0.5 }));
    body.push(text(left - 18, y(tick), powerLabel(tick), { size: 21, fill: FAINT, anchor: "end" }));
  }
  body.push(line(left, top, left, bottom, { stroke: RULE, width: 1.5 }));
  body.push(line(left, bottom, right, bottom, { stroke: RULE, width: 1.5 }));

  // The staircase: constant spacing 2^(e-52) across each binade [2^e, 2^(e+1)).
  let d = "";
  for (let e = MIN_EXPONENT; e <= MAX_EXPONENT; e++) {
    const gap = 2 ** (e - 52);
    const x0 = x(2 ** e);
    const x1 = x(2 ** (e + 1));
    const yy = y(gap);
    d += `${e === MIN_EXPONENT ? "M" : "L"}${round(x0)} ${round(yy)}L${round(x1)} ${round(yy)}`;
    if (e < MAX_EXPONENT) d += `L${round(x1)} ${round(y(2 ** (e - 51)))}`;
  }
  body.push(path(d, { stroke: ACCENT, width: 2.6, join: "miter", cap: "butt" }));

  // Where the gap reaches 1: beyond 2^53 not every integer has a double.
  const threshold = 2 ** 53;
  body.push(line(x(threshold), bottom, x(threshold), y(1), { stroke: BRASS, width: 1.8, dash: "9 8" }));
  body.push(line(left, y(1), x(threshold), y(1), { stroke: BRASS, width: 1.8, dash: "9 8" }));
  body.push(circle(x(threshold), y(1), 9, { fill: BRASS }));
  body.push(
    text(x(threshold) - 24, y(1) - 34, "2\u2075\u00b3: consecutive doubles differ by 1", {
      size: 23,
      fill: MUTED,
      anchor: "end",
      family: SANS,
    }),
  );

  // The other number every article on this subject mentions.
  body.push(
    text(x(1) - 26, y(2 ** -52) - 44, "\u03b5 = 2\u207b\u2075\u00b2 near 1", {
      size: 23,
      fill: MUTED,
      anchor: "end",
      family: SANS,
    }),
  );
  body.push(circle(x(1), y(2 ** -52), 8, { fill: ACCENT }));

  body.push(
    text((left + right) / 2, HEIGHT - 62, "magnitude x", {
      size: 24,
      family: SERIF,
      style: "italic",
      fill: MUTED,
    }),
  );
  body.push(
    text(56, (top + bottom) / 2, "gap to the next double", {
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

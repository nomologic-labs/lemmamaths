// Standardised sample means from two very different distributions, at four sample sizes.
// The point of the plate is that the uniform is already normal-looking at n = 2 while the
// exponential is still visibly skewed at n = 5.
import {
  ACCENT,
  FAINT,
  INK,
  MUTED,
  RULE,
  SANS,
  SERIF,
  document,
  line,
  linear,
  mulberry32,
  path,
  round,
  text,
} from "./plot.mjs";

const WIDTH = 1600;
const HEIGHT = 920;
const TRIALS = 120_000;
const SIZES = [1, 2, 5, 30];
const BINS = 46;
const RANGE = 3.6;

const SOURCES = [
  {
    label: "Uniform on [0, 1]",
    mean: 0.5,
    sd: Math.sqrt(1 / 12),
    draw: (rng) => rng(),
  },
  {
    label: "Exponential, rate 1",
    mean: 1,
    sd: 1,
    // Inverse transform; `rng` never returns 1, so the log is safe.
    draw: (rng) => -Math.log(1 - rng()),
  },
];

/** Density of the standardised mean of `n` draws, as a normalised histogram. */
function sample(source, n, seed) {
  const rng = mulberry32(seed);
  const counts = new Float64Array(BINS);
  const width = (2 * RANGE) / BINS;
  const scale = source.sd / Math.sqrt(n);

  for (let trial = 0; trial < TRIALS; trial++) {
    let total = 0;
    for (let k = 0; k < n; k++) total += source.draw(rng);
    const z = (total / n - source.mean) / scale;
    const bin = Math.floor((z + RANGE) / width);
    if (bin >= 0 && bin < BINS) counts[bin] += 1;
  }

  // To a density, so every panel is on the same vertical scale as the normal curve.
  for (let i = 0; i < BINS; i++) counts[i] /= TRIALS * width;
  return counts;
}

const normal = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/*
 * Every panel shares one vertical scale, including the standardised exponential at
 * n = 1, whose density reaches 1 at its mode. Rescaling that row on its own would make
 * the eight panels look more alike than they are, which is the opposite of the point.
 */
const DENSITY_MAX = 1.04;

function panel({ x0, y0, width, height, counts, n, showTitle, showAxis }) {
  const x = linear([-RANGE, RANGE], [x0, x0 + width]);
  const y = linear([0, DENSITY_MAX], [y0 + height, y0]);
  const binWidth = (2 * RANGE) / BINS;
  const out = [];

  out.push(line(x0, y0 + height, x0 + width, y0 + height, { stroke: RULE, width: 1.5 }));

  // The histogram as one filled outline rather than 46 rectangles: fewer nodes, and the
  // silhouette is what the reader is comparing anyway.
  let d = `M${round(x(-RANGE))} ${round(y(0))}`;
  for (let i = 0; i < BINS; i++) {
    const left = -RANGE + i * binWidth;
    d += `L${round(x(left))} ${round(y(counts[i]))}L${round(x(left + binWidth))} ${round(y(counts[i]))}`;
  }
  d += `L${round(x(RANGE))} ${round(y(0))}Z`;
  out.push(path(d, { fill: `${ACCENT}26`, stroke: ACCENT, width: 1.6, join: "miter" }));

  let curve = "";
  for (let i = 0; i <= 160; i++) {
    const z = -RANGE + (i / 160) * 2 * RANGE;
    curve += `${i === 0 ? "M" : "L"}${round(x(z))} ${round(y(normal(z)))}`;
  }
  out.push(path(curve, { stroke: INK, width: 2, dash: "9 7" }));

  if (showTitle) {
    out.push(
      text(x0 + width / 2, y0 - 22, `n = ${n}`, {
        size: 25,
        family: SERIF,
        fill: INK,
        weight: 600,
      }),
    );
  }

  if (showAxis) {
    for (const tick of [-3, 0, 3]) {
      out.push(line(x(tick), y0 + height, x(tick), y0 + height + 9, { stroke: RULE, width: 1.5 }));
      out.push(
        text(x(tick), y0 + height + 30, tick === 0 ? "0" : `${tick > 0 ? "+" : "\u2212"}3`, {
          size: 20,
          fill: FAINT,
        }),
      );
    }
  }

  return out.join("");
}

export function svg() {
  const left = 230;
  const top = 132;
  const panelWidth = 300;
  const panelHeight = 318;
  const gapX = 40;
  const gapY = 62;

  const body = [];

  body.push(
    text(70, 56, "Standardised sample means against the standard normal", {
      size: 31,
      family: SERIF,
      fill: INK,
      anchor: "start",
      weight: 600,
    }),
  );

  SOURCES.forEach((source, row) => {
    const y0 = top + row * (panelHeight + gapY);
    body.push(
      text(70, y0 + panelHeight / 2, source.label, {
        size: 24,
        family: SERIF,
        fill: MUTED,
        anchor: "start",
      }),
    );

    SIZES.forEach((n, column) => {
      body.push(
        panel({
          x0: left + column * (panelWidth + gapX),
          y0,
          width: panelWidth,
          height: panelHeight,
          counts: sample(source, n, 1009 + row * 97 + column * 13),
          n,
          showTitle: row === 0,
          showAxis: row === SOURCES.length - 1,
        }),
      );
    });
  });

  // Key, set as a caption line beside the title rather than a boxed legend.
  const keyY = 54;
  body.push(line(1002, keyY, 1050, keyY, { stroke: ACCENT, width: 3 }));
  body.push(
    text(1064, keyY, "sample means", { size: 21, fill: FAINT, anchor: "start", family: SANS }),
  );
  body.push(line(1252, keyY, 1300, keyY, { stroke: INK, width: 2, dash: "9 7" }));
  body.push(
    text(1314, keyY, "standard normal density", {
      size: 21,
      fill: FAINT,
      anchor: "start",
      family: SANS,
    }),
  );

  return {
    width: WIDTH,
    height: HEIGHT,
    markup: document({ width: WIDTH, height: HEIGHT, body: body.join("") }),
  };
}

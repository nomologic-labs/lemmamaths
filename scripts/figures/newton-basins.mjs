// Basins of attraction for Newton's method on z^3 - 1.
//
// Rasterised directly rather than drawn in the browser: the image is one colour decision
// per pixel, which is exactly what the PNG encoder in scripts/png.mjs already does well,
// and there is no text on the plate for a browser to typeset.
import { encodePng, hex } from "../png.mjs";

const ROOTS = [
  { re: 1, im: 0 },
  { re: -0.5, im: Math.sqrt(3) / 2 },
  { re: -0.5, im: -Math.sqrt(3) / 2 },
];

// One warm tone per root, all from the brand palette. The three are separated by value
// as well as hue so the plate still reads when printed or seen without colour.
const TONES = [hex("#8c4a1e"), hex("#c9a876"), hex("#4a2410")];
const PAPER = hex("#f5ede0");

const MAX_ITERATIONS = 28;
const TOLERANCE = 1e-6;

/** Which root Newton converges to from `z0`, and how quickly. */
function classify(re, im) {
  let zr = re;
  let zi = im;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // z - (z^3 - 1) / (3 z^2), written out to avoid allocating complex objects per step.
    const r2 = zr * zr - zi * zi;
    const i2 = 2 * zr * zi;
    const r3 = r2 * zr - i2 * zi;
    const i3 = r2 * zi + i2 * zr;

    const dr = 3 * r2;
    const di = 3 * i2;
    const denom = dr * dr + di * di;
    if (denom === 0) return { root: -1, steps: i };

    const nr = r3 - 1;
    const ni = i3;
    zr -= (nr * dr + ni * di) / denom;
    zi -= (ni * dr - nr * di) / denom;

    for (let k = 0; k < 3; k++) {
      const root = ROOTS[k];
      if (Math.hypot(zr - root.re, zi - root.im) < TOLERANCE) {
        return { root: k, steps: i };
      }
    }
  }
  return { root: -1, steps: MAX_ITERATIONS };
}

export function render({ size = 1400, extent = 1.5, supersample = 2 }) {
  const data = Buffer.alloc(size * size * 4);
  const span = 2 * extent;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          const px = x + (sx + 0.5) / supersample;
          const py = y + (sy + 0.5) / supersample;
          const re = -extent + (px / size) * span;
          const im = extent - (py / size) * span;

          const { root, steps } = classify(re, im);
          if (root < 0) {
            r += PAPER[0];
            g += PAPER[1];
            b += PAPER[2];
            continue;
          }

          // Fast convergence keeps the tone; slow convergence — the filigree along the
          // boundaries — washes towards paper, which is what makes the structure legible
          // instead of a field of flat colour.
          const tone = TONES[root];
          const wash = Math.min(1, steps / 14) ** 0.85;
          r += tone[0] + (PAPER[0] - tone[0]) * wash;
          g += tone[1] + (PAPER[1] - tone[1]) * wash;
          b += tone[2] + (PAPER[2] - tone[2]) * wash;
        }
      }

      const n = supersample * supersample;
      const o = (y * size + x) * 4;
      data[o] = Math.round(r / n);
      data[o + 1] = Math.round(g / n);
      data[o + 2] = Math.round(b / n);
      data[o + 3] = 255;
    }
  }

  return encodePng({ width: size, height: size, data });
}

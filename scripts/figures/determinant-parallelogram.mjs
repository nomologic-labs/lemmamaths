// Shearing a parallelogram leaves its area alone: the figure behind the alternating
// property in "Why the Determinant Measures Volume".
import {
  ACCENT,
  BRASS,
  FAINT,
  INK,
  MUTED,
  RULE,
  SERIF,
  arrowMarker,
  document,
  line,
  linear,
  path,
  polygon,
  round,
  text,
} from "./plot.mjs";

const WIDTH = 1600;
const HEIGHT = 660;

const U = [2.2, 0.42];
const V = [0.8, 2.3];
const LAMBDA = 2;

const AREA = Math.abs(U[0] * V[1] - U[1] * V[0]);

/** Unit vector along the edge, pointing away from the parallelogram's interior. */
function outward(edge, interior) {
  const length = Math.hypot(edge[0], edge[1]);
  const normal = [-edge[1] / length, edge[0] / length];
  const inward = normal[0] * interior[0] + normal[1] * interior[1];
  return inward > 0 ? [-normal[0], -normal[1]] : normal;
}

function panel(originX, title, shear) {
  const x = linear([-0.6, 8.0], [originX + 90, originX + 690]);
  const unit = x(1) - x(0);
  // Equal units on both axes; a figure about area cannot afford anisotropic scaling.
  const y = (value) => HEIGHT - 130 - (value - -0.5) * unit;

  const v = [V[0] + shear * U[0], V[1] + shear * U[1]];
  const corners = [
    [0, 0],
    U,
    [U[0] + v[0], U[1] + v[1]],
    v,
  ];
  const points = corners.map(([px, py]) => [x(px), y(py)]);

  const uLength = Math.hypot(U[0], U[1]);
  const uHat = [U[0] / uLength, U[1] / uLength];
  const projection = v[0] * uHat[0] + v[1] * uHat[1];
  const foot = [uHat[0] * projection, uHat[1] * projection];

  const out = [];

  out.push(line(x(-0.5), y(0), x(7.9), y(0), { stroke: RULE, width: 1.5 }));
  out.push(line(x(0), y(-0.4), x(0), y(4.0), { stroke: RULE, width: 1.5 }));

  // The base line, extended beyond u, so the shear is visibly a slide along it.
  out.push(
    line(x(-0.4 * uHat[0]), y(-0.4 * uHat[1]), x(uHat[0] * 7.6), y(uHat[1] * 7.6), {
      stroke: RULE,
      width: 1.5,
      dash: "8 10",
    }),
  );

  out.push(polygon(points, { fill: `${ACCENT}20`, stroke: ACCENT, width: 2.5 }));

  // The perpendicular height, which the shear leaves alone.
  out.push(
    line(x(foot[0]), y(foot[1]), x(v[0]), y(v[1]), { stroke: BRASS, width: 2, dash: "7 8" }),
  );
  const perp = [-uHat[1], uHat[0]];
  const s = 0.2;
  out.push(
    path(
      `M${round(x(foot[0]))} ${round(y(foot[1]))}` +
        `l${round(uHat[0] * s * unit)} ${round(-uHat[1] * s * unit)}` +
        `l${round(perp[0] * s * unit)} ${round(-perp[1] * s * unit)}` +
        `l${round(-uHat[0] * s * unit)} ${round(uHat[1] * s * unit)}z`,
      { stroke: BRASS, width: 1.5 },
    ),
  );
  out.push(
    text(
      x((foot[0] + v[0]) / 2 + uHat[0] * 0.3),
      y((foot[1] + v[1]) / 2 + uHat[1] * 0.3),
      "h",
      { size: 26, family: SERIF, style: "italic", fill: BRASS, anchor: "start" },
    ),
  );

  const vector = (to) =>
    path(`M${round(x(0))} ${round(y(0))}L${round(x(to[0]))} ${round(y(to[1]))}`, {
      stroke: INK,
      width: 3,
    }).replace("/>", ' marker-end="url(#head-ink)"/>');
  out.push(vector(U));
  out.push(vector(v));

  // Labels sit outside their edge, so neither lands on the shading or on the height.
  const uOut = outward(U, v);
  out.push(
    text(x(U[0] / 2 + uOut[0] * 0.42), y(U[1] / 2 + uOut[1] * 0.42), "u", {
      size: 30,
      family: SERIF,
      style: "italic",
      weight: 600,
      fill: INK,
    }),
  );
  const vOut = outward(v, U);
  out.push(
    text(x(v[0] / 2 + vOut[0] * 0.5), y(v[1] / 2 + vOut[1] * 0.5), shear ? "v + 2u" : "v", {
      size: 30,
      family: SERIF,
      style: "italic",
      weight: 600,
      fill: INK,
      anchor: shear ? "middle" : "end",
    }),
  );

  out.push(
    text(originX + 390, 60, title, { size: 30, family: SERIF, fill: INK, weight: 600 }),
  );
  out.push(
    text(originX + 390, 100, `area = ${AREA.toFixed(2)}`, { size: 24, fill: MUTED }),
  );

  return out.join("");
}

export function svg() {
  const body =
    `<defs>${arrowMarker("head-ink", INK)}</defs>` +
    panel(20, "A(u, v)", 0) +
    panel(810, `A(u, v + ${LAMBDA}u)`, LAMBDA) +
    line(800, 100, 800, HEIGHT - 80, { stroke: RULE, width: 1.5 }) +
    text(WIDTH / 2, HEIGHT - 40, "same base, same height, same area", {
      size: 24,
      fill: FAINT,
      letterSpacing: "0.14em",
    });

  return { width: WIDTH, height: HEIGHT, markup: document({ width: WIDTH, height: HEIGHT, body }) };
}

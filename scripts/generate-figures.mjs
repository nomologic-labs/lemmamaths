// Generates the article figures in public/figures/.
//
//   node scripts/generate-figures.mjs [name ...]
//
// The engineering rules make article graphs uploaded PNG or JPEG files, so these mock
// figures are baked to PNG rather than shipped as live SVG or client-side plotting: what
// the article renderer receives is exactly what it would receive from a real author.
//
// Plots are described as SVG and rasterised in the same headless Chrome that
// scripts/shoot.mjs drives, which is what makes real typography possible in the labels.
// The Newton fractal is one colour decision per pixel and is encoded directly instead.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import * as clt from "./figures/clt-convergence.mjs";
import * as convergents from "./figures/continued-fraction-convergents.mjs";
import * as determinant from "./figures/determinant-parallelogram.mjs";
import * as floating from "./figures/floating-point-spacing.mjs";
import * as newton from "./figures/newton-basins.mjs";

const OUT = new URL("../public/figures/", import.meta.url);

const VECTOR = {
  "determinant-parallelogram": determinant.svg,
  "clt-convergence": clt.svg,
  "continued-fraction-convergents": convergents.svg,
  "floating-point-spacing": floating.svg,
};

const RASTER = {
  "newton-basins": () => newton.render({ size: 1400, extent: 1.5, supersample: 2 }),
};

const CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const requested = process.argv.slice(2);
const wanted = (name) => requested.length === 0 || requested.includes(name);

mkdirSync(OUT, { recursive: true });

const write = (name, buffer) => {
  const file = fileURLToPath(new URL(`${name}.png`, OUT));
  writeFileSync(file, buffer);
  console.log(`${name}.png  ${(buffer.length / 1024).toFixed(0)} kB`);
};

for (const [name, render] of Object.entries(RASTER)) {
  if (!wanted(name)) continue;
  write(name, render());
}

const vectorNames = Object.keys(VECTOR).filter(wanted);
if (vectorNames.length > 0) {
  const executablePath = CANDIDATES.find((p) => existsSync(p));
  if (!executablePath) throw new Error("No Chrome or Edge found");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--force-device-scale-factor=1", "--hide-scrollbars"],
  });

  for (const name of vectorNames) {
    const { width, height, markup } = VECTOR[name]();
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">` +
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Literata:ital,opsz,wght@0,7..72,400..600;1,7..72,400..600&display=swap">` +
        `<style>html,body{margin:0;padding:0;background:#f5ede0}svg{display:block}</style>` +
        `</head><body>${markup}</body></html>`,
      { waitUntil: "networkidle0", timeout: 30000 },
    );
    // Without this the labels can rasterise in the fallback face.
    await page.evaluate(() => document.fonts.ready);
    write(name, await page.screenshot({ type: "png" }));
    await page.close();
  }

  await browser.close();
}

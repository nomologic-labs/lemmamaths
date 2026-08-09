// Development-only screenshot helper. Drives an already-installed Chrome/Edge through
// puppeteer-core so the running site can be checked at real viewport sizes.
//
//   node scripts/shoot.mjs [--dark] [--full] [--vp=size] [--at=sel] [--click=sel] path[::name] ...
//
// Not part of the build; puppeteer-core is a devDependency only.
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const executablePath = CANDIDATES.find((p) => existsSync(p));
if (!executablePath) throw new Error("No Chrome or Edge found");

const args = process.argv.slice(2);
const dark = args.includes("--dark");
const full = args.includes("--full");
const targets = args.filter((a) => !a.startsWith("--"));
if (targets.length === 0) targets.push("/:home");

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

const at = args.find((a) => a.startsWith("--at="))?.slice(5);
const click = args.find((a) => a.startsWith("--click="))?.slice(8);
const only = args.find((a) => a.startsWith("--vp="))?.slice(5);
const sizes = only ? { [only]: VIEWPORTS[only] } : { desktop: VIEWPORTS.desktop };

mkdirSync(new URL("./shots/", import.meta.url), { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--force-device-scale-factor=1", "--hide-scrollbars"],
});

for (const target of targets) {
  const [path, nameRaw] = target.split("::");
  const name = nameRaw || path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";

  for (const [label, viewport] of Object.entries(sizes)) {
    const page = await browser.newPage();
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
    if (dark) {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem("lemma-theme", "dark");
      });
    }
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle0", timeout: 60000 });

    if (full) {
      // Chrome's fullPage capture reuses composited layers instead of repainting, so
      // sections revealed on scroll come back blank. Clearing the motion flag drops the
      // reveal styling altogether, which puts every section in its final state after one
      // style recalculation. Reveal animations themselves are checked in viewport shots.
      await page.evaluate(() => {
        delete document.documentElement.dataset.motion;
      });
    }

    if (click) {
      await page.click(click);
      await new Promise((r) => setTimeout(r, 700));
    }

    if (at) {
      await page.evaluate((selector) => {
        document.querySelector(selector)?.scrollIntoView({ block: "start" });
      }, at);
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // Let entrance animations and reveals settle.
    await new Promise((r) => setTimeout(r, 1600));

    const fileName = `${name}-${label}${dark ? "-dark" : ""}${full ? "-full" : ""}.png`;
    const file = fileURLToPath(new URL(`./shots/${fileName}`, import.meta.url));
    await page.screenshot({ path: file, fullPage: full });
    console.log(`${path} @ ${label}${dark ? " dark" : ""} -> ${fileName}`);
    await page.close();
  }
}

await browser.close();

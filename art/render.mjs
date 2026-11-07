/**
 * Rendert die SVG-Quellen aus art/svg nach public/assets/img/map (1×) und
 * art/png (@2×), wie es die Stilvorgabe verlangt: Raster-PNG nur aus SVG.
 * Braucht Playwright mit Chromium (nicht Teil der Projektabhängigkeiten).
 */
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = dirname(fileURLToPath(import.meta.url));
const svgDir = join(root, 'svg');
const outDirs = { 1: join(root, '..', 'public', 'assets', 'img', 'map'), 2: join(root, 'png') };
for (const dir of Object.values(outDirs)) mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
let count = 0;
for (const file of readdirSync(svgDir).filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(join(svgDir, file), 'utf8');
  const match = /width="([\d.]+)" height="([\d.]+)"/.exec(svg);
  if (!match) throw new Error(`${file}: Breite und Höhe fehlen`);
  const [width, height] = [Number(match[1]), Number(match[2])];
  for (const scale of [1, 2]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg}</body></html>`,
    );
    const name = file.replace('.svg', scale === 2 ? '@2x.png' : '.png');
    await page.screenshot({
      path: join(outDirs[scale], name),
      omitBackground: true,
      clip: { x: 0, y: 0, width, height },
    });
    await page.close();
    count++;
  }
}
await browser.close();
console.log(`PNG: ${count}`);

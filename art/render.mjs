/**
 * Rendert die SVG-Quellen aus art/svg, wie es die Stilvorgabe verlangt (Raster nur aus SVG):
 * - jede Grafik @2× nach art/png
 * - Grafiken für das Spiel 1× nach public/assets/img/<Ordner>
 * - Animationsbilder (idle, freude, fuetterung) als Sprite-Sheet mit 256 px je Bild
 *   und Atlas-JSON nach public/assets/img/animals
 * Braucht Playwright mit Chromium (nicht Teil der Projektabhängigkeiten).
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = dirname(fileURLToPath(import.meta.url));
const svgDir = join(root, 'svg');
const pngDir = join(root, 'png');
const imgDir = join(root, '..', 'public', 'assets', 'img');
const FRAME = /^(.+)_(idle|freude|fuetterung)_(\d+)_512$/;
const FRAME_SIZE = 256;
const FPS = 12;

/** Zielordner im Spiel; undefined: nur @2× in art/png (z. B. Einzelbilder einer Animation). */
function target(name) {
  if (FRAME.test(name)) return undefined;
  if (name.startsWith('karte_')) return 'map';
  if (name.startsWith('menue_')) return 'menus';
  if (/_(hintergrund|aufgabe)_\d+x\d+$/.test(name)) return 'areas';
  if (name.startsWith('objekt_')) return 'objects';
  if (name.startsWith('ui_')) return 'ui';
  return 'animals';
}

const size = (svg) => {
  const match = /width="([\d.]+)" height="([\d.]+)"/.exec(svg);
  if (!match) throw new Error('Breite und Höhe fehlen');
  return [Number(match[1]), Number(match[2])];
};

mkdirSync(pngDir, { recursive: true });
const browser = await chromium.launch();
let count = 0;
const animations = new Map();

for (const file of readdirSync(svgDir).filter((f) => f.endsWith('.svg'))) {
  const name = file.replace('.svg', '');
  const svg = readFileSync(join(svgDir, file), 'utf8');
  const [width, height] = size(svg);
  const outputs = [[2, join(pngDir, `${name}@2x.png`)]];
  const dir = target(name);
  if (dir) {
    mkdirSync(join(imgDir, dir), { recursive: true });
    outputs.push([1, join(imgDir, dir, `${name}.png`)]);
  }
  for (const [scale, out] of outputs) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg}</body></html>`,
    );
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width, height } });
    await page.close();
    count++;
  }
  const frame = FRAME.exec(name);
  if (frame) {
    const key = `${frame[1]}_${frame[2]}`;
    const list = animations.get(key) ?? [];
    list[Number(frame[3])] = svg;
    animations.set(key, list);
  }
}

// Sprite-Sheets: Bilder nebeneinander, je 256 × 256, mit Atlas im Format von Phaser (JSON Hash).
mkdirSync(join(imgDir, 'animals'), { recursive: true });
for (const [key, frames] of animations) {
  const width = FRAME_SIZE * frames.length;
  const cells = frames
    .map((svg) =>
      svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${FRAME_SIZE}" height="${FRAME_SIZE}"`),
    )
    .join('');
  const page = await browser.newPage({ viewport: { width, height: FRAME_SIZE } });
  await page.setContent(
    `<html><body style="margin:0;background:transparent;display:flex">${cells}</body></html>`,
  );
  const sheet = `${key}_sheet`;
  await page.screenshot({
    path: join(imgDir, 'animals', `${sheet}.png`),
    omitBackground: true,
    clip: { x: 0, y: 0, width, height: FRAME_SIZE },
  });
  await page.close();
  const atlas = {
    frames: Object.fromEntries(
      frames.map((_, i) => [
        `${key}_${i}`,
        {
          frame: { x: i * FRAME_SIZE, y: 0, w: FRAME_SIZE, h: FRAME_SIZE },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: FRAME_SIZE, h: FRAME_SIZE },
          sourceSize: { w: FRAME_SIZE, h: FRAME_SIZE },
        },
      ]),
    ),
    meta: {
      image: `${sheet}.png`,
      size: { w: width, h: FRAME_SIZE },
      scale: '1',
      fps: FPS,
      // Idle läuft hin und her, Freude und Fütterung einmal durch.
      frameSequence: key.endsWith('_idle')
        ? [...frames.keys(), ...[...frames.keys()].slice(1, -1).reverse()]
        : [...frames.keys()],
    },
  };
  writeFileSync(join(imgDir, 'animals', `${sheet}.json`), `${JSON.stringify(atlas, null, 2)}\n`);
  count++;
}
await browser.close();
console.log(`PNG: ${count} (davon ${animations.size} Sprite-Sheets)`);

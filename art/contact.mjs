/**
 * Kontaktbögen der Grafiken als PNG in art/ (Übersicht für Durchsicht und Abnahme).
 * Aufruf: node art/contact.mjs  (braucht Playwright mit Chromium)
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = dirname(fileURLToPath(import.meta.url));
const svgDir = join(root, 'svg');

const range = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}_${i}_512`);
const expr = (prefix) =>
  ['neutral', 'froh', 'jubelnd', 'nachdenklich', 'muede'].map((e) => `${prefix}_${e}_512`);

const SHEETS = {
  pinguin: {
    title: 'Pinguinfelsen · Pinguin',
    tile: 150,
    rows: [
      ['Ausdrücke und Baby', [...expr('pinguinfelsen_pinguin'), 'pinguinfelsen_pinguin_baby_512']],
      ['Idle (6 Bilder)', range('pinguinfelsen_pinguin_idle', 6)],
      ['Freude (8 Bilder)', range('pinguinfelsen_pinguin_freude', 8)],
      ['Fütterung (8 Bilder)', range('pinguinfelsen_pinguin_fuetterung', 8)],
    ],
  },
  affe: {
    title: 'Affenwald · Affe',
    tile: 150,
    rows: [
      ['Ausdrücke und Baby', [...expr('affenwald_affe'), 'affenwald_affe_baby_512']],
      ['Idle (6 Bilder)', range('affenwald_affe_idle', 6)],
      ['Freude (8 Bilder)', range('affenwald_affe_freude', 8)],
      ['Fütterung (8 Bilder)', range('affenwald_affe_fuetterung', 8)],
    ],
  },
  hintergruende: {
    title: 'Hintergründe: Gehege und Aufgabenansicht',
    tile: 470,
    rows: [
      ['Pinguinfelsen', ['pinguinfelsen_hintergrund_1024x768', 'pinguinfelsen_aufgabe_1024x768']],
      ['Affenwald', ['affenwald_hintergrund_1024x768', 'affenwald_aufgabe_1024x768']],
    ],
  },
  menues: {
    title: 'Menüs: Start, Profil, Erwachsene, Rundenende',
    tile: 470,
    rows: [
      ['Start und Profil', ['menue_start_1024x768', 'menue_profil_1024x768']],
      ['Erwachsene und Rundenende', ['menue_erwachsene_1024x768', 'menue_rundenende_1024x768']],
    ],
  },
  bereiche: {
    title: 'Bereiche: Gehege (links) und Aufgabenansicht (rechts)',
    tile: 360,
    rows: [
      'elefantenwiese',
      'zookasse',
      'futteruhr',
      'schmetterlingshaus',
      'giraffenhof',
      'zoozaehlung',
    ].map((a) => [a, [`${a}_hintergrund_1024x768`, `${a}_aufgabe_1024x768`]]),
  },
  tiere: {
    title: 'Tiere: Ausdrücke, Baby und Kartensymbol',
    tile: 116,
    rows: [
      ['elefantenwiese_elefant', 'elefant'],
      ['zookasse_papagei', 'papagei'],
      ['futteruhr_eule', 'eule'],
      ['schmetterlingshaus_schmetterling', 'schmetterling'],
      ['giraffenhof_giraffe', 'giraffe'],
      ['zoozaehlung_erdmaennchen', 'erdmaennchen'],
    ].map(([p, short]) => [short, [...expr(p), `${p}_baby_512`, `karte_${short}_128`]]),
  },
  tiere_animation: {
    title: 'Tiere: Idle, Freude, Fütterung',
    tile: 72,
    rows: [
      'elefantenwiese_elefant',
      'zookasse_papagei',
      'futteruhr_eule',
      'schmetterlingshaus_schmetterling',
      'giraffenhof_giraffe',
      'zoozaehlung_erdmaennchen',
    ].map((p) => [
      p.split('_')[1],
      [...range(`${p}_idle`, 6), ...range(`${p}_freude`, 8), ...range(`${p}_fuetterung`, 8)],
    ]),
  },
  geld: {
    title: 'Zoo-Kasse: Münzen und Scheine (Werte setzt das Spiel darauf)',
    tile: 130,
    rows: [
      [
        'Münzen',
        [
          'geld_muenze_kupfer_128',
          'geld_muenze_gold_128',
          'geld_muenze_euro1_128',
          'geld_muenze_euro2_128',
        ],
      ],
      [
        'Scheine',
        [
          'geld_schein_5_240x128',
          'geld_schein_10_240x128',
          'geld_schein_20_240x128',
          'geld_schein_50_240x128',
        ],
      ],
    ],
  },
  belohnungen: {
    title: 'Belohnungen: Dekoration für die Karte und Abzeichen für das Sticker-Album',
    tile: 130,
    rows: [
      [
        'Dekoration (192 × 192)',
        ['ballons', 'drachen', 'windrad', 'vogelhaus', 'sonnenblumen', 'fahne'].map(
          (n) => `deko_${n}_192`,
        ),
      ],
      [
        '',
        ['laterne', 'bank', 'wegweiser', 'blumenkuebel', 'brunnen', 'ententeich'].map(
          (n) => `deko_${n}_192`,
        ),
      ],
      [
        'Abzeichen (256 × 256)',
        [
          'erste_runde',
          'fuenf_ohne_hilfe',
          'drei_sterne',
          'sterne_25',
          'sterne_100',
          'stufe_3',
        ].map((n) => `abzeichen_${n}_256`),
      ],
      [
        '',
        ['gehege_fertig', 'einmaleins', 'uhr', 'geld', 'drangeblieben', 'baby'].map(
          (n) => `abzeichen_${n}_256`,
        ),
      ],
    ],
  },
  objekte_ui: {
    title: 'Futter und Symbole der Aufgabenansicht',
    tile: 130,
    rows: [
      [
        'Futter (256 × 256)',
        ['objekt_fisch_256', 'objekt_eimer_256', 'objekt_banane_256', 'objekt_futternapf_256'],
      ],
      [
        'Symbole (96 × 96)',
        [
          'ui_vorlesen_96',
          'ui_zurueck_96',
          'ui_weiter_96',
          'ui_karte_96',
          'ui_loeschen_96',
          'ui_hilfe_zehner_96',
          'ui_hilfe_rechenstrich_96',
          'ui_hilfe_hundertertafel_96',
        ],
      ],
    ],
  },
};

const only = process.argv.slice(2);
const browser = await chromium.launch();
for (const [key, sheet] of Object.entries(SHEETS)) {
  if (only.length > 0 && !only.includes(key)) continue;
  const rows = sheet.rows
    .map(([label, names]) => {
      const tiles = names
        .filter((n) => existsSync(join(svgDir, `${n}.svg`)))
        .map((n) => {
          const svg = readFileSync(join(svgDir, `${n}.svg`), 'utf8').replace(
            /width="[\d.]+" height="[\d.]+"/,
            'width="100%" height="100%"',
          );
          const ratio = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
          const h = ratio ? (sheet.tile * Number(ratio[2])) / Number(ratio[1]) : sheet.tile;
          return `<figure><div class="tile" style="width:${sheet.tile}px;height:${h}px">${svg}</div><figcaption>${n.replace(/_(\d+x)?\d+$/, '')}</figcaption></figure>`;
        })
        .join('');
      return `<section><h2>${label}</h2><div class="row">${tiles}</div></section>`;
    })
    .join('');
  const html = `<html><head><style>
    body{margin:0;padding:24px;background:#FFF8EC;font-family:sans-serif;color:#3A2A20;width:max-content}
    h1{font-size:26px;margin:0 0 12px} h2{font-size:18px;margin:16px 0 8px}
    .row{display:flex;gap:14px;flex-wrap:nowrap} figure{margin:0}
    .tile{background:#E8D3A8;border-radius:10px;overflow:hidden}
    .tile svg{display:block} figcaption{font-size:10px;margin-top:4px;max-width:${sheet.tile}px;word-break:break-all}
  </style></head><body><h1>${sheet.title}</h1>${rows}</body></html>`;
  const page = await browser.newPage({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html);
  const out = join(root, `kontaktbogen_${key}.png`);
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
  console.log(out);
}
await browser.close();

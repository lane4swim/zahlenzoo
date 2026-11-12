import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';
import type { Flavor, Ice, IceBase } from '../../types/task';

const textStyle = (size: number = FontSize.small) => ({
  fontFamily: FontFamily.text,
  fontSize: `${size}px`,
  color: CssColor.text,
});

/** Breite einer Strichliste mit n Strichen. */
export function tallyWidth(n: number, bundled = true, gap = 9): number {
  if (!bundled) return n * gap;
  const bundles = Math.floor(n / 5);
  const rest = n % 5;
  return bundles * (5 * gap + 10) + rest * gap;
}

/** Zeichnet n Striche ab (x, y) (Mitte der Höhe); Fünferbündel: 4 Striche und ein Querstrich. */
export function drawTally(
  g: Phaser.GameObjects.Graphics,
  n: number,
  x: number,
  y: number,
  h = 34,
  bundled = true,
  gap = 9,
): void {
  g.lineStyle(3.5, Color.kontur, 1);
  let px = x;
  let left = n;
  while (left > 0) {
    if (bundled && left >= 5) {
      for (let i = 0; i < 4; i++) g.lineBetween(px + i * gap, y - h / 2, px + i * gap, y + h / 2);
      g.lineBetween(px - 5, y + h / 2 - 4, px + 3 * gap + 5, y - h / 2 + 4);
      px += 5 * gap + 10;
      left -= 5;
    } else {
      g.lineBetween(px, y - h / 2, px, y + h / 2);
      px += gap;
      left -= 1;
    }
  }
}

/** Strichliste: Zeilen mit Bild links und Strichen rechts, auf einem Zettel. */
export class TallyView extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    rows: ReadonlyArray<{ icon: string; n: number }>,
  ) {
    super(scene, x, y);
    const rowH = 58;
    const w = Math.max(360, 110 + Math.max(...rows.map((r) => tallyWidth(r.n))) + 30);
    const h = rows.length * rowH + 20;
    const g = scene.add.graphics();
    g.fillStyle(Color.papier, 1);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(1.5, Color.kontur, 0.35);
    g.lineBetween(-w / 2 + 84, -h / 2 + 8, -w / 2 + 84, h / 2 - 8);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    rows.forEach((row, i) => {
      const cy = -h / 2 + 10 + rowH * (i + 0.5);
      if (i > 0) g.lineBetween(-w / 2 + 8, cy - rowH / 2, w / 2 - 8, cy - rowH / 2);
      parts.push(scene.add.image(-w / 2 + 42, cy, row.icon).setDisplaySize(48, 48));
      drawTally(g, row.n, -w / 2 + 108, cy);
    });
    this.add(parts);
    this.add(scene.add.zone(0, 0, w, h));
    scene.add.existing(this);
  }
}

/** Tabelle: Kopfzeile mit Texten, Zeilen mit Bild und Zahlen. */
export class TableView extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    head: readonly string[],
    rows: ReadonlyArray<{ icon: string; values: readonly number[] }>,
  ) {
    super(scene, x, y);
    const first = 84;
    const colW = Math.max(104, ...head.map((t) => t.length * 13 + 24));
    const rowH = 54;
    const w = first + head.length * colW;
    const h = (rows.length + 1) * rowH;
    const left = -w / 2;
    const top = -h / 2;
    const g = scene.add.graphics();
    g.fillStyle(Color.papier, 1);
    g.fillRect(left, top, w, h);
    g.fillStyle(Color.sonne, 0.5);
    g.fillRect(left, top, w, rowH);
    g.lineStyle(1.5, Color.kontur, 0.6);
    for (let r = 1; r <= rows.length; r++)
      g.lineBetween(left, top + r * rowH, left + w, top + r * rowH);
    for (let c = 0; c < head.length; c++) {
      const cx = left + first + c * colW;
      g.lineBetween(cx, top, cx, top + h);
    }
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.strokeRect(left, top, w, h);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    head.forEach((t, c) => {
      parts.push(
        scene.add
          .text(left + first + (c + 0.5) * colW, top + rowH / 2, t, textStyle())
          .setOrigin(0.5),
      );
    });
    rows.forEach((row, r) => {
      const cy = top + (r + 1.5) * rowH;
      parts.push(scene.add.image(left + first / 2, cy, row.icon).setDisplaySize(44, 44));
      row.values.forEach((v, c) => {
        parts.push(
          scene.add
            .text(left + first + (c + 0.5) * colW, cy, String(v), textStyle(FontSize.text))
            .setOrigin(0.5),
        );
      });
    });
    this.add(parts);
    this.add(scene.add.zone(0, 0, w + 10, h + 10));
    scene.add.existing(this);
  }
}

/** Säulendiagramm mit Skala links und Bildern unter den Säulen. */
export class BarChart extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    items: ReadonlyArray<{ icon: string; value: number }>,
    step: number,
    max: number,
  ) {
    super(scene, x, y);
    const plotH = 200;
    const barW = 56;
    const gap = 40;
    const plotW = items.length * (barW + gap) + gap;
    const left = -plotW / 2 + 20;
    const bottom = plotH / 2 - 20;
    const top = bottom - plotH;
    const g = scene.add.graphics();
    const parts: Phaser.GameObjects.GameObject[] = [g];
    const lines = max / step;
    const label = lines <= 10 ? 1 : 2;
    for (let i = 0; i <= lines; i++) {
      const yy = bottom - (i / lines) * plotH;
      g.lineStyle(1.2, Color.kontur, i === 0 ? 1 : 0.25);
      g.lineBetween(left, yy, left + plotW, yy);
      if (i % label === 0) {
        parts.push(
          scene.add.text(left - 10, yy, String(i * step), textStyle(20)).setOrigin(1, 0.5),
        );
      }
    }
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.lineBetween(left, top - 6, left, bottom);
    const colors = [Color.wasser, Color.rosa, Color.gras, Color.orange];
    items.forEach((item, i) => {
      const bx = left + gap + i * (barW + gap);
      const bh = (item.value / max) * plotH;
      g.fillStyle(colors[i % colors.length]!, 1);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      if (bh > 0) {
        g.fillRect(bx, bottom - bh, barW, bh);
        g.strokeRect(bx, bottom - bh, barW, bh);
      }
      parts.push(scene.add.image(bx + barW / 2, bottom + 30, item.icon).setDisplaySize(44, 44));
    });
    this.add(parts);
    this.add(scene.add.zone(0, 10, plotW + 80, plotH + 80));
    scene.add.existing(this);
  }
}

/** Kalenderblatt: Monatsname, Wochentage Mo–So, Tage; markierte Tage eingekreist. */
export class CalendarView extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    weekdays: readonly string[],
    start: number,
    days: number,
    marks: readonly number[] = [],
  ) {
    super(scene, x, y);
    const cw = 56;
    const ch = 27;
    const weeks = Math.ceil((start + days) / 7);
    const w = 7 * cw + 20;
    const h = 38 + ch + weeks * ch + 10;
    const left = -w / 2;
    const top = -h / 2;
    const g = scene.add.graphics();
    g.fillStyle(Color.papier, 1);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.fillRoundedRect(left, top, w, h, 10);
    g.strokeRoundedRect(left, top, w, h, 10);
    g.fillStyle(Color.rosa, 1);
    g.fillRoundedRect(left, top, w, 34, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.lineBetween(left, top + 34, left + w, top + 34);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    parts.push(scene.add.text(0, top + 17, title, textStyle(FontSize.small)).setOrigin(0.5));
    const gx = left + 10;
    const gy = top + 36;
    weekdays.forEach((d, i) => {
      parts.push(
        scene.add
          .text(gx + (i + 0.5) * cw, gy + ch / 2, d, { ...textStyle(20), fontStyle: 'bold' })
          .setOrigin(0.5),
      );
    });
    // Wochenende hinterlegt
    g.fillStyle(Color.himmel, 0.6);
    g.fillRect(gx + 5 * cw, gy + ch, 2 * cw, weeks * ch);
    for (let d = 1; d <= days; d++) {
      const i = start + d - 1;
      const cx = gx + ((i % 7) + 0.5) * cw;
      const cy = gy + ch + (Math.floor(i / 7) + 0.5) * ch;
      if (marks.includes(d)) {
        g.lineStyle(3, Color.orange, 1);
        g.strokeCircle(cx, cy, 14);
      }
      parts.push(scene.add.text(cx, cy, String(d), textStyle(20)).setOrigin(0.5));
    }
    this.add(parts);
    this.add(scene.add.zone(0, 0, w, h));
    scene.add.existing(this);
  }
}

const FLAVOR_COLOR: Record<Flavor, number> = {
  strawberry: Color.rosa,
  chocolate: Color.erde,
  vanilla: Color.papier,
  pistachio: Color.gras,
  blueberry: Color.wasser,
};

/** Zeichnet ein Eis mit Mitte unten bei (x, y); size = Breite einer Kugel. */
export function drawIce(
  g: Phaser.GameObjects.Graphics,
  ice: Ice,
  x: number,
  y: number,
  size: number,
): void {
  const r = size / 2;
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  const baseTop = drawBase(g, ice.base, x, y, size);
  ice.scoops.forEach((f, i) => {
    const cy = baseTop - r * 0.6 - i * r * 1.45;
    g.fillStyle(FLAVOR_COLOR[f], 1);
    g.fillCircle(x, cy, r);
    g.strokeCircle(x, cy, r);
  });
}

/** Waffel oder Becher; liefert die Höhe, auf der die erste Kugel sitzt. */
function drawBase(
  g: Phaser.GameObjects.Graphics,
  base: IceBase,
  x: number,
  y: number,
  size: number,
): number {
  const w = size * 1.05;
  if (base === 'cone') {
    const h = size * 1.3;
    g.fillStyle(Color.orange, 1);
    g.fillTriangle(x - w / 2, y - h, x + w / 2, y - h, x, y);
    g.strokeTriangle(x - w / 2, y - h, x + w / 2, y - h, x, y);
    g.lineStyle(1.5, Color.kontur, 0.5);
    g.lineBetween(x - w / 4, y - h, x + w / 6, y - h / 3);
    g.lineBetween(x + w / 4, y - h, x - w / 6, y - h / 3);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    return y - h;
  }
  const h = size * 0.8;
  g.fillStyle(Color.wasser, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(x - w * 0.62, y - h),
      new Phaser.Math.Vector2(x + w * 0.62, y - h),
      new Phaser.Math.Vector2(x + w * 0.42, y),
      new Phaser.Math.Vector2(x - w * 0.42, y),
    ],
    true,
  );
  g.strokePoints(
    [
      new Phaser.Math.Vector2(x - w * 0.62, y - h),
      new Phaser.Math.Vector2(x + w * 0.62, y - h),
      new Phaser.Math.Vector2(x + w * 0.42, y),
      new Phaser.Math.Vector2(x - w * 0.42, y),
    ],
    true,
  );
  return y - h + size * 0.15;
}

/**
 * Eis-Auswahl: oben die Sorten (Kugeln) und Behälter, darunter schon gelegte Möglichkeiten
 * in einer Reihe (oder zwei).
 */
export class IceView extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    flavors: readonly Flavor[],
    bases: readonly IceBase[] = [],
    shown: readonly Ice[] = [],
    labels: { flavors: string; bases: string },
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    const parts: Phaser.GameObjects.GameObject[] = [g];
    const choiceY = shown.length ? -70 : 0;
    // Auswahl: Sorten links, Behälter rechts, je auf einem Schild
    const groups: Array<{ label: string; draw: (cx: number) => void; n: number }> = [
      {
        label: labels.flavors,
        n: flavors.length,
        draw: (cx) => {
          flavors.forEach((f, i) => {
            const fx = cx + (i - (flavors.length - 1) / 2) * 52;
            g.fillStyle(FLAVOR_COLOR[f], 1);
            g.lineStyle(Stroke.inner, Color.kontur, 1);
            g.fillCircle(fx, choiceY, 21);
            g.strokeCircle(fx, choiceY, 21);
          });
        },
      },
    ];
    if (bases.length) {
      groups.push({
        label: labels.bases,
        n: bases.length,
        draw: (cx) => {
          bases.forEach((b, i) => {
            const bx = cx + (i - (bases.length - 1) / 2) * 60;
            g.lineStyle(Stroke.inner, Color.kontur, 1);
            drawBase(g, b, bx, choiceY + 26, 40);
          });
        },
      });
    }
    const widths = groups.map((gr) => Math.max(gr === groups[0] ? 140 : 200, gr.n * 58 + 30));
    const total = widths.reduce((a, b) => a + b, 0) + 40 * (groups.length - 1);
    let left = -total / 2;
    groups.forEach((gr, i) => {
      const w = widths[i]!;
      g.fillStyle(Color.papier, 0.9);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.fillRoundedRect(left, choiceY - 62, w, 104, 10);
      g.strokeRoundedRect(left, choiceY - 62, w, 104, 10);
      parts.push(
        scene.add.text(left + w / 2, choiceY - 46, gr.label, textStyle(18)).setOrigin(0.5),
      );
      gr.draw(left + w / 2);
      left += w + 40;
    });
    // gelegte Möglichkeiten
    if (shown.length) {
      const step = Math.min(70, 660 / shown.length);
      const size = Math.min(30, step * 0.55);
      shown.forEach((ice, i) => {
        drawIce(g, ice, (i - (shown.length - 1) / 2) * step, 66, size);
      });
    }
    this.add(parts);
    const h = shown.length ? 210 : 120;
    this.add(scene.add.zone(0, shown.length ? -33 : 0, Math.max(total, 600), h));
    scene.add.existing(this);
  }
}

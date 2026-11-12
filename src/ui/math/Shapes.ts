import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';
import type { CellFigure, ShapeColor, ShapeSpec } from '../../types/task';

const FILL: Record<ShapeColor, number> = {
  red: Color.rosa,
  blue: Color.wasser,
  yellow: Color.sonne,
  green: Color.gras,
};
const SIZE = { s: 0.7, m: 1, l: 1.25 } as const;

/** Zeichnet eine Form mit Mitte (0, 0) und Grundgröße `base` (Breite eines Quadrats). */
export function drawShape(g: Phaser.GameObjects.Graphics, spec: ShapeSpec, base: number): void {
  const k = SIZE[spec.size ?? 'm'];
  const s = base * k;
  g.fillStyle(FILL[spec.color], 1);
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  if (spec.kind === 'circle') {
    g.fillCircle(0, 0, s / 2);
    g.strokeCircle(0, 0, s / 2);
    return;
  }
  const rot = ((spec.rot ?? 0) * Math.PI) / 180;
  const pts =
    spec.kind === 'square'
      ? [
          [-s / 2, -s / 2],
          [s / 2, -s / 2],
          [s / 2, s / 2],
          [-s / 2, s / 2],
        ]
      : spec.kind === 'rect'
        ? [
            [-s * 0.75, -s * 0.38],
            [s * 0.75, -s * 0.38],
            [s * 0.75, s * 0.38],
            [-s * 0.75, s * 0.38],
          ]
        : [
            [0, -s * 0.55],
            [s * 0.58, s * 0.45],
            [-s * 0.58, s * 0.45],
          ];
  const points = pts.map(
    ([x, y]) =>
      new Phaser.Math.Vector2(
        x! * Math.cos(rot) - y! * Math.sin(rot),
        x! * Math.sin(rot) + y! * Math.cos(rot),
      ),
  );
  g.fillPoints(points, true);
  g.strokePoints(points, true);
}

/** Formen in einer Reihe; eine Lücke (null) ist ein Kästchen mit Fragezeichen. */
export class ShapeRow extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    items: ReadonlyArray<ShapeSpec | null>,
    maxWidth = 640,
  ) {
    super(scene, x, y);
    const step = Math.min(96, maxWidth / Math.max(1, items.length));
    const base = items.length === 1 ? 120 : step * 0.62;
    items.forEach((spec, i) => {
      const cx = (i - (items.length - 1) / 2) * step;
      const g = scene.add.graphics({ x: cx, y: 0 });
      if (spec) {
        drawShape(g, spec, base);
        this.add(g);
      } else {
        g.fillStyle(Color.papier, 1);
        g.lineStyle(Stroke.inner, Color.kontur, 1);
        g.fillRoundedRect(-base * 0.6, -base * 0.6, base * 1.2, base * 1.2, 10);
        g.strokeRoundedRect(-base * 0.6, -base * 0.6, base * 1.2, base * 1.2, 10);
        this.add(g);
        this.add(
          scene.add
            .text(cx, 0, '?', {
              fontFamily: FontFamily.text,
              fontSize: `${FontSize.digits}px`,
              color: CssColor.text,
            })
            .setOrigin(0.5)
            .setAlpha(0.4),
        );
      }
    });
    this.add(scene.add.zone(0, 0, items.length * step, step * 1.4));
    scene.add.existing(this);
  }
}

/**
 * Kästchenfiguren nebeneinander auf einem Raster; gefüllte Kästchen in Grün.
 * axis: gestrichelte Spiegelachse in der Mitte der ersten Figur; outline: Rand betonen.
 */
export class CellFigures extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    figures: readonly CellFigure[],
    axis?: 'v' | 'h',
    outline = false,
  ) {
    super(scene, x, y);
    const cell = Math.min(40, 300 / Math.max(...figures.map((f) => Math.max(f.cols, f.rows))));
    const gap = 60;
    const widths = figures.map((f) => f.cols * cell);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (figures.length - 1);
    let left = -total / 2;
    const maxH = Math.max(...figures.map((f) => f.rows * cell));
    figures.forEach((f, i) => {
      const g = scene.add.graphics();
      const top = (-f.rows * cell) / 2;
      g.fillStyle(Color.papier, 1);
      g.fillRect(left, top, f.cols * cell, f.rows * cell);
      g.lineStyle(1.2, Color.kontur, 0.35);
      for (let c = 0; c <= f.cols; c++)
        g.lineBetween(left + c * cell, top, left + c * cell, top + f.rows * cell);
      for (let r = 0; r <= f.rows; r++)
        g.lineBetween(left, top + r * cell, left + f.cols * cell, top + r * cell);
      const filled = new Set(f.cells.map(([c, r]) => `${c},${r}`));
      g.fillStyle(Color.gras, 1);
      for (const [c, r] of f.cells)
        g.fillRect(left + c * cell + 1, top + r * cell + 1, cell - 2, cell - 2);
      if (outline) {
        // Rand der Figur: Kästchenseiten, an denen kein gefülltes Nachbarkästchen liegt
        g.lineStyle(Stroke.outline, Color.kontur, 1);
        for (const [c, r] of f.cells) {
          const x0 = left + c * cell;
          const y0 = top + r * cell;
          if (!filled.has(`${c},${r - 1}`)) g.lineBetween(x0, y0, x0 + cell, y0);
          if (!filled.has(`${c},${r + 1}`)) g.lineBetween(x0, y0 + cell, x0 + cell, y0 + cell);
          if (!filled.has(`${c - 1},${r}`)) g.lineBetween(x0, y0, x0, y0 + cell);
          if (!filled.has(`${c + 1},${r}`)) g.lineBetween(x0 + cell, y0, x0 + cell, y0 + cell);
        }
      }
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.strokeRect(left, top, f.cols * cell, f.rows * cell);
      if (axis && i === 0) {
        g.lineStyle(Stroke.outline, Color.rosa, 1);
        const dash = 10;
        if (axis === 'v') {
          const ax = left + (f.cols * cell) / 2;
          for (let yy = top - 14; yy < top + f.rows * cell + 14; yy += dash * 2)
            g.lineBetween(ax, yy, ax, yy + dash);
        } else {
          const ay = top + (f.rows * cell) / 2;
          for (let xx = left - 14; xx < left + f.cols * cell + 14; xx += dash * 2)
            g.lineBetween(xx, ay, xx + dash, ay);
        }
      }
      this.add(g);
      left += widths[i]! + gap;
    });
    this.add(scene.add.zone(0, 0, total + 30, maxH + 30));
    scene.add.existing(this);
  }
}

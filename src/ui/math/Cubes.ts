import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';
import { at, MAX_HEIGHT, SIZE } from '../../logic/cubes';
import type { Heights } from '../../types/task';

const K = Math.cos(Math.PI / 6);

/**
 * Würfelgebäude von schräg oben (isometrisch), Mitte der Grundfläche bei (0, 0).
 * Hinten (Zeile 0) liegt oben, vorn (Zeile 2) unten links, rechts (Spalte 2) unten rechts.
 */
export function drawBuilding(
  g: Phaser.GameObjects.Graphics,
  h: Heights,
  s: number,
  ox = 0,
  oy = 0,
  ground = true,
): void {
  const px = (c: number, r: number) => ox + (c - r) * s * K;
  const py = (c: number, r: number, z: number) => oy + ((c + r - 2 * 1.5 + 1) * s) / 2 - z * s;
  const poly = (pts: Array<[number, number]>, fill: number) => {
    const v = pts.map(([x, y]) => new Phaser.Math.Vector2(x, y));
    g.fillStyle(fill, 1);
    g.fillPoints(v, true);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.strokePoints(v, true);
  };
  if (ground) {
    // Grundfläche 3 × 3 als helles Raster
    g.lineStyle(1.2, Color.kontur, 0.35);
    for (let i = 0; i <= SIZE; i++) {
      g.lineBetween(px(i, 0), py(i, 0, 0) - s / 2, px(i, SIZE), py(i, SIZE, 0) - s / 2);
      g.lineBetween(px(0, i), py(0, i, 0) - s / 2, px(SIZE, i), py(SIZE, i, 0) - s / 2);
    }
  }
  // von hinten nach vorn, von unten nach oben
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) cells.push([c, r]);
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [c, r] of cells) {
    for (let z = 0; z < at(h, c, r); z++) {
      // Ecken der Oberseite des Würfels (c..c+1, r..r+1) in Höhe z+1
      const top = (cc: number, rr: number): [number, number] => [
        px(cc, rr),
        py(cc, rr, z + 1) - s / 2,
      ];
      const bot = (cc: number, rr: number): [number, number] => [px(cc, rr), py(cc, rr, z) - s / 2];
      poly([top(c, r), top(c + 1, r), top(c + 1, r + 1), top(c, r + 1)], Color.sonne);
      poly([top(c, r + 1), top(c + 1, r + 1), bot(c + 1, r + 1), bot(c, r + 1)], Color.orange);
      poly([top(c + 1, r), top(c + 1, r + 1), bot(c + 1, r + 1), bot(c + 1, r)], Color.erde);
    }
  }
}

const label = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number = FontSize.small,
) =>
  scene.add
    .text(x, y, text, { fontFamily: FontFamily.text, fontSize: `${size}px`, color: CssColor.text })
    .setOrigin(0.5);

/** Würfelgebäude als Bild; marks: Seiten „vorn“ und „rechts“ beschriften. */
export class BuildingView extends Phaser.GameObjects.Container {
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    h: Heights,
    private readonly s = 40,
    marks?: { front: string; right: string },
  ) {
    super(scene, x, y);
    this.g = scene.add.graphics();
    this.add(this.g);
    this.setHeights(h);
    if (marks) {
      const d = SIZE * s;
      this.add(label(scene, -d * K * 0.55, d * 0.55 + 22, marks.front, 20).setAngle(30));
      this.add(label(scene, d * K * 0.55, d * 0.55 + 22, marks.right, 20).setAngle(-30));
    }
    const w = 2 * SIZE * s * K + 20;
    const hh = SIZE * s + MAX_HEIGHT * s + 40;
    this.add(scene.add.zone(0, -MAX_HEIGHT * s * 0.4, w, hh));
    scene.add.existing(this);
  }

  setHeights(h: Heights): this {
    this.g.clear();
    drawBuilding(this.g, h, this.s);
    return this;
  }
}

/** Bauplan: 3 × 3 Felder mit der Anzahl der Würfel; „vorn“ unten. */
export function drawPlan(
  g: Phaser.GameObjects.Graphics,
  h: Heights,
  cell: number,
  ox = 0,
  oy = 0,
): void {
  const left = ox - (SIZE * cell) / 2;
  const top = oy - (SIZE * cell) / 2;
  g.fillStyle(Color.papier, 1);
  g.fillRect(left, top, SIZE * cell, SIZE * cell);
  g.lineStyle(1.5, Color.kontur, 0.6);
  for (let i = 1; i < SIZE; i++) {
    g.lineBetween(left + i * cell, top, left + i * cell, top + SIZE * cell);
    g.lineBetween(left, top + i * cell, left + SIZE * cell, top + i * cell);
  }
  g.fillStyle(Color.sonne, 0.55);
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (at(h, c, r) > 0) g.fillRect(left + c * cell + 2, top + r * cell + 2, cell - 4, cell - 4);
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  g.strokeRect(left, top, SIZE * cell, SIZE * cell);
}

/** Zahlen im Bauplan (leere Felder bleiben leer). */
export function planNumbers(
  scene: Phaser.Scene,
  h: Heights,
  cell: number,
  ox = 0,
  oy = 0,
  size: number = FontSize.text,
): Phaser.GameObjects.Text[] {
  const out: Phaser.GameObjects.Text[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const n = at(h, c, r);
      out.push(
        label(scene, ox + (c - 1) * cell, oy + (r - 1) * cell, n > 0 ? String(n) : '', size),
      );
    }
  return out;
}

export class PlanView extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, h: Heights, cell = 54, front?: string) {
    super(scene, x, y);
    const g = scene.add.graphics();
    drawPlan(g, h, cell);
    this.add(g);
    this.add(planNumbers(scene, h, cell));
    if (front) this.add(label(scene, 0, (SIZE * cell) / 2 + 18, front, 20));
    this.add(scene.add.zone(0, 10, SIZE * cell + 20, SIZE * cell + 50));
    scene.add.existing(this);
  }
}

/** Ansicht (von vorn oder der Seite): Säulen aus Quadraten, links nach rechts. */
export function drawView(
  g: Phaser.GameObjects.Graphics,
  view: readonly number[],
  cell: number,
  ox = 0,
  bottom = 0,
): void {
  const left = ox - (view.length * cell) / 2;
  g.lineStyle(1.2, Color.kontur, 0.5);
  g.lineBetween(left - 6, bottom, left + view.length * cell + 6, bottom);
  view.forEach((n, i) => {
    for (let z = 0; z < n; z++) {
      g.fillStyle(Color.orange, 1);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.fillRect(left + i * cell, bottom - (z + 1) * cell, cell, cell);
      g.strokeRect(left + i * cell, bottom - (z + 1) * cell, cell, cell);
    }
  });
}

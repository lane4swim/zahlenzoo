import Phaser from 'phaser';
import { Color, Stroke } from '../theme';
import { MOVES, type Move } from '../../logic/grid';
import type { BoardSpec, Cell } from '../../types/task';

/**
 * Spielfeld aus Kästchen, Mitte bei (0, 0): feste grüne Kästchen, Bilder auf Feldern
 * (Steine selbst gezeichnet), Spiegelachse, Startfigur, gemalte Kästchen, markiertes Feld
 * und ein gelegter Weg.
 */
export class GridBoard extends Phaser.GameObjects.Container {
  readonly cell: number;
  private readonly left: number;
  private readonly top: number;
  private readonly fills: Phaser.GameObjects.Graphics;
  private readonly marks: Phaser.GameObjects.Graphics;
  private figure?: Phaser.GameObjects.Image;
  private figureOffset = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly spec: BoardSpec,
    /** flache Felder (z. B. Zooplan 4 × 2) dürfen breiter werden */
    maxSize = spec.rows <= 2 ? 420 : 280,
  ) {
    super(scene, x, y);
    this.cell = Math.min(
      spec.rows <= 2 ? 104 : 72,
      Math.floor(maxSize / Math.max(spec.cols, spec.rows)),
    );
    const w = spec.cols * this.cell;
    const h = spec.rows * this.cell;
    this.left = -w / 2;
    this.top = -h / 2;
    const g = scene.add.graphics();
    g.fillStyle(Color.papier, 1);
    g.fillRect(this.left, this.top, w, h);
    g.lineStyle(1.2, Color.kontur, 0.35);
    for (let c = 0; c <= spec.cols; c++)
      g.lineBetween(this.left + c * this.cell, this.top, this.left + c * this.cell, this.top + h);
    for (let r = 0; r <= spec.rows; r++)
      g.lineBetween(this.left, this.top + r * this.cell, this.left + w, this.top + r * this.cell);
    g.fillStyle(Color.gras, 1);
    for (const [c, r] of spec.given ?? []) this.fillCell(g, c, r);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.strokeRect(this.left, this.top, w, h);
    this.add(g);
    this.fills = scene.add.graphics();
    this.add(this.fills);
    for (const item of spec.items ?? []) {
      const [cx, cy] = this.center(item.cell);
      if (item.icon === 'stone') {
        const s = scene.add.graphics();
        s.fillStyle(Color.grauWarm, 1);
        s.lineStyle(Stroke.inner, Color.kontur, 1);
        s.fillRoundedRect(
          cx - this.cell * 0.36,
          cy - this.cell * 0.3,
          this.cell * 0.72,
          this.cell * 0.6,
          10,
        );
        s.strokeRoundedRect(
          cx - this.cell * 0.36,
          cy - this.cell * 0.3,
          this.cell * 0.72,
          this.cell * 0.6,
          10,
        );
        this.add(s);
      } else {
        const size = this.cell * 0.82;
        this.add(scene.add.image(cx, cy, item.icon).setDisplaySize(size, size));
      }
    }
    if (spec.axis) {
      const a = scene.add.graphics();
      a.lineStyle(Stroke.outline, Color.rosa, 1);
      const dash = 10;
      if (spec.axis === 'v') {
        for (let yy = this.top - 14; yy < this.top + h + 14; yy += dash * 2)
          a.lineBetween(0, yy, 0, yy + dash);
      } else {
        for (let xx = this.left - 14; xx < this.left + w + 14; xx += dash * 2)
          a.lineBetween(xx, 0, xx + dash, 0);
      }
      this.add(a);
    }
    this.marks = scene.add.graphics();
    this.add(this.marks);
    if (spec.start) {
      // Steht auf dem Startfeld ein Bild (Zooplan), läuft eine kleine Figur in der Ecke mit.
      const [sc, sr] = spec.start.cell;
      const onItem = spec.items?.some((i) => i.cell[0] === sc && i.cell[1] === sr);
      this.figureOffset = onItem ? this.cell * 0.27 : 0;
      const [cx, cy] = this.center(spec.start.cell);
      const size = this.cell * (this.figureOffset ? 0.5 : 0.86);
      this.figure = scene.add
        .image(cx + this.figureOffset, cy + this.figureOffset, spec.start.icon)
        .setDisplaySize(size, size);
      this.add(this.figure);
    }
    this.add(scene.add.zone(0, 0, w + 30, h + 30));
    scene.add.existing(this);
  }

  get boardWidth(): number {
    return this.spec.cols * this.cell;
  }

  /** Mitte eines Feldes relativ zum Spielfeld */
  center([c, r]: Cell): [number, number] {
    return [this.left + (c + 0.5) * this.cell, this.top + (r + 0.5) * this.cell];
  }

  /** Feld unter einem Punkt in Weltkoordinaten */
  cellAt(worldX: number, worldY: number): Cell | undefined {
    const m = this.getWorldTransformMatrix();
    const scale = m.scaleX;
    const lx = (worldX - m.tx) / scale - this.left;
    const ly = (worldY - m.ty) / scale - this.top;
    const c = Math.floor(lx / this.cell);
    const r = Math.floor(ly / this.cell);
    if (c < 0 || r < 0 || c >= this.spec.cols || r >= this.spec.rows) return undefined;
    return [c, r];
  }

  private fillCell(g: Phaser.GameObjects.Graphics, c: number, r: number): void {
    g.fillRect(
      this.left + c * this.cell + 1,
      this.top + r * this.cell + 1,
      this.cell - 2,
      this.cell - 2,
    );
  }

  /** Gemalte Kästchen (Farbe gras wie die festen Kästchen; Lösung in Sonnengelb). */
  setCells(cells: readonly Cell[], color: number = Color.gras): this {
    this.fills.clear();
    this.fills.fillStyle(color, 1);
    for (const [c, r] of cells) this.fillCell(this.fills, c, r);
    return this;
  }

  /** Markiert ein Feld mit einem gelben Rahmen (gewähltes Feld, Ziel). */
  mark(cell: Cell | undefined, color: number = Color.sonne): this {
    this.marks.clear();
    if (!cell) return this;
    this.marks.lineStyle(6, color, 1);
    this.marks.strokeRoundedRect(
      this.left + cell[0] * this.cell + 3,
      this.top + cell[1] * this.cell + 3,
      this.cell - 6,
      this.cell - 6,
      8,
    );
    return this;
  }

  /** Zeichnet einen Weg ab dem Start; die Figur steht am Ende (vor einem Hindernis). */
  setPath(cells: readonly Cell[], color: number = Color.orange): this {
    this.marks.clear();
    if (cells.length > 1) {
      this.marks.lineStyle(8, color, 1);
      for (let i = 1; i < cells.length; i++) {
        const [x0, y0] = this.center(cells[i - 1]!);
        const [x1, y1] = this.center(cells[i]!);
        this.marks.lineBetween(x0, y0, x1, y1);
      }
      this.marks.fillStyle(color, 1);
      for (const cell of cells.slice(1)) {
        const [x, y] = this.center(cell);
        this.marks.fillCircle(x, y, 7);
      }
    }
    const end = cells[cells.length - 1];
    if (this.figure && end) {
      const [x, y] = this.center(end);
      this.figure.setPosition(x + this.figureOffset, y + this.figureOffset);
      this.bringToTop(this.figure);
    }
    return this;
  }
}

/** Pfeil für Tasten und Weganzeige, Mitte (0, 0). */
export function drawArrow(g: Phaser.GameObjects.Graphics, move: Move, size: number): void {
  const [dx, dy] = MOVES[move];
  const s = size / 2;
  const tip: [number, number] = [dx * s, dy * s];
  const tail: [number, number] = [-dx * s, -dy * s];
  const px = -dy;
  const py = dx;
  g.lineStyle(Stroke.outline + 2, Color.kontur, 1);
  g.lineBetween(tail[0], tail[1], tip[0] - dx * 6, tip[1] - dy * 6);
  g.fillStyle(Color.kontur, 1);
  g.fillTriangle(
    tip[0],
    tip[1],
    tip[0] - dx * s * 0.7 + px * s * 0.55,
    tip[1] - dy * s * 0.7 + py * s * 0.55,
    tip[0] - dx * s * 0.7 - px * s * 0.55,
    tip[1] - dy * s * 0.7 - py * s * 0.55,
  );
}

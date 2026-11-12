import Phaser from 'phaser';
import { Color, Stroke } from '../theme';
import { piecePoints, slotCenter } from '../../logic/pieces';
import type { Piece, PieceKind, PieceSlot } from '../../types/task';

/** Farben der Teile nach Form, damit gleiche Teile gleich aussehen. */
export const PIECE_FILL: Record<PieceKind, number> = {
  square: Color.wasser,
  rect: Color.sonne,
  tri: Color.rosa,
  semi: Color.orange,
};

/** Zeichnet ein Teil mit Mitte (0, 0) bzw. (dx, dy); unit = Feldgröße in Pixeln. */
export function drawPiece(
  g: Phaser.GameObjects.Graphics,
  piece: Piece,
  unit: number,
  dx = 0,
  dy = 0,
  fill: number = PIECE_FILL[piece.kind],
): void {
  const pts = piecePoints(piece).map(
    ([x, y]) => new Phaser.Math.Vector2(dx + x * unit, dy + y * unit),
  );
  g.fillStyle(fill, 1);
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  g.fillPoints(pts, true);
  g.strokePoints(pts, true);
}

/** Gestrichelter Umriss eines Platzes (Lücke, Ziel beim Legen). */
export function dashPiece(
  g: Phaser.GameObjects.Graphics,
  piece: Piece,
  unit: number,
  dx: number,
  dy: number,
): void {
  const pts = piecePoints(piece).map(([x, y]) => [dx + x * unit, dy + y * unit] as const);
  g.fillStyle(Color.weiss, 0.7);
  g.fillPoints(
    pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
    true,
  );
  g.lineStyle(Stroke.inner, Color.kontur, 0.8);
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[(i + 1) % pts.length]!;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / 10));
    for (let k = 0; k < n; k += 2) {
      const a = k / n;
      const b = Math.min(1, (k + 1) / n);
      g.lineBetween(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b);
    }
  }
}

/** Position eines Platzes relativ zur Mitte der Figur. */
export function slotPos(
  slot: PieceSlot,
  cols: number,
  rows: number,
  unit: number,
): [number, number] {
  const [cx, cy] = slotCenter(slot);
  return [(cx - cols / 2) * unit, (cy - rows / 2) * unit];
}

/** Figur aus Teilen; versteckte Plätze nur als gestrichelter Umriss. */
export class PiecesView extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    cols: number,
    rows: number,
    slots: readonly PieceSlot[],
    hidden: readonly number[] = [],
    unit = 64,
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    slots.forEach((slot, i) => {
      const [px, py] = slotPos(slot, cols, rows, unit);
      if (hidden.includes(i)) dashPiece(g, slot, unit, px, py);
      else drawPiece(g, slot, unit, px, py);
    });
    this.add(g);
    this.add(scene.add.zone(0, 0, cols * unit + 30, rows * unit + 30));
    scene.add.existing(this);
  }
}

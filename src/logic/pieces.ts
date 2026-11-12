import type { Piece, PieceKind, PieceSlot } from '../types/task';

/** Ecken eines Teils in Feldeinheiten, Mitte des Teils bei (0, 0). Halbkreis: Bogen in 12 Stücken. */
export function piecePoints(piece: Piece): Array<[number, number]> {
  const rot = ((piece.rot % 4) + 4) % 4;
  let pts: Array<[number, number]>;
  if (piece.kind === 'square') {
    pts = [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ];
  } else if (piece.kind === 'rect') {
    pts = [
      [-1, -0.5],
      [1, -0.5],
      [1, 0.5],
      [-1, 0.5],
    ];
  } else if (piece.kind === 'tri') {
    // rechter Winkel unten links (rot 0); gedreht im Uhrzeigersinn
    pts = [
      [-0.5, 0.5],
      [-0.5, -0.5],
      [0.5, 0.5],
    ];
  } else {
    // Halbkreis (Durchmesser 1 Feld): gerade Seite auf dem unteren Rand, Bogen nach oben (rot 0)
    pts = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      pts.push([0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)]);
    }
  }
  return pts.map(([x, y]) => rotate(x, y, rot));
}

function rotate(x: number, y: number, quarter: number): [number, number] {
  let px = x;
  let py = y;
  for (let i = 0; i < quarter; i++) {
    // 90° im Uhrzeigersinn (y zeigt nach unten)
    const t = px;
    px = -py;
    py = t;
  }
  return [px + 0, py + 0];
}

/** Mitte eines Platzes in Feldeinheiten (Feld oben links bei c, r). */
export function slotCenter(slot: PieceSlot): [number, number] {
  if (slot.kind === 'rect') {
    return slot.rot % 2 === 0 ? [slot.c + 1, slot.r + 0.5] : [slot.c + 0.5, slot.r + 1];
  }
  return [slot.c + 0.5, slot.r + 0.5];
}

/** Passt ein Teil in dieser Lage auf den Platz? */
export function sameLie(kind: PieceKind, a: number, b: number): boolean {
  if (kind === 'square') return true;
  const m = kind === 'rect' ? 2 : 4;
  return (((a - b) % m) + m) % m === 0;
}

/** Wie viele verschiedene Lagen hat ein Teil? */
export function lies(kind: PieceKind): number {
  return kind === 'square' ? 1 : kind === 'rect' ? 2 : 4;
}

import type { Heights } from '../types/task';

/** Würfelgebäude auf 3 × 3 Feldern: Index = Zeile · 3 + Spalte; Zeile 0 hinten, 2 vorn. */
export const SIZE = 3;
export const MAX_HEIGHT = 3;

export const at = (h: Heights, c: number, r: number): number =>
  c < 0 || r < 0 || c >= SIZE || r >= SIZE ? 0 : (h[r * SIZE + c] ?? 0);

export const total = (h: Heights): number => h.reduce((a, b) => a + b, 0);

/** Ansicht von vorn: je Spalte (links nach rechts) die größte Höhe. */
export function frontView(h: Heights): number[] {
  return [0, 1, 2].map((c) => Math.max(...[0, 1, 2].map((r) => at(h, c, r))));
}

/** Ansicht von rechts: je Zeile, von vorn (links) nach hinten (rechts), die größte Höhe. */
export function sideView(h: Heights): number[] {
  return [2, 1, 0].map((r) => Math.max(...[0, 1, 2].map((c) => at(h, c, r))));
}

/** Spiegelbild links ↔ rechts (typischer Fehler beim Bauplan). */
export function mirror(h: Heights): Heights {
  return [0, 1, 2].flatMap((r) => [2, 1, 0].map((c) => at(h, c, r)));
}

/**
 * Würfel, die man von schräg oben nicht sieht: Würfel mit einem Würfel darauf, vor ihm
 * (Zeile + 1) und rechts daneben (Spalte + 1) in derselben Höhe.
 */
export function hiddenCubes(h: Heights): number {
  let n = 0;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      for (let z = 0; z < at(h, c, r); z++) {
        const covered = at(h, c, r) > z + 1 && at(h, c, r + 1) > z && at(h, c + 1, r) > z;
        if (covered) n++;
      }
  return n;
}

/** Würfel, deren Vorderseite verdeckt ist und die unter einem anderen stehen (schwer zu zählen). */
export function tuckedCubes(h: Heights): number {
  let n = 0;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      for (let z = 0; z < at(h, c, r) - 1; z++) if (at(h, c, r + 1) > z) n++;
  return n;
}

export const heightsKey = (h: Heights): string => h.join(',');

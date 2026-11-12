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

/** Dreieck des Bildrasters als Schlüssel aus seinen drei Ecken (u, v). */
function tri(...points: Array<[number, number]>): string {
  return points
    .map(([u, v]) => `${u}/${v}`)
    .sort()
    .join(' ');
}

/**
 * Die drei sichtbaren Flächen eines Würfels als je zwei Dreiecke im Bild. Bildlage:
 * u = Spalte − Zeile (nach rechts), v = Spalte + Zeile − 2 · Höhe (nach unten).
 */
function faces(c: number, r: number, z: number): string[][] {
  const u = c - r;
  const v = c + r - 2 * z;
  const C: [number, number] = [u, v];
  const top: [number, number] = [u, v - 2];
  const bottom: [number, number] = [u, v + 2];
  const ul: [number, number] = [u - 1, v - 1];
  const ur: [number, number] = [u + 1, v - 1];
  const ll: [number, number] = [u - 1, v + 1];
  const lr: [number, number] = [u + 1, v + 1];
  return [
    [tri(top, C, ul), tri(top, ur, C)], // oben
    [tri(C, ll, ul), tri(C, bottom, ll)], // vorn (unten links)
    [tri(C, ur, lr), tri(C, lr, bottom)], // rechts (unten rechts)
  ];
}

/**
 * Sind alle Würfel gut zu sehen? Ansicht schräg von oben wie in der Darstellung: vorn liegt
 * unten links, rechts unten rechts. Jedes Dreieck des Bildes zeigt den Würfel, der dem
 * Betrachter am nächsten ist (größtes Spalte + Zeile + Höhe). Jeder Würfel muss mindestens eine
 * ganze Fläche zeigen. Kinder sollen zählen, was sie sehen, und nicht erraten, was verborgen ist.
 */
export function allVisible(h: Heights): boolean {
  const cubes: Array<{ c: number; r: number; z: number }> = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) for (let z = 0; z < at(h, c, r); z++) cubes.push({ c, r, z });
  const owner = new Map<string, number>();
  const depth = (i: number) => cubes[i]!.c + cubes[i]!.r + cubes[i]!.z;
  cubes.forEach(({ c, r, z }, i) => {
    for (const face of faces(c, r, z))
      for (const t of face) {
        const o = owner.get(t);
        if (o === undefined || depth(i) > depth(o)) owner.set(t, i);
      }
  });
  return cubes.every(({ c, r, z }, i) =>
    faces(c, r, z).some((face) => face.every((t) => owner.get(t) === i)),
  );
}

export const heightsKey = (h: Heights): string => h.join(',');

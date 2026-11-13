/** Reihenfolge der Tastaturbedienung (rein rechnerisch, ohne Phaser; genutzt von ui/focus.ts). */

/**
 * Reihenfolge und Sprünge: Leserichtung (Zeilen von oben nach unten, darin von links nach
 * rechts); Pfeiltasten wählen das nächste Element in der Richtung, Abweichung quer zählt doppelt.
 */
export function nextIndex(
  points: ReadonlyArray<{ x: number; y: number }>,
  current: number,
  key: 'next' | 'prev' | 'left' | 'right' | 'up' | 'down',
): number {
  if (points.length === 0) return -1;
  if (current < 0) return 0;
  if (key === 'next') return (current + 1) % points.length;
  if (key === 'prev') return (current - 1 + points.length) % points.length;
  const from = points[current]!;
  const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[key];
  let best = current;
  let bestScore = Infinity;
  points.forEach((p, i) => {
    if (i === current) return;
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const along = dx * dir[0]! + dy * dir[1]!;
    if (along <= 4) return;
    const across = Math.abs(dx * dir[1]! - dy * dir[0]!);
    const score = along + 2 * across;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

export function readingOrder<T extends { x: number; y: number }>(items: readonly T[]): T[] {
  // gleiche Zeile, wenn weniger als 40 px Höhenunterschied
  return [...items].sort((a, b) => (Math.abs(a.y - b.y) < 40 ? a.x - b.x : a.y - b.y));
}

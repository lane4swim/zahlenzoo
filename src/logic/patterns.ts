import type { Profile, SavedPattern } from '../types/save';
import type { ShapeSpec } from '../types/task';

/** Höchstens so viele Muster stehen im Zoo; das älteste geht, wenn ein neues kommt. */
export const MAX_PATTERNS = 6;

const same = (a: ShapeSpec, b: ShapeSpec) => a.kind === b.kind && a.color === b.color;

/**
 * Nach wie vielen Formen wiederholt sich das Muster? Betrachtet die Formen von links bis zur
 * ersten Lücke. 0: (noch) kein Muster; 1: alle Formen gleich. Es braucht mindestens zwei
 * vollständige Durchgänge (bei 2er-Mustern also 4 Formen).
 */
export function patternPeriod(items: ReadonlyArray<ShapeSpec | null>): number {
  const end = items.indexOf(null);
  const row = (end < 0 ? items : items.slice(0, end)) as ShapeSpec[];
  for (let p = 1; p * 2 <= row.length; p++) {
    if (p === 1 && row.length < 3) continue;
    if (row.every((s, i) => i < p || same(s, row[i - p]!))) return p;
  }
  return 0;
}

/** Stellt ein Muster im Zoo aus (neuestes zuerst). */
export function exhibitPattern(profile: Profile, items: ShapeSpec[], date: string): Profile {
  const pattern: SavedPattern = {
    items: items.map((s) => ({ kind: s.kind, color: s.color })),
    at: date,
  };
  const old = profile.zoo.patterns ?? [];
  return {
    ...profile,
    zoo: { ...profile.zoo, patterns: [pattern, ...old].slice(0, MAX_PATTERNS) },
  };
}

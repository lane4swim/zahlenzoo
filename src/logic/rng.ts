/**
 * Startwertbasierter Zufall (mulberry32). Die Spiellogik nutzt nie Math.random(),
 * damit Aufgaben mit festem Startwert reproduzierbar und testbar sind.
 */
export type Rng = {
  /** Gleichverteilte Zahl in [0, 1). */
  next(): number;
  /** Ganze Zahl in [min, max], beide Grenzen eingeschlossen. */
  int(min: number, max: number): number;
  /** Zufälliges Element einer nicht leeren Liste. */
  pick<T>(items: readonly T[]): T;
  /** Neue, gemischte Kopie der Liste (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** true mit Wahrscheinlichkeit p. */
  chance(p: number): boolean;
};

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new RangeError(`int(${min}, ${max}): Grenzen müssen ganze Zahlen sein`);
    }
    if (max < min) throw new RangeError(`int(${min}, ${max}): max < min`);
    return min + Math.floor(next() * (max - min + 1));
  };

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError('pick(): leere Liste');
      return items[int(0, items.length - 1)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
      }
      return copy;
    },
    chance(p: number): boolean {
      return next() < p;
    },
  };
}

/** Startwert aus einem Text (FNV-1a), z. B. aus Profil und Datum. */
export function seedFromString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

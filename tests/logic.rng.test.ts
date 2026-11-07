import { describe, expect, it } from 'vitest';
import { createRng, seedFromString } from '../src/logic/rng';

describe('createRng', () => {
  it('liefert bei gleichem Startwert dieselbe Folge', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 100 }, () => a.next());
    const seqB = Array.from({ length: 100 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('liefert bei verschiedenen Startwerten verschiedene Folgen', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(Array.from({ length: 10 }, () => a.next())).not.toEqual(
      Array.from({ length: 10 }, () => b.next()),
    );
  });

  it('bleibt mit next() in [0, 1)', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const value = createRng(seed).next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('trifft mit int() beide Grenzen und bleibt im Bereich', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const value = rng.int(3, 8);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(8);
      seen.add(value);
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('verteilt int() ungefähr gleichmäßig', () => {
    const rng = createRng(123);
    const counts = new Array<number>(10).fill(0);
    const draws = 100_000;
    for (let i = 0; i < draws; i++) {
      const v = rng.int(0, 9);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    for (const count of counts) {
      expect(count / draws).toBeGreaterThan(0.09);
      expect(count / draws).toBeLessThan(0.11);
    }
  });

  it('lehnt ungültige Grenzen ab', () => {
    const rng = createRng(1);
    expect(() => rng.int(5, 4)).toThrow(RangeError);
    expect(() => rng.int(0.5, 4)).toThrow(RangeError);
  });

  it('gibt int(n, n) immer n zurück', () => {
    const rng = createRng(9);
    for (let i = 0; i < 20; i++) expect(rng.int(4, 4)).toBe(4);
  });

  it('wählt mit pick() nur Elemente der Liste und lehnt leere Listen ab', () => {
    const rng = createRng(5);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) expect(items).toContain(rng.pick(items));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('mischt mit shuffle() eine Permutation, ohne das Original zu ändern', () => {
    const rng = createRng(11);
    const items = Array.from({ length: 20 }, (_, i) => i);
    const original = [...items];
    const shuffled = rng.shuffle(items);
    expect(items).toEqual(original);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
    expect(shuffled).not.toEqual(original);
  });

  it('hält chance() an die Grenzen 0 und 1', () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });
});

describe('seedFromString', () => {
  it('ist stabil und unterscheidet Texte', () => {
    expect(seedFromString('mia-2026-11-07')).toBe(seedFromString('mia-2026-11-07'));
    expect(seedFromString('mia-2026-11-07')).not.toBe(seedFromString('mia-2026-11-08'));
  });

  it('liefert eine vorzeichenlose 32-Bit-Zahl', () => {
    const seed = seedFromString('Zahlen-Zoo');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
  });
});

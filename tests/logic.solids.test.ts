import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { areaFamilies, findArea } from '../src/logic/content';
import { frontView, hiddenCubes, mirror, sideView, total, tuckedCubes } from '../src/logic/cubes';
import { cubeBuildings, solidsBasic } from '../src/logic/generators/solids';
import { createRng } from '../src/logic/rng';
import type { Generator, Task, TaskLevel } from '../src/types/task';
import { CONTENT, paramsOf } from './helpers/content';

const SEEDS = 300;

function tasks(family: string, gen: Generator, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) => gen(level, createRng(s), `t${s}`, P(level)));
}

describe('Würfelgebäude', () => {
  // hinten: 1 0 0 / Mitte: 2 1 0 / vorn: 3 0 1
  const h = [1, 0, 0, 2, 1, 0, 3, 0, 1];

  it('Ansichten, Spiegelbild und Summe', () => {
    expect(total(h)).toBe(8);
    expect(frontView(h)).toEqual([3, 1, 1]);
    expect(sideView(h)).toEqual([3, 2, 1]);
    expect(mirror(h)).toEqual([0, 0, 1, 0, 1, 2, 1, 0, 3]);
  });

  it('verdeckte Würfel', () => {
    expect(tuckedCubes([0, 0, 0, 0, 2, 0, 0, 1, 0])).toBe(1);
    expect(hiddenCubes([0, 0, 0, 0, 2, 1, 0, 1, 0])).toBe(1);
    expect(hiddenCubes([0, 0, 0, 0, 2, 0, 0, 0, 0])).toBe(0);
  });
});

describe('Körper', () => {
  it('Sortieren: Antwort sind genau die Dinge der gesuchten Art; fehlende werden gemeldet', () => {
    for (const t of tasks('solids_basic', solidsBasic, 2)) {
      const want = t.select!.flatMap((s, i) =>
        t.prompt.textKey!.endsWith(`.${s.kind}`) ? [i] : [],
      );
      expect(t.answer).toEqual(want);
      expect(want.length).toBeGreaterThanOrEqual(2);
      expect(check(t, want.join(',')).correct).toBe(true);
      expect(check(t, want.slice(1).join(',')).errorTag).toBe('select_missing');
      expect(check(t, '').invalid).toBe(true);
    }
  });

  it('Eigenschaften: genau eine Karte passt; Ecken sichtbar gezählt wird erkannt', () => {
    for (const t of tasks('solids_basic', solidsBasic, 3)) {
      if (t.options) {
        expect(t.options.filter((o) => check(t, o.value).correct)).toHaveLength(1);
      } else if (t.prompt.textKey === 'task.prompt.solid.count.faces') {
        expect([5, 6]).toContain(t.answer);
      }
    }
    const cube = tasks('solids_basic', solidsBasic, 3).find(
      (t) => t.prompt.textKey === 'task.prompt.solid.count.corners' && t.answer === 8,
    )!;
    expect(check(cube, '7').errorTag).toBe('solid_hidden');
  });
});

describe('Würfelbauten', () => {
  it('Stufe 1: alle Würfel sichtbar, 4 bis 8 Würfel, höchstens 2 hoch', () => {
    for (const t of tasks('cube_buildings', cubeBuildings, 1)) {
      const v = t.display!.visual;
      if (v.type !== 'building') throw new Error('Gebäude erwartet');
      expect(t.answer).toBe(total(v.heights));
      expect(Math.max(...v.heights)).toBeLessThanOrEqual(2);
      expect(hiddenCubes(v.heights) + tuckedCubes(v.heights)).toBe(0);
    }
  });

  it('Stufe 2: Bauplankarten – nur der richtige Plan passt, Spiegelbild wird erkannt', () => {
    let plans = 0;
    for (const t of tasks('cube_buildings', cubeBuildings, 2)) {
      if (!t.options) continue;
      plans++;
      const right = t.options.filter((o) => check(t, o.value).correct);
      expect(right).toHaveLength(1);
      expect(right[0]!.plan).toEqual((t.display!.visual as { heights: number[] }).heights);
    }
    expect(plans).toBeGreaterThan(80);
  });

  it('Stufe 3: Bauen und Bauplan schreiben prüfen die Höhen, gespiegelt wird erkannt', () => {
    let built = 0;
    for (const t of tasks('cube_buildings', cubeBuildings, 3)) {
      if (!t.build) continue;
      built++;
      const h = t.build.target;
      expect(check(t, h.join(',')).correct).toBe(true);
      const m = mirror(h);
      if (m.join(',') !== h.join(',')) expect(check(t, m.join(',')).errorTag).toBe('plan_mirrored');
      const less = [...h];
      less[less.findIndex((v) => v > 0)]! -= 1;
      expect(check(t, less.join(',')).errorTag).toBe('cube_count');
    }
    expect(built).toBeGreaterThan(100);
  });
});

describe('Baustelle', () => {
  it('hängt am Schmetterlingshaus und gehört zu seinen Themen', () => {
    const area = findArea(CONTENT, 'schmetterlingshaus')!;
    expect(area.site).toEqual(['solids_basic', 'cube_buildings']);
    expect(areaFamilies(area)).toContain('cube_buildings');
  });
});

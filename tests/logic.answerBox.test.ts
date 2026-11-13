import { describe, expect, it } from 'vitest';
import { GENERATORS } from '../src/logic/generators';
import { createRng } from '../src/logic/rng';
import type { TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

describe('Antwortkästchen', () => {
  it('jede Aufgabe mit Ziffernblock zeigt ein Kästchen („?“), in dem die Eingabe erscheint', () => {
    const missing = new Set<string>();
    for (const [family, generate] of Object.entries(GENERATORS)) {
      for (const level of [1, 2, 3] as TaskLevel[]) {
        const params = paramsOf(family)(level);
        for (let seed = 0; seed < 60; seed++) {
          const t = generate(level, createRng(seed), 't', params);
          // andere Eingaben (Karten, Raster, Formen, Geld, Uhr) und Sachaufgaben bringen ihr Kästchen selbst mit
          const numpad =
            !t.options &&
            !t.grid &&
            !t.compose &&
            !t.select &&
            !t.build &&
            !t.money &&
            !t.clock?.set &&
            !t.match &&
            !t.line;
          if (numpad && !t.prompt.story && !t.prompt.terms.includes('?')) {
            missing.add(`${family} Stufe ${level}: ${t.prompt.textKey ?? ''}`);
          }
        }
      }
    }
    expect([...missing].sort()).toEqual([]);
  });
});

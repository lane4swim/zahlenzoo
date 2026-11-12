import { describe, expect, it } from 'vitest';
import layout from '../src/data/map-layout.json';
import { areaState } from '../src/logic/areas';
import { findArea } from '../src/logic/content';
import { CONTENT, RULES } from './helpers/content';

const area = (id: string) => findArea(CONTENT, id)!;

describe('Bereiche', () => {
  it('hat acht Bereiche mit Lage auf der Karte', () => {
    expect(CONTENT.areas).toHaveLength(8);
    for (const a of CONTENT.areas) expect(layout.areas).toHaveProperty(a.id);
    expect(Object.keys(layout.areas)).toHaveLength(8);
  });

  it('öffnet zu Beginn Affenwald und Pinguinfelsen', () => {
    const states = Object.fromEntries(CONTENT.areas.map((a) => [a.id, areaState(a, {}, RULES)]));
    expect(states).toEqual({
      affenwald: 'open',
      pinguinfelsen: 'open',
      elefantenwiese: 'locked',
      zookasse: 'locked',
      futteruhr: 'locked',
      schmetterlingshaus: 'locked',
      giraffenhof: 'locked',
      zoozaehlung: 'locked',
    });
  });

  it('öffnet den nächsten Bereich ab der Sternschwelle aus rules.json', () => {
    const needed = RULES.areaUnlockStars;
    expect(areaState(area('elefantenwiese'), { pinguinfelsen: needed - 1 }, RULES)).toBe('locked');
    expect(areaState(area('elefantenwiese'), { pinguinfelsen: needed }, RULES)).toBe('open');
    expect(areaState(area('zookasse'), { pinguinfelsen: 99 }, RULES)).toBe('locked');
    expect(areaState(area('zookasse'), { elefantenwiese: needed }, RULES)).toBe('open');
    expect(areaState(area('futteruhr'), { zookasse: needed }, RULES)).toBe('open');
    expect(areaState(area('schmetterlingshaus'), { futteruhr: needed }, RULES)).toBe('open');
    expect(areaState(area('giraffenhof'), { schmetterlingshaus: needed }, RULES)).toBe('open');
    expect(areaState(area('zoozaehlung'), { giraffenhof: needed }, RULES)).toBe('soon');
  });

  it('nutzt die Schwelle aus den Regeln', () => {
    expect(areaState(area('elefantenwiese'), { pinguinfelsen: 2 }, { areaUnlockStars: 2 })).toBe(
      'open',
    );
  });
});

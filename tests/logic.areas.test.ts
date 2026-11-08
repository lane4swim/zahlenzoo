import { describe, expect, it } from 'vitest';
import layout from '../src/data/map-layout.json';
import { AREAS, areaState, findArea } from '../src/logic/areas';

describe('Bereiche', () => {
  it('hat acht Bereiche mit Lage auf der Karte', () => {
    expect(AREAS).toHaveLength(8);
    for (const area of AREAS) expect(layout.areas).toHaveProperty(area.id);
    expect(Object.keys(layout.areas)).toHaveLength(8);
  });

  it('öffnet zu Beginn Affenwald und Pinguinfelsen', () => {
    const states = Object.fromEntries(AREAS.map((a) => [a.id, areaState(a, {})]));
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

  it('öffnet den nächsten Bereich ab 6 Sternen im Vorgänger', () => {
    const elefant = findArea('elefantenwiese')!;
    expect(areaState(elefant, { pinguinfelsen: 5 })).toBe('locked');
    expect(areaState(elefant, { pinguinfelsen: 6 })).toBe('open');
    expect(areaState(findArea('zookasse')!, { pinguinfelsen: 9 })).toBe('locked');
  });

  it('verweist nur auf vorhandene Vorgänger', () => {
    for (const area of AREAS) {
      if (area.requires) expect(findArea(area.requires), area.id).toBeDefined();
    }
  });
});

import { describe, expect, it } from 'vitest';
import layout from '../src/data/map-layout.json';
import { areaState, profileGrade, requiredArea } from '../src/logic/areas';
import { enclosures, findArea } from '../src/logic/content';
import { CONTENT, RULES } from './helpers/content';

const area = (id: string) => findArea(CONTENT, id)!;

describe('Bereiche', () => {
  it('hat neun Gehege mit Lage auf der Karte und „Wege im Zoo“ als Zusatzbereich', () => {
    const gehege = enclosures(CONTENT);
    expect(gehege).toHaveLength(9);
    for (const a of gehege) expect(layout.areas).toHaveProperty(a.id);
    expect(Object.keys(layout.areas)).toHaveLength(9);
    const extra = CONTENT.areas.filter((a) => a.extra);
    expect(extra.map((a) => a.id)).toEqual(['zooplan']);
    expect(layout.areas).not.toHaveProperty('zooplan');
  });

  it('öffnet zu Beginn Streichelzoo, Affenwald und Pinguinfelsen', () => {
    const states = Object.fromEntries(CONTENT.areas.map((a) => [a.id, areaState(a, {}, RULES)]));
    expect(states).toEqual({
      streichelzoo: 'open',
      affenwald: 'open',
      pinguinfelsen: 'open',
      elefantenwiese: 'locked',
      zookasse: 'locked',
      futteruhr: 'locked',
      schmetterlingshaus: 'locked',
      giraffenhof: 'locked',
      zoozaehlung: 'locked',
      zooplan: 'open',
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
    expect(areaState(area('zoozaehlung'), { giraffenhof: needed }, RULES)).toBe('open');
  });

  it('Klasse 1: Streichelzoo zuerst, Affenwald und Pinguinfelsen erst ab bridgeStars', () => {
    const bridge = RULES.gradeOne.bridgeStars;
    expect(areaState(area('streichelzoo'), {}, RULES, 1)).toBe('open');
    for (const id of ['affenwald', 'pinguinfelsen']) {
      expect(areaState(area(id), {}, RULES, 1), id).toBe('locked');
      expect(areaState(area(id), { streichelzoo: bridge - 1 }, RULES, 1), id).toBe('locked');
      expect(areaState(area(id), { streichelzoo: bridge }, RULES, 1), id).toBe('open');
      // Klasse 2 braucht keine Sterne im Streichelzoo
      expect(areaState(area(id), {}, RULES, 2), id).toBe('open');
    }
    // weitere Bereiche wie bisher über den Vorgänger
    expect(
      areaState(area('elefantenwiese'), { streichelzoo: bridge, pinguinfelsen: 99 }, RULES, 1),
    ).toBe('open');
    expect(requiredArea(area('affenwald'), 1)).toBe('streichelzoo');
    expect(requiredArea(area('affenwald'), 2)).toBeUndefined();
    expect(requiredArea(area('elefantenwiese'), 1)).toBe('pinguinfelsen');
  });

  it('ältere Profile ohne Klasse gehören zu Klasse 2', () => {
    expect(profileGrade({})).toBe(2);
    expect(profileGrade({ grade: 1 })).toBe(1);
    expect(profileGrade({ grade: 2 })).toBe(2);
  });

  it('nutzt die Schwelle aus den Regeln', () => {
    expect(areaState(area('elefantenwiese'), { pinguinfelsen: 2 }, { areaUnlockStars: 2 })).toBe(
      'open',
    );
  });
});

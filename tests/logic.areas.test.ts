import { describe, expect, it } from 'vitest';
import layout from '../src/data/map-layout.json';
import {
  areaMap,
  areaState,
  areaStates,
  defaultMap,
  lockReason,
  mapStars,
  profileGrade,
} from '../src/logic/areas';
import { enclosures, findArea } from '../src/logic/content';
import { CONTENT, RULES } from './helpers/content';

const area = (id: string) => findArea(CONTENT, id)!;

describe('Bereiche', () => {
  it('hat acht Gehege im großen Zoo, zwei im Streichelzoo und „Wege im Zoo“ als Zusatzbereich', () => {
    const gehege = enclosures(CONTENT);
    const zoo = gehege.filter((a) => areaMap(a) === 'zoo');
    const petting = gehege.filter((a) => areaMap(a) === 'streichelzoo');
    expect(zoo).toHaveLength(8);
    expect(petting.map((a) => a.id)).toEqual(['ziegenwiese', 'hasenstall']);
    for (const a of zoo) expect(layout.areas).toHaveProperty(a.id);
    for (const a of petting) expect(layout.streichelzoo.areas).toHaveProperty(a.id);
    expect(Object.keys(layout.areas)).toHaveLength(8);
    expect(Object.keys(layout.streichelzoo.areas)).toHaveLength(2);
    const extra = CONTENT.areas.filter((a) => a.extra);
    expect(extra.map((a) => a.id)).toEqual(['zooplan']);
    expect(layout.areas).not.toHaveProperty('zooplan');
  });

  it('öffnet zu Beginn Ziegenwiese, Affenwald und Pinguinfelsen', () => {
    const states = Object.fromEntries(CONTENT.areas.map((a) => [a.id, areaState(a, {}, RULES)]));
    expect(states).toEqual({
      ziegenwiese: 'open',
      hasenstall: 'locked',
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
    expect(areaState(area('hasenstall'), { ziegenwiese: RULES.areaUnlockStars }, RULES)).toBe(
      'open',
    );
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

  it('Klasse 1: Streichelzoo zuerst, großer Zoo erst ab bridgeStars Sternen im Streichelzoo', () => {
    const bridge = RULES.gradeOne.bridgeStars;
    expect(areaState(area('ziegenwiese'), {}, RULES, 1)).toBe('open');
    for (const id of ['affenwald', 'pinguinfelsen']) {
      expect(areaState(area(id), {}, RULES, 1, 0), id).toBe('locked');
      expect(areaState(area(id), {}, RULES, 1, bridge - 1), id).toBe('locked');
      expect(areaState(area(id), {}, RULES, 1, bridge), id).toBe('open');
      // Klasse 2 braucht keine Sterne im Streichelzoo
      expect(areaState(area(id), {}, RULES, 2), id).toBe('open');
    }
    // weitere Bereiche wie bisher über den Vorgänger
    expect(areaState(area('elefantenwiese'), { pinguinfelsen: 99 }, RULES, 1, bridge)).toBe('open');
    // Sterne aus allen Gehegen des Streichelzoos zählen zusammen
    const profile = {
      grade: 1 as const,
      areas: {
        ziegenwiese: { stars: bridge - 5, rounds: 0, levels: {}, best: {} },
        hasenstall: { stars: 5, rounds: 0, levels: {}, best: {} },
      },
    };
    expect(areaStates(CONTENT, profile).affenwald).toBe('open');
    expect(areaStates(CONTENT, { ...profile, grade: 1 as const, areas: {} }).affenwald).toBe(
      'locked',
    );
    expect(lockReason(area('affenwald'), 1, bridge - 3, RULES)).toEqual({ bridge: 3 });
    expect(lockReason(area('affenwald'), 2, 0, RULES)).toBeUndefined();
    expect(lockReason(area('hasenstall'), 1, 0, RULES)).toEqual({ requires: 'ziegenwiese' });
  });

  it('Startkarte je Klasse', () => {
    expect(defaultMap(1)).toBe('streichelzoo');
    expect(defaultMap(2)).toBe('zoo');
    expect(
      mapStars(CONTENT.areas, { ziegenwiese: 3, hasenstall: 4, affenwald: 9 }, 'streichelzoo'),
    ).toBe(7);
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

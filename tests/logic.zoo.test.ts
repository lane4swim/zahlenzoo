import { describe, expect, it } from 'vitest';
import strings from '../src/data/strings.de.json';
import { applyRoundResult, firstTryStreak } from '../src/logic/progress';
import {
  awardBadges,
  babyState,
  buyBaby,
  buyDecor,
  decorState,
  isAreaDone,
  totalStars,
} from '../src/logic/zoo';
import { createProfile } from '../src/services/save';
import type { Profile } from '../src/types/save';
import { CONTENT, RULES } from './helpers/content';

const T = strings as Record<string, string>;
const IMAGES = Object.keys(import.meta.glob('../public/assets/img/**/*.png'));
const existsSync = (path: string) => IMAGES.some((p) => p.endsWith(path.replace('public/', '/')));
const DATE = '2026-11-10';

function profileWith(edit: Partial<Profile> = {}): Profile {
  return { ...createProfile('Mia', 'owl'), ...edit };
}

const round = (p: Profile, areaId: string, family: string, level: 1 | 2 | 3, firstTry: number) =>
  applyRoundResult(
    p,
    {
      areaId,
      family,
      level,
      summary: { total: 10, firstTry, withHelp: 10 - firstTry, wrong: 0 },
      outcomes: [
        ...Array<'first_try'>(firstTry).fill('first_try'),
        ...Array<'with_help'>(10 - firstTry).fill('with_help'),
      ],
      date: DATE,
    },
    RULES,
  ).profile;

describe('Inhalte der Belohnungen', () => {
  it('haben Bilder und Texte für jede Dekoration und jedes Abzeichen', () => {
    expect(CONTENT.decor).toHaveLength(12);
    expect(CONTENT.achievements).toHaveLength(12);
    for (const d of CONTENT.decor) {
      expect(existsSync(`public/assets/img/decor/deko_${d.id}_192.png`), d.id).toBe(true);
      expect(T[`decor.${d.id}`], d.id).toBeDefined();
    }
    for (const a of CONTENT.achievements) {
      expect(existsSync(`public/assets/img/badges/abzeichen_${a.id}_256.png`), a.id).toBe(true);
      expect(T[`badge.${a.id}`], a.id).toBeDefined();
      expect(T[`badge.${a.id}.how`], a.id).toBeDefined();
    }
    for (const animal of Object.keys(CONTENT.animals)) {
      expect(T[`baby.${animal}`], animal).toBeDefined();
    }
  });
});

describe('Sterne einlösen', () => {
  it('kauft Baby-Tiere erst in erreichten Bereichen und mit genug Sternen', () => {
    let p = profileWith({ stars: 4 });
    expect(babyState(CONTENT, p, 'monkey')).toBe('tooExpensive');
    expect(babyState(CONTENT, p, 'elephant')).toBe('locked');
    expect(() => buyBaby(CONTENT, p, 'monkey', 'Momo')).toThrow();
    p = { ...p, stars: 7 };
    expect(babyState(CONTENT, p, 'monkey')).toBe('buyable');
    p = buyBaby(CONTENT, p, 'monkey', '  Momo ');
    expect(p.stars).toBe(2);
    expect(p.zoo.babies).toEqual([{ animal: 'monkey', name: 'Momo' }]);
    expect(babyState(CONTENT, p, 'monkey')).toBe('owned');
    expect(() => buyBaby(CONTENT, { ...p, stars: 20 }, 'monkey', 'Zwei')).toThrow();
    expect(() => buyBaby(CONTENT, { ...p, stars: 20 }, 'penguin', ' ')).toThrow();
  });

  it('kauft jede Dekoration einmal; die Sterne der Bereiche bleiben', () => {
    let p = round(profileWith(), 'pinguinfelsen', 'add_100', 1, 10);
    p = { ...p, stars: 10 };
    const before = totalStars(p);
    p = buyDecor(CONTENT, p, 'bank');
    expect(p.stars).toBe(10 - CONTENT.decor.find((d) => d.id === 'bank')!.price);
    expect(decorState(CONTENT, p, 'bank')).toBe('owned');
    expect(totalStars(p)).toBe(before);
    expect(() => buyDecor(CONTENT, p, 'bank')).toThrow();
    expect(() => buyDecor(CONTENT, { ...p, stars: 0 }, 'brunnen')).toThrow();
  });
});

describe('Gehege fertig', () => {
  it('wenn jedes Thema in Stufe 3 mit mindestens 2 Sternen gespielt wurde', () => {
    const area = CONTENT.areas.find((a) => a.id === 'elefantenwiese')!;
    let p = round(profileWith(), 'elefantenwiese', 'mult_table', 3, 10);
    expect(isAreaDone(area, p.areas.elefantenwiese)).toBe(false);
    p = round(p, 'elefantenwiese', 'story_multdiv', 3, 2);
    expect(isAreaDone(area, p.areas.elefantenwiese)).toBe(false);
    p = round(p, 'elefantenwiese', 'divide_rest', 3, 8);
    p = round(p, 'elefantenwiese', 'double_half', 3, 9);
    expect(isAreaDone(area, p.areas.elefantenwiese)).toBe(false);
    p = round(p, 'elefantenwiese', 'divide_share', 3, 7);
    expect(isAreaDone(area, p.areas.elefantenwiese)).toBe(true);
    // Eine schwächere Runde danach nimmt nichts weg.
    p = round(p, 'elefantenwiese', 'mult_table', 3, 0);
    expect(isAreaDone(area, p.areas.elefantenwiese)).toBe(true);
    expect(p.areas.elefantenwiese!.best.mult_table).toEqual({ '3': 3 });
  });
});

describe('Abzeichen', () => {
  it('zählt die längste Folge im ersten Versuch', () => {
    expect(firstTryStreak(['first_try', 'first_try', 'with_help', 'first_try'])).toBe(2);
    expect(firstTryStreak([])).toBe(0);
  });

  it('verleiht Abzeichen einmal und behält sie', () => {
    let p = round(profileWith(), 'affenwald', 'neighbors_100', 1, 10);
    let r = awardBadges(CONTENT, p, DATE, { stars: 3, streak: 10 });
    expect(r.earned.sort()).toEqual(['drei_sterne', 'erste_runde', 'fuenf_ohne_hilfe']);
    p = r.profile;
    expect(p.badges.erste_runde).toBe(DATE);
    r = awardBadges(CONTENT, p, '2026-12-01', { stars: 1, streak: 0 });
    expect(r.earned).toEqual([]);
    expect(r.profile.badges.drei_sterne).toBe(DATE);
  });

  it('prüft Stufe 3, Themen, Durchhalten, Sterne und Baby-Tiere', () => {
    let p = profileWith();
    for (let i = 0; i < 3; i++) p = round(p, 'zookasse', 'money_lay', 3, 4);
    p = round(p, 'futteruhr', 'clock_half', 3, 10);
    p = { ...p, stars: 10 };
    p = buyBaby(CONTENT, p, 'monkey', 'Momo');
    const { earned } = awardBadges(CONTENT, p, DATE);
    expect(earned).toEqual(
      expect.arrayContaining(['stufe_3', 'geld', 'uhr', 'drangeblieben', 'baby']),
    );
    expect(earned).not.toContain('einmaleins');
    expect(earned).not.toContain('drei_sterne');

    const rich = {
      ...p,
      areas: { ...p.areas, affenwald: { stars: 100, rounds: 30, levels: {}, best: {} } },
    };
    expect(awardBadges(CONTENT, rich, DATE).earned).toEqual(
      expect.arrayContaining(['sterne_25', 'sterne_100']),
    );
  });
});

import { describe, expect, it } from 'vitest';
import { dailyPlan } from '../src/logic/daily';
import { familyOverview, parentGate } from '../src/logic/parent';
import { applyDailyResult, applyRoundResult } from '../src/logic/progress';
import { createRng } from '../src/logic/rng';
import {
  confidence,
  daysBetween,
  explainDue,
  formatTime,
  tempoOffered,
  topError,
  updateSkill,
} from '../src/logic/skills';
import { createProfile } from '../src/services/save';
import type { AnswerOutcome } from '../src/types/round';
import type { Profile, SkillState } from '../src/types/save';
import { CONTENT, RULES } from './helpers/content';

const F: AnswerOutcome = 'first_try';
const H: AnswerOutcome = 'with_help';
const W: AnswerOutcome = 'wrong';
const rep = (o: AnswerOutcome, n: number) => Array<AnswerOutcome>(n).fill(o);

describe('Sicherheit', () => {
  it('gewichtet neuere Antworten stärker', () => {
    expect(confidence([])).toBeUndefined();
    expect(confidence([1, 1, 1])).toBe(1);
    // alt falsch, neu richtig > alt richtig, neu falsch
    expect(confidence([0, 1])!).toBeGreaterThan(confidence([1, 0])!);
    expect(confidence([0, 1])).toBeCloseTo(2 / 3);
    expect(confidence([1, 0.5])).toBeCloseTo((1 + 1) / 3);
  });
});

describe('Stufenwechsel (Antwortfolgen)', () => {
  const day = '2026-11-12';
  it('steigt bei hoher Sicherheit erst ab 8 Antworten', () => {
    let r = updateSkill(undefined, { level: 1, outcomes: rep(F, 7), date: day }, RULES);
    expect(r.change).toBeUndefined();
    expect(r.skill.level).toBe(1);
    r = updateSkill(r.skill, { level: 1, outcomes: [F], date: day }, RULES);
    expect(r.change).toBe('up');
    expect(r.skill.level).toBe(2);
    expect(r.skill.last).toEqual([]);
  });

  it('steigt nicht, wenn zu oft Hilfe nötig war', () => {
    const r = updateSkill(
      undefined,
      { level: 1, outcomes: [F, H, F, H, F, H, F, H, F, H], date: day },
      RULES,
    );
    expect(r.change).toBeUndefined();
  });

  it('sinkt, wenn die letzten 6 Antworten unsicher sind, und schaltet Hilfen an', () => {
    let r = updateSkill(undefined, { level: 2, outcomes: [W, H, W, W], date: day }, RULES);
    expect(r.change).toBeUndefined(); // noch keine 6 Antworten
    r = updateSkill(r.skill, { level: 2, outcomes: [W, H], date: day }, RULES);
    expect(r.change).toBe('down');
    expect(r.skill.level).toBe(1);
    expect(r.skill.support).toBe(true);
  });

  it('sinkt nicht unter Stufe 1 und steigt nicht über die höchste Stufe', () => {
    expect(
      updateSkill(undefined, { level: 1, outcomes: rep(W, 8), date: day }, RULES).skill.level,
    ).toBe(1);
    expect(
      updateSkill(undefined, { level: 3, outcomes: rep(F, 10), date: day }, RULES).skill.level,
    ).toBe(3);
  });

  it('Hilfen enden, sobald es wieder sicher klappt', () => {
    const down = updateSkill(undefined, { level: 2, outcomes: rep(W, 6), date: day }, RULES).skill;
    expect(down.support).toBe(true);
    const back = updateSkill(down, { level: 1, outcomes: [F, F, F, H], date: day }, RULES).skill;
    expect(back.support).toBeUndefined();
  });

  it('eine andere Stufe gespielt: Liste beginnt neu', () => {
    const a = updateSkill(undefined, { level: 1, outcomes: [F, F, F], date: day }, RULES).skill;
    const b = updateSkill(a, { level: 2, outcomes: [H], date: day }, RULES).skill;
    expect(b.level).toBe(2);
    expect(b.last).toEqual([0.5]);
  });

  it('applyRoundResult: Aufstieg im Modell schaltet die Stufe im Gehege frei', () => {
    const base = createProfile('Mia', 'penguin');
    const result = (outcomes: AnswerOutcome[]) => ({
      areaId: 'pinguinfelsen',
      family: 'add_100',
      level: 1 as const,
      summary: { total: outcomes.length, firstTry: 2, withHelp: 0, wrong: outcomes.length - 2 },
      outcomes,
      date: day,
    });
    // wenige Sterne (keine Freischaltung über Sterne), aber im Modell sicher
    let p: Profile = applyRoundResult(base, result(rep(F, 5)), RULES).profile;
    const r = applyRoundResult(p, result(rep(F, 4)), RULES);
    p = r.profile;
    expect(r.reward.skillChange).toBe('up');
    expect(r.reward.skillLevel).toBe(2);
    expect(p.areas.pinguinfelsen!.levels.add_100).toBe(2);
  });
});

describe('Fehlerhäufung und Übersicht', () => {
  it('dreimal derselbe Fehler: Erklärung genau beim dritten Mal', () => {
    expect(explainDue(['a', 'b', 'a'], 'a', 3)).toBe(false);
    expect(explainDue(['a', 'b', 'a', 'a'], 'a', 3)).toBe(true);
    expect(explainDue(['a', 'a', 'a', 'a'], 'a', 3)).toBe(false);
  });

  it('zählt Fehlerarten und nennt die häufigste', () => {
    const s = updateSkill(
      undefined,
      { level: 1, outcomes: [W, W, F], date: '2026-11-12', errors: ['carry', 'ones_off', 'carry'] },
      RULES,
    ).skill;
    expect(s.errors).toEqual({ carry: 2, ones_off: 1 });
    expect(topError(s)).toBe('carry');
  });

  it('Übersicht: zuletzt geübt zuerst, mit Sicherheit und Fehlerart', () => {
    const p = createProfile('Ben', 'owl');
    p.skills = {
      add_100: { level: 2, last: [1, 1, 0], lastPlayed: '2026-11-10', errors: { carry: 3 } },
      mult_core: { level: 1, last: [], lastPlayed: '2026-11-12' },
    };
    const rows = familyOverview(p);
    expect(rows.map((r) => r.family)).toEqual(['mult_core', 'add_100']);
    expect(rows[1]!.confidence).toBeCloseTo(0.5);
    expect(rows[1]!.topError).toBe('carry');
    expect(rows[0]!.confidence).toBeUndefined();
  });

  it('Zugangsaufgabe für Erwachsene', () => {
    for (let s = 0; s < 50; s++) {
      const g = parentGate(createRng(s));
      expect(g.answer).toBe(g.a * g.b);
      expect(g.answer).toBeGreaterThan(70);
    }
  });
});

describe('Tagesfutter', () => {
  const today = '2026-11-20';
  it('wählt Themen mit langer Pause, dann mit niedriger Sicherheit, dann neue', () => {
    const p = createProfile('Mia', 'penguin');
    p.skills = {
      add_100: { level: 2, last: [1, 1, 1, 1], lastPlayed: '2026-11-01' }, // 19 Tage Pause
      sub_100: { level: 1, last: [0, 0, 1], lastPlayed: '2026-11-19' }, // unsicher
      mult_core: { level: 1, last: [1, 1, 1], lastPlayed: '2026-11-19' }, // sicher, Elefantenwiese noch zu
    };
    const plan = dailyPlan(CONTENT, p, today);
    expect(plan).toHaveLength(RULES.skill.dailyTasks);
    expect(plan[0]).toMatchObject({ family: 'add_100', level: 2, areaId: 'pinguinfelsen' });
    expect(plan[1]!.family).toBe('sub_100');
    expect(plan.map((i) => i.family)).not.toContain('mult_core');
    expect(new Set(plan.map((i) => i.family)).size).toBe(plan.length);
  });

  it('trägt das Ergebnis ins Profil ein: Sterne, Kompetenzmodell, Datum', () => {
    const p = createProfile('Mia', 'penguin');
    const { profile, stars } = applyDailyResult(
      p,
      {
        items: [
          { family: 'add_100', level: 1, outcome: F, time: 4000 },
          { family: 'sub_100', level: 1, outcome: W, error: 'carry' },
        ],
        summary: { total: 2, firstTry: 1, withHelp: 0, wrong: 1 },
        date: today,
      },
      RULES,
    );
    expect(stars).toBeGreaterThanOrEqual(1);
    expect(profile.stars).toBe(stars);
    expect(profile.dailyDone).toBe(today);
    expect(profile.skills.add_100!.times).toEqual([4000]);
    expect(profile.skills.sub_100!.errors).toEqual({ carry: 1 });
    expect(profile.areas).toEqual({});
  });
});

describe('Tempo-Runde', () => {
  it('erst ab Stufe 2 und bei hoher Sicherheit', () => {
    expect(tempoOffered({ level: 1, last: [1, 1, 1, 1, 1], lastPlayed: 'x' }, RULES)).toBe(false);
    expect(tempoOffered({ level: 2, last: [1, 1, 1, 1, 1], lastPlayed: 'x' }, RULES)).toBe(true);
    expect(tempoOffered({ level: 2, last: [1, 0, 1, 0, 1], lastPlayed: 'x' }, RULES)).toBe(false);
    // langsamer als sonst: nicht anbieten
    const slow: SkillState = {
      level: 3,
      last: [1, 1, 1, 1],
      lastPlayed: 'x',
      times: [3000, 3000, 3000, 3000, 3000, 9000, 9000, 9000, 9000, 9000],
    };
    expect(tempoOffered(slow, RULES)).toBe(false);
  });

  it('merkt sich die Bestzeit und formatiert Zeiten', () => {
    const a = updateSkill(
      undefined,
      { level: 2, outcomes: [F], date: 'x', tempoMs: 90_000 },
      RULES,
    ).skill;
    const b = updateSkill(a, { level: 2, outcomes: [F], date: 'x', tempoMs: 120_000 }, RULES).skill;
    expect(b.tempoBest).toBe(90_000);
    expect(formatTime(83_400)).toBe('1:23');
    expect(daysBetween('2026-11-01', '2026-11-20')).toBe(19);
  });
});

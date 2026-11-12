import { starsForRound, unlockedLevelAfter } from './rewards';
import type { Rules } from '../types/content';
import type { AnswerOutcome, RoundSummary } from '../types/round';
import { updateSkill, type SkillChange } from './skills';
import type { AreaProgress, Profile } from '../types/save';
import type { TaskLevel } from '../types/task';

export type RoundResult = {
  areaId: string;
  family: string;
  level: TaskLevel;
  summary: RoundSummary;
  /** Ergebnisse der Aufgaben dieser Familie in der Reihenfolge der Runde */
  outcomes: readonly AnswerOutcome[];
  /** JJJJ-MM-TT */
  date: string;
  /** Fehlerarten der Runde (für Übersicht und Erklärungen) */
  errors?: readonly string[];
  /** Antwortzeiten in ms der im ersten Versuch richtigen Aufgaben */
  times?: readonly number[];
  /** Dauer einer Tempo-Runde in ms */
  tempoMs?: number;
};

export type RoundReward = {
  stars: 1 | 2 | 3;
  unlockedLevel: TaskLevel;
  levelUnlocked: boolean;
  /** Kompetenzmodell: Stufe gestiegen oder gesunken, und die Stufe für das nächste Mal */
  skillChange?: SkillChange;
  skillLevel: TaskLevel;
  /** neue Bestzeit in der Tempo-Runde */
  tempoRecord?: boolean;
};

/** Längste Folge von Aufgaben, die im ersten Versuch gelöst wurden. */
export function firstTryStreak(outcomes: readonly AnswerOutcome[]): number {
  let best = 0;
  let run = 0;
  for (const o of outcomes) {
    run = o === 'first_try' ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Trägt eine beendete Runde in ein Profil ein: Sterne, Stufen, beste Sterne, Zähler. */
export function applyRoundResult(
  profile: Profile,
  result: RoundResult,
  rules: Rules,
): { profile: Profile; reward: RoundReward } {
  const stars = starsForRound(result.summary, rules);
  const area: AreaProgress = profile.areas[result.areaId] ?? {
    stars: 0,
    rounds: 0,
    levels: {},
    best: {},
  };
  const familyBest = area.best[result.family] ?? {};
  const levelKey = String(result.level);
  const withHelp = result.outcomes.filter((o) => o === 'with_help').length;
  const before = area.levels[result.family] ?? 1;
  const prevSkill = profile.skills[result.family];
  const { skill, change } = updateSkill(
    prevSkill,
    {
      level: result.level,
      outcomes: result.outcomes,
      date: result.date,
      ...(result.errors ? { errors: result.errors } : {}),
      ...(result.times ? { times: result.times } : {}),
      ...(result.tempoMs !== undefined ? { tempoMs: result.tempoMs } : {}),
    },
    rules,
  );
  // Steigt die Stufe im Kompetenzmodell, ist sie auch im Gehege frei.
  const byStars = unlockedLevelAfter(before, result.level, stars, rules);
  const unlockedLevel = (change === 'up' ? Math.max(byStars, skill.level) : byStars) as TaskLevel;
  const tempoRecord =
    result.tempoMs !== undefined &&
    (prevSkill?.tempoBest === undefined || result.tempoMs < prevSkill.tempoBest);

  return {
    profile: {
      ...profile,
      stars: profile.stars + stars,
      areas: {
        ...profile.areas,
        [result.areaId]: {
          stars: area.stars + stars,
          rounds: area.rounds + 1,
          levels: { ...area.levels, [result.family]: unlockedLevel },
          best: {
            ...area.best,
            [result.family]: {
              ...familyBest,
              [levelKey]: Math.max(familyBest[levelKey] ?? 0, stars),
            },
          },
        },
      },
      stats: {
        rounds: profile.stats.rounds + 1,
        withHelp: profile.stats.withHelp + withHelp,
        bestStreak: Math.max(profile.stats.bestStreak, firstTryStreak(result.outcomes)),
      },
      skills: {
        ...profile.skills,
        [result.family]: skill,
      },
    },
    reward: {
      stars,
      unlockedLevel,
      levelUnlocked: unlockedLevel > before,
      skillLevel: skill.level,
      ...(change ? { skillChange: change } : {}),
      ...(tempoRecord ? { tempoRecord } : {}),
    },
  };
}

export type DailyResult = {
  /** je Aufgabe: Familie, Stufe, Ergebnis, Fehlerart und Zeit (falls vorhanden) */
  items: ReadonlyArray<{
    family: string;
    level: TaskLevel;
    outcome: AnswerOutcome;
    error?: string;
    time?: number;
  }>;
  summary: RoundSummary;
  date: string;
};

/**
 * Tagesfutter eintragen: Sterne aufs Konto (nicht in ein Gehege), Kompetenzmodell je Familie,
 * Zähler und das Datum, damit das Menü „heute schon gefüttert“ zeigen kann.
 */
export function applyDailyResult(
  profile: Profile,
  result: DailyResult,
  rules: Rules,
): { profile: Profile; stars: 1 | 2 | 3 } {
  const stars = starsForRound(result.summary, rules);
  const skills = { ...profile.skills };
  for (const family of new Set(result.items.map((i) => i.family))) {
    const items = result.items.filter((i) => i.family === family);
    skills[family] = updateSkill(
      skills[family],
      {
        level: skills[family]?.level ?? items[0]!.level,
        outcomes: items.map((i) => i.outcome),
        date: result.date,
        errors: items.flatMap((i) => (i.error ? [i.error] : [])),
        times: items.flatMap((i) => (i.time !== undefined ? [i.time] : [])),
      },
      rules,
    ).skill;
  }
  const outcomes = result.items.map((i) => i.outcome);
  return {
    stars,
    profile: {
      ...profile,
      stars: profile.stars + stars,
      skills,
      dailyDone: result.date,
      stats: {
        rounds: profile.stats.rounds + 1,
        withHelp: profile.stats.withHelp + outcomes.filter((o) => o === 'with_help').length,
        bestStreak: Math.max(profile.stats.bestStreak, firstTryStreak(outcomes)),
      },
    },
  };
}

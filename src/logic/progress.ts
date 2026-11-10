import { starsForRound, unlockedLevelAfter } from './rewards';
import type { Rules } from '../types/content';
import type { AnswerOutcome, RoundSummary } from '../types/round';
import type { AnswerScore, AreaProgress, Profile, SkillState } from '../types/save';
import type { TaskLevel } from '../types/task';

const SCORE: Record<AnswerOutcome, AnswerScore> = { first_try: 1, with_help: 0.5, wrong: 0 };

export type RoundResult = {
  areaId: string;
  family: string;
  level: TaskLevel;
  summary: RoundSummary;
  /** Ergebnisse der Aufgaben dieser Familie in der Reihenfolge der Runde */
  outcomes: readonly AnswerOutcome[];
  /** JJJJ-MM-TT */
  date: string;
};

export type RoundReward = {
  stars: 1 | 2 | 3;
  unlockedLevel: TaskLevel;
  levelUnlocked: boolean;
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
  const unlockedLevel = unlockedLevelAfter(before, result.level, stars, rules);
  const skill: SkillState = profile.skills[result.family] ?? {
    level: result.level,
    last: [],
    lastPlayed: result.date,
  };
  const last = [...skill.last, ...result.outcomes.map((o) => SCORE[o])].slice(-rules.skillHistory);

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
        [result.family]: { level: result.level, last, lastPlayed: result.date },
      },
    },
    reward: { stars, unlockedLevel, levelUnlocked: unlockedLevel > before },
  };
}

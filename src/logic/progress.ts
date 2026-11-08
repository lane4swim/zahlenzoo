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

/** Trägt eine beendete Runde in ein Profil ein: Sterne, Stufen, Antwortliste. */
export function applyRoundResult(
  profile: Profile,
  result: RoundResult,
  rules: Rules,
): { profile: Profile; reward: RoundReward } {
  const stars = starsForRound(result.summary, rules);
  const area: AreaProgress = profile.areas[result.areaId] ?? { stars: 0, rounds: 0, levels: {} };
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
        },
      },
      skills: {
        ...profile.skills,
        [result.family]: { level: result.level, last, lastPlayed: result.date },
      },
    },
    reward: { stars, unlockedLevel, levelUnlocked: unlockedLevel > before },
  };
}

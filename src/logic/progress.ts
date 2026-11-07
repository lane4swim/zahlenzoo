import { starsForRound, unlockedLevelAfter } from './rewards';
import type { AnswerOutcome, RoundSummary } from '../types/round';
import type { AnswerScore, AreaProgress, Profile, SkillState } from '../types/save';
import type { TaskLevel } from '../types/task';

const SCORE: Record<AnswerOutcome, AnswerScore> = { first_try: 1, with_help: 0.5, wrong: 0 };
const SKILL_HISTORY = 10;

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
): { profile: Profile; reward: RoundReward } {
  const stars = starsForRound(result.summary);
  const area: AreaProgress = profile.areas[result.areaId] ?? {
    stars: 0,
    unlockedLevel: 1,
    rounds: 0,
  };
  const unlockedLevel = unlockedLevelAfter(area.unlockedLevel, result.level, stars);
  const skill: SkillState = profile.skills[result.family] ?? {
    level: result.level,
    last: [],
    lastPlayed: result.date,
  };
  const last = [...skill.last, ...result.outcomes.map((o) => SCORE[o])].slice(-SKILL_HISTORY);

  return {
    profile: {
      ...profile,
      stars: profile.stars + stars,
      areas: {
        ...profile.areas,
        [result.areaId]: { stars: area.stars + stars, unlockedLevel, rounds: area.rounds + 1 },
      },
      skills: {
        ...profile.skills,
        [result.family]: { level: result.level, last, lastPlayed: result.date },
      },
    },
    reward: { stars, unlockedLevel, levelUnlocked: unlockedLevel > area.unlockedLevel },
  };
}

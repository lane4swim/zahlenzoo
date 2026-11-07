import type { RoundSummary } from '../types/round';
import type { TaskLevel } from '../types/task';

/** Sterne pro Runde (Spezifikation, Abschnitt 8). */
export function starsForRound(summary: RoundSummary): 1 | 2 | 3 {
  if (summary.total === 0) return 1;
  if (summary.firstTry / summary.total >= 0.9) return 3;
  if ((summary.firstTry + summary.withHelp) / summary.total >= 0.7) return 2;
  return 1;
}

/** Die nächste Stufe öffnet nach einer Runde mit mindestens 2 Sternen. */
export function unlockedLevelAfter(
  unlocked: TaskLevel,
  playedLevel: TaskLevel,
  stars: number,
): TaskLevel {
  if (stars < 2 || playedLevel < unlocked) return unlocked;
  return Math.min(3, playedLevel + 1) as TaskLevel;
}

/** Sterne, die ein Bereich braucht, damit der nächste öffnet. */
export const STARS_TO_UNLOCK_NEXT_AREA = 6;

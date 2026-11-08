import type { Rules } from '../types/content';
import type { RoundSummary } from '../types/round';
import type { TaskLevel } from '../types/task';

/** Sterne pro Runde (Spezifikation, Abschnitt 8; Schwellen aus rules.json). */
export function starsForRound(summary: RoundSummary, rules: Pick<Rules, 'stars'>): 1 | 2 | 3 {
  if (summary.total === 0) return 1;
  if (summary.firstTry / summary.total >= rules.stars.three) return 3;
  if ((summary.firstTry + summary.withHelp) / summary.total >= rules.stars.two) return 2;
  return 1;
}

/** Die nächste Stufe öffnet nach einer Runde mit genug Sternen in der höchsten offenen Stufe. */
export function unlockedLevelAfter(
  unlocked: TaskLevel,
  playedLevel: TaskLevel,
  stars: number,
  rules: Pick<Rules, 'levelUnlockStars' | 'maxLevel'>,
): TaskLevel {
  if (stars < rules.levelUnlockStars || playedLevel < unlocked) return unlocked;
  return Math.min(rules.maxLevel, playedLevel + 1) as TaskLevel;
}

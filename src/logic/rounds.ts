import type { AnswerOutcome, RoundSummary } from '../types/round';
import type { Task } from '../types/task';

/** Unveränderlicher Zustand einer Runde. */
export type Round = {
  readonly tasks: readonly Task[];
  readonly outcomes: readonly AnswerOutcome[];
};

export function createRound(tasks: readonly Task[]): Round {
  if (tasks.length === 0) throw new RangeError('createRound(): Runde ohne Aufgaben');
  const ids = new Set(tasks.map((task) => task.id));
  if (ids.size !== tasks.length) throw new RangeError('createRound(): doppelte Aufgaben-IDs');
  return { tasks: [...tasks], outcomes: [] };
}

export function isFinished(round: Round): boolean {
  return round.outcomes.length >= round.tasks.length;
}

export function currentTask(round: Round): Task | undefined {
  return round.tasks[round.outcomes.length];
}

export function recordOutcome(round: Round, outcome: AnswerOutcome): Round {
  if (isFinished(round)) throw new RangeError('recordOutcome(): Runde ist schon beendet');
  return { tasks: round.tasks, outcomes: [...round.outcomes, outcome] };
}

export function progress(round: Round): { done: number; total: number } {
  return { done: round.outcomes.length, total: round.tasks.length };
}

export function summarize(round: Round): RoundSummary {
  const count = (outcome: AnswerOutcome) => round.outcomes.filter((o) => o === outcome).length;
  return {
    total: round.tasks.length,
    firstTry: count('first_try'),
    withHelp: count('with_help'),
    wrong: count('wrong'),
  };
}

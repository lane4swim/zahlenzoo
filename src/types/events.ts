import type { RoundSummary } from './round';
import type { TaskInput } from './task';

/** Die wenigen Phaser-Ereignisse zwischen UI-Bausteinen und Szenen (Spezifikation, Abschnitt 4). */
export const GameEvent = {
  AnswerSubmitted: 'answer-submitted',
  RoundFinished: 'round-finished',
} as const;

export type AnswerSubmittedPayload = { taskId: string; input: TaskInput };

export type RoundFinishedPayload = { areaId: string; summary: RoundSummary };

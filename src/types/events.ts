import type { RoundEndSceneData } from './scenes';
import type { TaskInput } from './task';

/** Die wenigen Phaser-Ereignisse zwischen UI-Bausteinen und Szenen (Spezifikation, Abschnitt 4). */
export const GameEvent = {
  AnswerSubmitted: 'answer-submitted',
  RoundFinished: 'round-finished',
} as const;

export type AnswerSubmittedPayload = { taskId: string; input: TaskInput };

export type RoundFinishedPayload = RoundEndSceneData;

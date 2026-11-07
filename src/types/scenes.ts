import type { AnswerOutcome, RoundSummary } from './round';
import type { TaskLevel } from './task';

/** Schlüssel aller Szenen. */
export const SceneKey = {
  Boot: 'Boot',
  Profile: 'Profile',
  ProfileCreate: 'ProfileCreate',
  Menu: 'Menu',
  Map: 'Map',
  Area: 'Area',
  Task: 'Task',
  RoundEnd: 'RoundEnd',
  Parent: 'Parent',
  Settings: 'Settings',
} as const;

export type AreaSceneData = { areaId: string };
export type TaskSceneData = { areaId: string; level: TaskLevel };
export type RoundEndSceneData = {
  areaId: string;
  family: string;
  level: TaskLevel;
  summary: RoundSummary;
  outcomes: AnswerOutcome[];
  /** Strategie und Ergebnis je Aufgabe für den Rückblick */
  strategies: Array<{ strategyId: string; outcome: AnswerOutcome }>;
};

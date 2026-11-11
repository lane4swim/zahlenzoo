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
  Zoo: 'Zoo',
} as const;

/** Zoo-Laden: gewählter Reiter; back: Szene, zu der „Zurück“ führt */
export type ZooTab = 'babies' | 'decor' | 'badges';
export type ZooSceneData = { tab?: ZooTab; back?: 'Menu' | 'Map'; message?: string };

/** family: zuletzt gewähltes Thema im Gehege (bei mehreren Aufgabenfamilien) */
export type AreaSceneData = { areaId: string; family?: string };
export type TaskSceneData = { areaId: string; family: string; level: TaskLevel };
export type RoundEndSceneData = {
  areaId: string;
  family: string;
  level: TaskLevel;
  summary: RoundSummary;
  outcomes: AnswerOutcome[];
  /** Strategie und Ergebnis je Aufgabe für den Rückblick */
  strategies: Array<{ strategyId: string; outcome: AnswerOutcome }>;
};

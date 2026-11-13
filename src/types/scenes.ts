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
  Pattern: 'Pattern',
} as const;

/** Zoo-Laden: gewählter Reiter; back: Szene, zu der „Zurück“ führt */
export type ZooTab = 'babies' | 'decor' | 'badges' | 'patterns';
export type ZooSceneData = { tab?: ZooTab; back?: 'Menu' | 'Map'; message?: string };

/** family: zuletzt gewähltes Thema im Gehege (bei mehreren Aufgabenfamilien) */
export type AreaSceneData = { areaId: string; family?: string };
/** Muster erfinden: Bereich, in dessen Gehege „Zurück“ führt */
export type PatternSceneData = { areaId: string };
/** daily: Tagesfutter (gemischte Runde); tempo: Tempo-Runde mit Stoppuhr */
export type TaskSceneData = {
  areaId: string;
  family: string;
  level: TaskLevel;
  daily?: boolean;
  tempo?: boolean;
};
export type RoundEndSceneData = {
  areaId: string;
  family: string;
  level: TaskLevel;
  summary: RoundSummary;
  outcomes: AnswerOutcome[];
  /** Strategie und Ergebnis je Aufgabe für den Rückblick */
  strategies: Array<{ strategyId: string; outcome: AnswerOutcome }>;
  /** Fehlerarten und Antwortzeiten (ms, im ersten Versuch richtig) der Runde */
  errors?: string[];
  times?: number[];
  /** Tempo-Runde: Dauer in ms */
  tempoMs?: number;
  /** Erklärfrage: Rechnung der Runde, die das Kind einer Person erklären soll */
  explain?: string;
  /** Tagesfutter: Ergebnis je Aufgabe */
  daily?: Array<{
    family: string;
    level: TaskLevel;
    outcome: AnswerOutcome;
    error?: string;
    time?: number;
  }>;
};

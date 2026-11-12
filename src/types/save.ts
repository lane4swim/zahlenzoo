import type { ShapeSpec, TaskLevel } from './task';

/** 1 = richtig im ersten Versuch, 0.5 = richtig mit Hilfe, 0 = falsch. */
export type AnswerScore = 1 | 0.5 | 0;

export type SkillState = {
  level: TaskLevel;
  /** die letzten 10 Antworten, älteste zuerst */
  last: AnswerScore[];
  /** Datum der letzten Übung, JJJJ-MM-TT */
  lastPlayed: string;
  /** nach einem Stufenabstieg: mehr Bilder und Hilfen, bis es wieder sicher klappt */
  support?: boolean;
  /** Fehlerarten mit Anzahl (für die Übersicht der Erwachsenen) */
  errors?: Record<string, number>;
  /** Antwortzeiten in ms der letzten im ersten Versuch richtigen Antworten */
  times?: number[];
  /** beste Zeit einer Tempo-Runde in ms */
  tempoBest?: number;
};

export type AreaProgress = {
  /** insgesamt gesammelte Sterne */
  stars: number;
  rounds: number;
  /** höchste freigeschaltete Stufe je Aufgabenfamilie (fehlt: Stufe 1) */
  levels: Record<string, TaskLevel>;
  /** beste Sterne einer Runde je Familie und Stufe, z. B. { add_100: { "3": 2 } } */
  best: Record<string, Record<string, number>>;
};

/** Baby-Tier im Zoo: Tierart (Schlüssel in animals.json) und vom Kind gewählter Name. */
export type Baby = { animal: string; name: string };

/** Zähler über alle Runden (für Abzeichen; nichts davon geht verloren). */
export type ProfileStats = {
  rounds: number;
  /** Aufgaben, die mit Hilfe gelöst wurden (Durchhalten) */
  withHelp: number;
  /** längste Folge von Aufgaben im ersten Versuch innerhalb einer Runde */
  bestStreak: number;
};

export type Settings = {
  music: number;
  sfx: number;
  readAloud: boolean;
  largeText: boolean;
  /** „Wie hast du gerechnet?“: aus, manchmal (Startwert aus rules.json) oder oft */
  strategyAsk?: 'off' | 'sometimes' | 'often';
};

export const AVATARS = [
  'monkey',
  'penguin',
  'elephant',
  'parrot',
  'owl',
  'butterfly',
  'giraffe',
  'meerkat',
] as const;
export type Avatar = (typeof AVATARS)[number];

/** Selbst erfundenes Muster (Schmetterlingshaus), ausgestellt im Zoo. */
export type SavedPattern = { items: ShapeSpec[]; at: string };

export type Profile = {
  id: string;
  nickname: string;
  avatar: Avatar;
  createdAt: string;
  /** Sterne zum Einlösen (die Sterne der Bereiche für die Freischaltung bleiben erhalten) */
  stars: number;
  /** patterns: im Zoo ausgestellte, selbst erfundene Muster (neuestes zuerst) */
  zoo: { babies: Baby[]; decor: string[]; patterns?: SavedPattern[] };
  /** gewählte Rechenwege je Familie („Wie hast du gerechnet?“), für den Erwachsenenbereich */
  strategyUse?: Record<string, Record<string, number>>;
  /** verdiente Abzeichen mit Datum (JJJJ-MM-TT) */
  badges: Record<string, string>;
  stats: ProfileStats;
  areas: Record<string, AreaProgress>;
  skills: Record<string, SkillState>;
  /** Datum (JJJJ-MM-TT) des letzten Tagesfutters */
  dailyDone?: string;
  settings: Settings;
};

export type SaveData = {
  version: number;
  activeProfileId: string | null;
  profiles: Profile[];
};

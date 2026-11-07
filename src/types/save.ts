import type { TaskLevel } from './task';

/** 1 = richtig im ersten Versuch, 0.5 = richtig mit Hilfe, 0 = falsch. */
export type AnswerScore = 1 | 0.5 | 0;

export type SkillState = {
  level: TaskLevel;
  /** die letzten 10 Antworten, älteste zuerst */
  last: AnswerScore[];
  /** Datum der letzten Übung, JJJJ-MM-TT */
  lastPlayed: string;
};

export type AreaProgress = {
  /** insgesamt gesammelte Sterne */
  stars: number;
  /** höchste freigeschaltete Stufe */
  unlockedLevel: TaskLevel;
  rounds: number;
};

export type Settings = {
  music: number;
  sfx: number;
  readAloud: boolean;
  largeText: boolean;
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

export type Profile = {
  id: string;
  nickname: string;
  avatar: Avatar;
  createdAt: string;
  /** Sterne zum Einlösen */
  stars: number;
  zoo: { animals: string[]; decor: string[] };
  areas: Record<string, AreaProgress>;
  skills: Record<string, SkillState>;
  settings: Settings;
};

export type SaveData = {
  version: number;
  activeProfileId: string | null;
  profiles: Profile[];
};

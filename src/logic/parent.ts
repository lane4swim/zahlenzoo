import { confidence, topError } from './skills';
import type { Rng } from './rng';
import type { Profile } from '../types/save';
import type { TaskLevel } from '../types/task';

/** Zugang zum Erwachsenenbereich: eine Malaufgabe, die Kinder in Klasse 2 noch nicht sicher lösen. */
export function parentGate(rng: Rng): { a: number; b: number; answer: number } {
  const a = rng.int(6, 9);
  const b = rng.int(12, 19);
  return { a, b, answer: a * b };
}

export type OverviewRow = {
  family: string;
  level: TaskLevel;
  /** Sicherheit 0–1; undefined, solange auf der Stufe noch keine Antwort gezählt ist */
  confidence: number | undefined;
  answers: number;
  topError: string | undefined;
  lastPlayed: string;
  support: boolean;
};

/** Übersicht je Familie für Eltern und Lehrkräfte: zuletzt geübte zuerst. */
export function familyOverview(profile: Profile): OverviewRow[] {
  return Object.entries(profile.skills)
    .map(([family, skill]) => ({
      family,
      level: skill.level,
      confidence: confidence(skill.last),
      answers: skill.last.length,
      topError: topError(skill),
      lastPlayed: skill.lastPlayed,
      support: skill.support === true,
    }))
    .sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed) || a.family.localeCompare(b.family));
}

import type { Rng } from '../logic/rng';
import type { FamilyParams } from './content';

/** Eingabeformen einer Aufgabe (Spezifikation, Abschnitt 6). */
export type TaskKind =
  | 'number-input'
  | 'choice'
  | 'gap'
  | 'drag-sort'
  | 'number-line'
  | 'clock'
  | 'money'
  | 'pattern'
  | 'word';

/**
 * Stufe einer Aufgabenfamilie. Stufe 0 gibt es nur für das Einspluseins bis 20
 * im Pinguinfelsen (Spezifikation, Abschnitt 5).
 */
export type TaskLevel = 0 | 1 | 2 | 3;

export type TextParams = Readonly<Record<string, string | number>>;

/** Darstellungen für Hinweise und einblendbare Hilfen. */
export type Visual =
  | {
      /** Rechenstrich: Start, Sprünge; Zwischenwerte auf Wunsch verdeckt. */
      type: 'jumps';
      start: number;
      jumps: number[];
      hideResults?: boolean;
    }
  | {
      /** Hundertertafel mit markierten Zahlen */
      type: 'hundred';
      marked: number[];
    }
  | {
      /** Punktefeld: rows Reihen mit je cols Punkten; die ersten `split` Reihen andersfarbig */
      type: 'dots';
      rows: number;
      cols: number;
      split?: number;
    };

/**
 * Eine Hilfestufe: 1 lenkender Satz, 2 Bild der Strategie, 3 Lösung mit Rechenweg.
 * Texte stehen in `hints.de.json`; die Logik liefert nur Schlüssel und Werte.
 */
export type Hint = {
  key: string;
  params?: TextParams;
  visual?: Visual;
};

export type TaskOption = { value: string; errorTag?: string };

export type TaskAnswer = number | number[] | string;

/** Bestandteil einer Rechnung oder Zahlenreihe: Zahl, Zeichen oder die gesuchte Stelle. */
export type Term = number | '+' | '-' | '·' | ':' | '=' | '<' | ',' | '?';

/** Typische falsche Antwort mit Fehlerart (für Antwortkarten und Rückmeldung). */
export type TypicalError = { value: number; errorTag: string };

/** Zahlen einer Rechnung, damit Prüfer und Hilfen nicht den Text zerlegen müssen. */
export type MathInfo = {
  op: '+' | '-';
  a: number;
  b: number;
  result: number;
  /** gesuchte Zahl: Ergebnis (Standard) oder zweiter Summand (Ergänzen) */
  missing: 'result' | 'b';
  /** Zehnerübergang */
  carry: boolean;
};

export type Task = {
  /** eindeutig pro Runde */
  id: string;
  /** z. B. "add_100", "mult_core", "clock_half" */
  family: string;
  level: TaskLevel;
  kind: TaskKind;
  /** Rechnung oder Zahlenreihe; textKey: Frage dazu (Schlüssel in den Texten) */
  prompt: { terms: Term[]; textKey?: string; images?: string[] };
  answer: TaskAnswer;
  /** true: Reihenfolge der Zahlen in einer Antwortliste ist egal */
  unordered?: boolean;
  options?: TaskOption[];
  hints: [Hint, Hint, Hint];
  /** Verweis auf die Strategie, z. B. "add_stepwise" */
  strategyId?: string;
  math?: MathInfo;
  /** typische Fehler, falls nicht aus `math` ableitbar */
  typicalErrors?: TypicalError[];
  /** Schlüssel zum Erkennen von Duplikaten; Tauschaufgaben haben denselben */
  dedupeKey: string;
};

/** Rohe Eingabe des Kindes, bevor sie normalisiert und geprüft wird. */
export type TaskInput = string | number | number[];

export type CheckResult = { correct: boolean; errorTag?: string; invalid?: boolean };

/** Erzeugt eine Aufgabe einer Familie und Stufe mit den Parametern aus families.json. */
export type Generator = (level: TaskLevel, rng: Rng, id: string, params: FamilyParams) => Task;

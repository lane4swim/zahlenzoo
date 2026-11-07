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

/** Eine Hilfestufe: 1 lenkender Satz, 2 Bild der Strategie, 3 Lösung mit Rechenweg. */
export type Hint = {
  text: string;
  /** Schlüssel für eine eingesprochene Audiodatei; sonst Sprachausgabe des Browsers. */
  audioKey?: string;
  /** Verweis auf eine Darstellung (Zehnerfeld, Rechenstrich, ...). */
  visualId?: string;
};

export type TaskOption = { value: string; errorTag?: string };

export type TaskAnswer = number | number[] | string;

export type Task = {
  /** eindeutig pro Runde */
  id: string;
  /** z. B. "add_100", "mult_core", "clock_half" */
  family: string;
  level: TaskLevel;
  kind: TaskKind;
  prompt: { text: string; images?: string[] };
  answer: TaskAnswer;
  options?: TaskOption[];
  hints: [Hint, Hint, Hint];
  /** Verweis auf die Visualisierung der Strategie */
  strategyId?: string;
};

/** Rohe Eingabe des Kindes, bevor sie normalisiert und geprüft wird. */
export type TaskInput = string | number | number[];

export type CheckResult = { correct: boolean; errorTag?: string };

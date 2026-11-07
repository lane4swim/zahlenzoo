/** Ergebnis einer Aufgabe für Runde und Kompetenzmodell (Spezifikation, Abschnitt 7). */
export type AnswerOutcome = 'first_try' | 'with_help' | 'wrong';

export type RoundSummary = {
  total: number;
  firstTry: number;
  withHelp: number;
  wrong: number;
};

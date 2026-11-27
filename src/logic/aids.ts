import type { MathInfo, Task } from '../types/task';

/**
 * Einblendbare Rechenhilfen (Spezifikation 2: „Anschauung zuerst“). Welche es gibt, hängt
 * von der Aufgabe ab: Bis 20 hilft das Zehnerfeld, darüber Zehnerstangen und Hundertertafel.
 * Der Rechenstrich zeigt den Sprung der Rechnung, nicht nur die Startzahl.
 */
export type Aid = 'tenFrame' | 'tensOnes' | 'numberLine' | 'hundredBoard';

/** Bekannte Zahlen einer Aufgabe (ohne die gesuchte). */
export function knownNumbers(task: Task): number[] {
  const m = task.math;
  if (m) return m.missing === 'b' ? [m.a, m.result] : [m.a, m.b];
  const story = task.prompt.story;
  if (story) return Object.values(story.params).filter((v): v is number => typeof v === 'number');
  return task.prompt.terms.filter((t): t is number => typeof t === 'number');
}

/**
 * Hilfen für eine Aufgabe, in der Reihenfolge der Knöpfe.
 * - mit Rechnung bis 20: Zehnerfeld und Rechenstrich
 * - mit Rechnung über 20: Zehnerstangen, Rechenstrich, Hundertertafel
 * - ohne Rechnung (z. B. Vergleichen): Zehnerstangen, über 20 auch die Hundertertafel;
 *   Klasse 1 bekommt hier keine Hilfe (Zehnerstangen gehören zu Klasse 2)
 * - beim Geldlegen und Verteilen keine (Teller und Münzen sind die Darstellung)
 */
export function aidsFor(task: Task, firstGrade: boolean): Aid[] {
  if (task.money || task.share) return [];
  const known = knownNumbers(task);
  if (known.length === 0) return [];
  const answer = typeof task.answer === 'number' ? task.answer : 0;
  const small = Math.max(...known, answer) <= 20;
  const m = task.math;
  if (m) return small ? ['tenFrame', 'numberLine'] : ['tensOnes', 'numberLine', 'hundredBoard'];
  if (firstGrade) return [];
  return small ? ['tensOnes'] : ['tensOnes', 'hundredBoard'];
}

/**
 * Rechenstrich zur Rechnung: Start, ein Sprung und das Ziel. Gesucht ist das Ergebnis: Das
 * Ziel bleibt verdeckt („?“). Gesucht ist die Zahl dazwischen (Ergänzen): Der Sprung bleibt
 * verdeckt, Start und Ziel stehen da.
 */
export function numberLineFor(m: MathInfo): {
  start: number;
  jumps: number[];
  hideResults: boolean;
  hideJumps: boolean;
} {
  const jump = m.op === '+' ? m.result - m.a : -(m.a - m.result);
  const gap = m.missing === 'b';
  return { start: m.a, jumps: [jump], hideResults: !gap, hideJumps: gap };
}

/** Zehnerfeld zur Rechnung: beim Ergänzen nur die Startzahl, sonst Start und Sprung. */
export function tenFrameFor(m: MathInfo): { first: number; second: number; op: '+' | '-' } {
  return { first: m.a, second: m.missing === 'b' ? 0 : m.b, op: m.op };
}

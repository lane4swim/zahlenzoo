import type { Hint, Task } from '../../types/task';

const EMPTY_HINT: Hint = { text: '' };

/**
 * Platzhalteraufgaben für die leere Runde aus Phase 1. Sie haben keinen Inhalt;
 * die Aufgabenansicht zeigt nur „Aufgabe x von n“ und einen OK-Knopf.
 */
export function placeholderTasks(count: number): Task[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`placeholderTasks(${count}): Anzahl muss mindestens 1 sein`);
  }
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${i + 1}`,
    family: 'placeholder',
    level: 1,
    kind: 'choice',
    prompt: { text: '' },
    answer: 'ok',
    hints: [EMPTY_HINT, EMPTY_HINT, EMPTY_HINT],
  }));
}

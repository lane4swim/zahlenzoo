import { typicalErrors } from './options';
import type { CheckResult, Task, TaskInput } from '../types/task';

/** Entfernt Leerzeichen und führende Nullen; leere Eingaben ergeben undefined. */
export function normalize(input: string): string | undefined {
  const compact = input.replace(/\s+/g, '');
  if (compact === '') return undefined;
  if (/^\d+$/.test(compact)) return compact.replace(/^0+(?=\d)/, '');
  return compact.toLowerCase();
}

function toNumber(input: TaskInput): number | undefined {
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;
  if (Array.isArray(input)) return undefined;
  const n = normalize(input);
  return n !== undefined && /^\d+$/.test(n) ? Number(n) : undefined;
}

function toNumberList(input: TaskInput): number[] | undefined {
  const parts = Array.isArray(input) ? input.map(String) : String(input).split(/[,;]/);
  const numbers = parts.map((p) => toNumber(p));
  return numbers.every((n) => n !== undefined) ? (numbers as number[]) : undefined;
}

/**
 * Prüft eine Eingabe (Spezifikation, Abschnitt 6). Liefert `invalid`, wenn die
 * Eingabe nicht auswertbar ist (z. B. leer); das zählt nicht als Versuch.
 */
export function check(task: Task, input: TaskInput): CheckResult {
  const { answer } = task;

  if (typeof answer === 'number') {
    const value = toNumber(input);
    if (value === undefined) return { correct: false, invalid: true };
    if (value === answer) return { correct: true };
    return { correct: false, ...tagFor(task, value) };
  }

  if (Array.isArray(answer)) {
    const values = toNumberList(input);
    if (!values) return { correct: false, invalid: true };
    const a = task.unordered ? [...values].sort((x, y) => x - y) : values;
    const b = task.unordered ? [...answer].sort((x, y) => x - y) : answer;
    const correct = a.length === b.length && a.every((v, i) => v === b[i]);
    return { correct };
  }

  if (Array.isArray(input)) return { correct: false, invalid: true };
  const given = normalize(String(input));
  if (given === undefined) return { correct: false, invalid: true };
  if (given === normalize(answer)) return { correct: true };
  return { correct: false, ...tagFor(task, given) };
}

function tagFor(task: Task, value: number | string): { errorTag?: string } {
  const option = task.options?.find((o) => normalize(o.value) === String(value));
  if (option?.errorTag) return { errorTag: option.errorTag };
  if (task.math && typeof value === 'number') {
    const match = typicalErrors(task.math).find((e) => e.value === value);
    if (match) return { errorTag: match.errorTag };
  }
  return {};
}

import { checkGrid } from './grid';
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
  if (task.grid) return checkGrid(task, input);

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
    if (correct || Array.isArray(input)) return { correct };
    const known = task.errorAnswers?.find((e) => e.value === values.join(','));
    if (known) return { correct, errorTag: known.errorTag };
    if (task.kind === 'select') {
      const missing = b.some((v) => !a.includes(v));
      const extra = a.some((v) => !b.includes(v));
      return {
        correct,
        errorTag:
          missing && !extra
            ? 'select_missing'
            : !missing && extra
              ? 'select_extra'
              : 'select_wrong',
      };
    }
    if (task.kind === 'build') {
      const sum = (l: number[]) => l.reduce((x, y) => x + y, 0);
      return { correct, errorTag: sum(a) !== sum(b) ? 'cube_count' : 'build_wrong' };
    }
    // Antwortkarten mit mehreren Zahlen (z. B. „3 Rest 2“): Fehlerart der gewählten Karte
    const option = task.options?.find((o) => normalize(o.value) === normalize(String(input)));
    return option?.errorTag ? { correct, errorTag: option.errorTag } : { correct };
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
  const known = task.errorAnswers?.find((e) => normalize(e.value) === String(value));
  if (known) return { errorTag: known.errorTag };
  if (typeof value === 'number') {
    const errors = task.typicalErrors ?? (task.math ? typicalErrors(task.math) : []);
    const match = errors.find((e) => e.value === value);
    if (match) return { errorTag: match.errorTag };
  }
  return {};
}

import type { Rng } from './rng';
import type { MathInfo, TaskOption, TypicalError } from '../types/task';

const MIN = 0;
const MAX = 100;

/** Ziffern vertauscht (73 → 37); undefined bei einstelligen oder gleichen Ziffern. */
export function swapDigits(n: number): number | undefined {
  // Einstellige Zahlen und volle Zehner (70 → 07) haben keine sinnvolle Vertauschung.
  if (n < 10 || n > 99 || n % 10 === 0) return undefined;
  const swapped = (n % 10) * 10 + Math.floor(n / 10);
  return swapped === n ? undefined : swapped;
}

/** Typische falsche Antworten mit errorTag, wichtigste zuerst. */
export function typicalErrors(m: MathInfo): TypicalError[] {
  if (m.op === '-') return subtractionErrors(m);
  const answer = m.missing === 'b' ? m.b : m.result;
  const candidates: TypicalError[] = [];
  if (m.missing === 'result' && m.carry) {
    candidates.push({ value: answer - 10, errorTag: 'carry_forgotten' });
  }
  if (m.missing === 'b') candidates.push({ value: m.result, errorTag: 'gave_total' });
  const swapped = swapDigits(answer);
  if (swapped !== undefined) candidates.push({ value: swapped, errorTag: 'digits_swapped' });
  candidates.push(
    { value: answer + 10, errorTag: 'tens_off' },
    { value: answer - 10, errorTag: 'tens_off' },
    { value: answer + 1, errorTag: 'ones_off' },
    { value: answer - 1, errorTag: 'ones_off' },
  );
  return candidates;
}

/** Typische Fehler bei a − b: Übertrag vergessen, kleinere von größerer Ziffer, plus statt minus. */
function subtractionErrors(m: MathInfo): TypicalError[] {
  const { a, b, result } = m;
  if (m.missing === 'b') {
    return [
      { value: result, errorTag: 'gave_total' },
      { value: a + result, errorTag: 'added' },
      { value: b + 1, errorTag: 'ones_off' },
      { value: b - 1, errorTag: 'ones_off' },
      { value: b + 10, errorTag: 'tens_off' },
      { value: b - 10, errorTag: 'tens_off' },
    ];
  }
  const errors: TypicalError[] = [];
  if (m.carry) {
    errors.push({ value: result + 10, errorTag: 'borrow_forgotten' });
    // 43 − 7: Einer 7 − 3 statt 13 − 7 gerechnet
    const flipped =
      Math.floor(a / 10) * 10 - Math.floor(b / 10) * 10 + Math.abs((a % 10) - (b % 10));
    errors.push({ value: flipped, errorTag: 'smaller_from_larger' });
  }
  errors.push({ value: a + b, errorTag: 'added' });
  const swapped = swapDigits(result);
  if (swapped !== undefined) errors.push({ value: swapped, errorTag: 'digits_swapped' });
  errors.push(
    { value: result + 10, errorTag: 'tens_off' },
    { value: result - 10, errorTag: 'tens_off' },
    { value: result + 1, errorTag: 'ones_off' },
    { value: result - 1, errorTag: 'ones_off' },
  );
  return errors;
}

/** Je Wert nur der erste (wichtigste) Fehler, nur Werte im Zahlenraum und ungleich der Lösung. */
export function uniqueErrors(errors: readonly TypicalError[], answer: number): TypicalError[] {
  return errors.filter(
    (e, i) =>
      e.value >= MIN &&
      e.value <= MAX &&
      e.value !== answer &&
      errors.findIndex((f) => f.value === e.value) === i,
  );
}

/**
 * Antwortkarten: die Lösung und falsche aus typischen Fehlern (der erste Fehler ist
 * immer dabei, die übrigen gemischt). Alle Werte sind verschieden und liegen im Zahlenraum.
 */
export function optionsFromErrors(
  answer: number,
  errors: readonly TypicalError[],
  rng: Rng,
  count = 4,
): TaskOption[] {
  const seen = new Set<number>([answer]);
  const wrong: TaskOption[] = [];
  const add = (value: number, errorTag: string) => {
    if (wrong.length >= count - 1 || seen.has(value) || value < MIN || value > MAX) return;
    seen.add(value);
    wrong.push({ value: String(value), errorTag });
  };
  const [first, ...rest] = errors;
  if (first) add(first.value, first.errorTag);
  for (const c of rng.shuffle(rest)) add(c.value, c.errorTag);
  for (let d = 2; wrong.length < count - 1; d++) {
    add(answer + d, 'other');
    add(answer - d, 'other');
  }
  return rng.shuffle([{ value: String(answer) }, ...wrong]);
}

/** Vier Antwortkarten zu einer Addition. */
export function additionOptions(m: MathInfo, rng: Rng, count = 4): TaskOption[] {
  return optionsFromErrors(m.missing === 'b' ? m.b : m.result, typicalErrors(m), rng, count);
}

import { typicalErrors } from '../options';
import { kindShare } from '../params';
import type { Rng } from '../rng';
import type { FamilyParams } from '../../types/content';
import type { Generator, Task, TaskOption, Term, TextParams } from '../../types/task';

/**
 * Aufgabenformen, die vorhandene Familien ergänzen (KE Abschnitt 6, Typen mit geringem
 * Aufwand): „Stimmt die Rechnung?“ (`true_false`), Größen ordnen (`time_order`),
 * Entdeckerpäckchen „Was fällt dir auf?“ und „Was passt nicht?“ (`odd_one_out`).
 * Die Anteile stehen in families.json; ohne Anteil bleibt die Familie unverändert.
 */

/** Optionaler Anteil einer Stufe (0, wenn er fehlt). */
export function optionalShare(params: FamilyParams, key: string): number {
  const v = params.level[key];
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : 0;
}

const MINUS = '−';
const show = (a: number, op: '+' | '-', b: number) => `${a} ${op === '+' ? '+' : MINUS} ${b}`;

// ---------------------------------------------------------------------------
// Stimmt die Rechnung?

/**
 * Stimmt die Rechnung? Die Hälfte der Rechnungen stimmt; die falschen zeigen einen typischen
 * Fehler (z. B. Zehnerübergang vergessen). Anteil: `kinds.true_false`.
 */
export function withTrueFalse(generate: Generator): Generator {
  return (level, rng, id, params) => {
    const share = kindShare(params, 'true_false');
    if (share <= 0 || !rng.chance(share)) return generate(level, rng, id, params);
    const base = generate(level, rng, id, params);
    const m = base.math;
    if (!m || m.missing !== 'result' || base.prompt.story) return base;
    const errors = typicalErrors(m).filter(
      (e) => e.value >= 0 && e.value <= 100 && e.value !== m.result,
    );
    const right = errors.length === 0 || rng.chance(0.5);
    const wrong = right ? undefined : rng.pick(errors);
    const shown = wrong?.value ?? m.result;
    const task = show(m.a, m.op, m.b);
    const options: TaskOption[] = [
      {
        value: 'yes',
        label: { key: 'answer.right' },
        ...(wrong ? { errorTag: wrong.errorTag } : {}),
      },
      { value: 'no', label: { key: 'answer.wrong' }, ...(right ? { errorTag: 'true_false' } : {}) },
    ];
    const terms: Term[] = [m.a, m.op, m.b, '=', shown];
    return {
      id,
      family: base.family,
      level,
      kind: 'choice',
      prompt: { terms, textKey: 'task.prompt.trueFalse' },
      answer: right ? 'yes' : 'no',
      options,
      hints: [
        { key: 'hint.true_false.1', params: { task } },
        base.hints[1],
        {
          key: right ? 'hint.true_false.3.right' : 'hint.true_false.3.wrong',
          params: { task, result: m.result, shown },
        },
      ],
      strategyId: 'true_false',
      dedupeKey: `tf:${base.dedupeKey}`,
    };
  };
}

// ---------------------------------------------------------------------------
// Ordnen

const ref = (label: NonNullable<TaskOption['label']>) =>
  `@${label.key}${Object.entries(label.params ?? {})
    .map(([k, v]) => `|${k}=${v}`)
    .join('')}`;

/**
 * Zeitspannen oder Längen ordnen (`time_order`, Eingabe Ziehen und Ordnen): aus einer Aufgabe
 * mit drei Größen wird „Ordne von kurz nach lang“. Anteil: Stufenparameter `sortShare`.
 */
export function withSort(generate: Generator, what: 'length' | 'duration'): Generator {
  return (level, rng, id, params) => {
    const share = optionalShare(params, 'sortShare');
    const sort = share > 0 && rng.chance(share);
    const base = generate(level, rng, id, params);
    const options = base.options ?? [];
    if (!sort || options.length < 3 || options.some((o) => !o.label)) return base;
    const sorted = [...options].sort((a, b) => Number(a.value) - Number(b.value));
    const order: TextParams = Object.fromEntries(sorted.map((o, i) => [`o${i}`, ref(o.label!)]));
    return {
      ...base,
      kind: 'drag-sort',
      prompt: { terms: [], textKey: `task.prompt.sort.${what}` },
      answer: sorted.map((o) => Number(o.value)),
      options: rng.shuffle(options.map((o) => ({ value: o.value, label: o.label! }))),
      sortEnds: ['sort.shortest', 'sort.longest'],
      hints: [
        { key: `hint.sort.${what}.1` },
        base.hints[1],
        { key: `hint.sort.3.${sorted.length}`, params: order },
      ],
      strategyId: `${what}_order`,
      dedupeKey: `sort:${base.dedupeKey}`,
    };
  };
}

// ---------------------------------------------------------------------------
// Entdeckerpäckchen

type Rule = 'both_up' | 'same' | 'first_up' | 'minus_same' | 'minus_first_up' | 'tens_up';

/** Wie sich das Ergebnis von Aufgabe zu Aufgabe ändert. */
const EFFECT: Record<Rule, string> = {
  both_up: 'package.up2',
  same: 'package.same',
  first_up: 'package.up1',
  minus_same: 'package.same',
  minus_first_up: 'package.up1',
  tens_up: 'package.up10',
};
const EFFECTS = ['package.up1', 'package.up2', 'package.same', 'package.up10', 'package.down1'];

type Row = { a: number; op: '+' | '-'; b: number };
const value = (r: Row) => (r.op === '+' ? r.a + r.b : r.a - r.b);

/** Päckchen aus vier Aufgaben nach einer Regel; Stufe 3 mit zweistelligen Zahlen. */
export function makePackage(rng: Rng, level: number): { rule: Rule; rows: Row[] } {
  const rules: Rule[] =
    level >= 3
      ? ['both_up', 'same', 'first_up', 'minus_same', 'minus_first_up', 'tens_up']
      : ['both_up', 'same', 'first_up', 'minus_same', 'minus_first_up'];
  const rule = rng.pick(rules);
  const big = level >= 3;
  const a0 = big ? rng.int(2, 6) * 10 + rng.int(1, 5) : rng.int(2, 6);
  const b0 = big ? rng.int(2, 4) : rng.int(2, 5);
  const rows: Row[] = [];
  for (let i = 0; i < 4; i++) {
    switch (rule) {
      case 'both_up':
        rows.push({ a: a0 + i, op: '+', b: b0 + i });
        break;
      case 'same':
        rows.push({ a: a0 + i, op: '+', b: b0 + 4 - i });
        break;
      case 'first_up':
        rows.push({ a: a0 + i, op: '+', b: b0 });
        break;
      case 'minus_same':
        rows.push({ a: a0 + 6 + i, op: '-', b: b0 + i });
        break;
      case 'minus_first_up':
        rows.push({ a: a0 + 6 + i, op: '-', b: b0 });
        break;
      case 'tens_up':
        rows.push({ a: (a0 % 10) + 10 * (i + 1), op: '+', b: b0 + 3 });
        break;
    }
  }
  return { rule, rows };
}

/** Was fällt dir auf? Drei Aussagen über die Ergebnisse, eine stimmt. */
export function discoverPackage(level: Task['level'], rng: Rng, id: string, family: string): Task {
  const { rule, rows } = makePackage(rng, level);
  const shown = rows.slice(0, 3);
  const correct = EFFECT[rule];
  const others = rng.shuffle(EFFECTS.filter((e) => e !== correct)).slice(0, 2);
  const lines = shown.map((r) => `${show(r.a, r.op, r.b)} = ${value(r)}`).join('\n');
  const options: TaskOption[] = rng.shuffle([
    { value: 'right', label: { key: correct } },
    ...others.map((key, i) => ({ value: `w${i}`, label: { key }, errorTag: 'package_rule' })),
  ]);
  return {
    id,
    family,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: 'task.prompt.package', textParams: { lines } },
    answer: 'right',
    options,
    hints: [
      { key: 'hint.package.1' },
      { key: `hint.package.rule.${rule}` },
      { key: 'hint.package.3', params: { rule: `@${correct}` } },
    ],
    strategyId: 'discover_package',
    dedupeKey: `pkg:${rule}:${rows[0]!.a}:${rows[0]!.b}`,
  };
}

/** Was passt nicht? Vier Aufgaben, eine folgt nicht der Regel des Päckchens. */
export function oddOneOut(level: Task['level'], rng: Rng, id: string, family: string): Task {
  const { rule, rows } = makePackage(rng, level);
  const at = rng.int(1, 3);
  const fit = rows[at]!;
  const label = (r: Row) => show(r.a, r.op, r.b);
  // Eine Zahl verschieben: Die Aufgabe passt nicht zur Regel und gleicht keiner anderen Karte.
  const shifts: Row[] = [1, 2, 3].flatMap((d) => [
    { ...fit, b: fit.b + d },
    { ...fit, a: fit.a + d + 1 },
  ]);
  const odd =
    rng.shuffle(shifts).find((r) => !rows.some((x) => label(x) === label(r))) ?? shifts[0]!;
  const cards = rows.map((r, i) => (i === at ? odd : r));
  return {
    id,
    family,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: 'task.prompt.oddOneOut' },
    answer: label(odd),
    options: cards.map((r, i) => ({
      value: label(r),
      ...(i === at ? {} : { errorTag: 'package_rule' }),
    })),
    hints: [
      { key: 'hint.odd.1' },
      { key: `hint.package.rule.${rule}` },
      { key: 'hint.odd.3', params: { odd: label(odd), fit: label(fit) } },
    ],
    strategyId: 'discover_package',
    dedupeKey: `odd:${rule}:${rows[0]!.a}:${rows[0]!.b}:${at}`,
  };
}

/**
 * Entdeckerpäckchen ergänzen eine Familie (Stufenparameter `packageShare`): halb „Was fällt
 * dir auf?“, halb „Was passt nicht?“.
 */
export function withPackages(generate: Generator, family: string): Generator {
  return (level, rng, id, params) => {
    const share = optionalShare(params, 'packageShare');
    if (share > 0 && rng.chance(share)) {
      return rng.chance(0.5)
        ? discoverPackage(level, rng, id, family)
        : oddOneOut(level, rng, id, family);
    }
    return generate(level, rng, id, params);
  };
}

// ---------------------------------------------------------------------------
// Zahlenhaus

/** Stockwerke eines Zahlenhauses: Zerlegungen von top der Reihe nach, eine mit Lücke. */
export function houseFloors(
  top: number,
  a: number,
  rng: Rng,
): { floors: Array<[number | null, number | null]> } {
  // zwei bekannte Zerlegungen und die gesuchte, aufsteigend nach der linken Zahl
  const known = new Set<number>();
  while (known.size < 2) {
    const k = rng.int(0, top);
    if (k !== a) known.add(k);
  }
  const lefts = [...known, a].sort((x, y) => x - y);
  return {
    floors: lefts.map((k) => (k === a ? [a, null] : [k, top - k])) as Array<
      [number | null, number | null]
    >,
  };
}

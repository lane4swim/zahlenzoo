import { choice } from '../params';
import type { Rng } from '../rng';
import type {
  Flavor,
  Generator,
  Ice,
  IceBase,
  Task,
  TaskLevel,
  TaskOption,
  TypicalError,
} from '../../types/task';

export const TALLY_CHART = 'tally_chart';
export const READ_TABLE = 'read_table';
export const READ_CHART = 'read_chart';
export const READ_CALENDAR = 'read_calendar';
export const COMBINATORICS = 'combinatorics';

/** Tiere für Zählungen: Kartensymbol und Text-Kennung (avatar.*, thing.*). */
export const ANIMALS = [
  ['karte_affe', 'monkey'],
  ['karte_pinguin', 'penguin'],
  ['karte_elefant', 'elephant'],
  ['karte_papagei', 'parrot'],
  ['karte_eule', 'owl'],
  ['karte_giraffe', 'giraffe'],
  ['karte_erdmaennchen', 'meerkat'],
  ['karte_schmetterling', 'butterfly'],
] as const;
type Animal = (typeof ANIMALS)[number];

const plural = (a: Animal) => `@thing.${a[1]}.plural`;

/** Verschiedene Zahlen im Bereich, damit „am meisten“ eindeutig ist. */
function distinct(rng: Rng, n: number, min: number, max: number, step = 1): number[] {
  const pool: number[] = [];
  for (let v = min; v <= max; v += step) pool.push(v);
  return rng.shuffle(pool).slice(0, n);
}

/** Typische Fehler ohne die richtige Antwort und ohne Doppelte. */
function errors(answer: number, list: Array<[number, string]>): TypicalError[] {
  const out: TypicalError[] = [];
  for (const [value, errorTag] of list) {
    if (value === answer || value < 0 || out.some((e) => e.value === value)) continue;
    out.push({ value, errorTag });
  }
  return out;
}

/** Antwortkarten mit Tiernamen: das gesuchte Tier und die anderen. */
function animalOptions(
  rng: Rng,
  animals: readonly Animal[],
  answer: Animal,
  tag: string,
): TaskOption[] {
  // höchstens 3 Karten, damit lange Namen nebeneinander passen
  const others = rng.shuffle(animals.filter((a) => a !== answer)).slice(0, 2);
  return rng.shuffle(
    [answer, ...others].map((a) => ({
      value: a[1],
      label: { key: `avatar.${a[1]}` },
      ...(a === answer ? {} : { errorTag: tag }),
    })),
  );
}

// ---------------------------------------------------------------------------
// Strichlisten

export const tallyChart: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['read', 'write', 'compare'] as const);
  const base = { id, family: TALLY_CHART, level, strategyId: `tally_${mode}` };

  if (mode === 'write') {
    const animal = rng.pick(ANIMALS);
    const n = rng.int(6, 15);
    const wrongN = rng.pick([n - 1, n + 1]);
    const options: TaskOption[] = rng.shuffle([
      { value: `${n}`, tally: { n, bundled: true } },
      { value: `${n}u`, tally: { n, bundled: false }, errorTag: 'tally_no_bundle' },
      { value: `${wrongN}`, tally: { n: wrongN, bundled: true }, errorTag: 'tally_count' },
    ]);
    return {
      ...base,
      kind: 'choice',
      prompt: {
        terms: [],
        textKey: 'task.prompt.tally.write',
        textParams: { n, animals: plural(animal) },
      },
      answer: `${n}`,
      options,
      hints: [
        { key: 'hint.tally.bundle.1' },
        { key: 'hint.tally.write.2', params: { n, b: Math.floor(n / 5), r: n % 5 } },
        { key: 'hint.tally.write.3', params: { n, b: Math.floor(n / 5), r: n % 5 } },
      ],
      dedupeKey: `tally:write:${n}:${options.map((o) => o.value).join(',')}`,
    };
  }

  const count = mode === 'read' ? rng.int(2, 3) : 3;
  const animals = rng.shuffle(ANIMALS).slice(0, count);
  const values = distinct(rng, count, mode === 'read' ? 3 : 4, mode === 'read' ? 19 : 24);
  const rows = animals.map((a, i) => ({ icon: a[0], n: values[i]! }));
  const visual = { type: 'tally' as const, rows };

  if (mode === 'read') {
    const i = rng.int(0, count - 1);
    const n = values[i]!;
    const b = Math.floor(n / 5);
    return {
      ...base,
      kind: 'number-input',
      prompt: {
        terms: [],
        textKey: 'task.prompt.tally.read',
        textParams: { animals: plural(animals[i]!) },
      },
      display: { visual },
      answer: n,
      typicalErrors: errors(n, [
        [n - b, 'tally_cross'],
        [b + (n % 5), 'tally_bundle'],
        [n + 1, 'ones_off'],
        [n - 1, 'ones_off'],
      ]),
      hints: [
        { key: 'hint.tally.bundle.1' },
        { key: 'hint.tally.read.2', params: { b, r: n % 5 } },
        { key: 'hint.tally.read.3', params: { b, five: b * 5, r: n % 5, n } },
      ],
      dedupeKey: `tally:read:${values.join(',')}:${i}`,
    };
  }

  // Vergleichen: wie viele mehr, zusammen oder welches Tier am häufigsten
  const ask = rng.pick(['more', 'total', 'most'] as const);
  const sorted = [...values].sort((a, b) => b - a);
  if (ask === 'most') {
    const top = animals[values.indexOf(sorted[0]!)]!;
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.tally.most' },
      display: { visual },
      answer: top[1],
      options: animalOptions(rng, animals, top, 'data_most'),
      hints: [
        { key: 'hint.tally.compare.1' },
        { key: 'hint.data.count.2' },
        { key: 'hint.data.most.3', params: { name: `@avatar.${top[1]}`, n: sorted[0]! } },
      ],
      dedupeKey: `tally:most:${values.join(',')}`,
    };
  }
  if (ask === 'total') {
    const total = values.reduce((a, b) => a + b, 0);
    return {
      ...base,
      kind: 'number-input',
      prompt: { terms: [], textKey: 'task.prompt.tally.total' },
      display: { visual },
      answer: total,
      typicalErrors: errors(total, [
        [total - 10, 'tens_off'],
        [total + 10, 'tens_off'],
        [total - 1, 'ones_off'],
        [total + 1, 'ones_off'],
      ]),
      hints: [
        { key: 'hint.tally.compare.1' },
        { key: 'hint.data.total.2', params: { a: values[0]!, b: values[1]!, c: values[2]! } },
        {
          key: 'hint.data.total.3',
          params: { a: values[0]!, b: values[1]!, c: values[2]!, n: total },
        },
      ],
      dedupeKey: `tally:total:${values.join(',')}`,
    };
  }
  const [i, j] = rng
    .shuffle([0, 1, 2])
    .slice(0, 2)
    .sort((x, y) => values[y]! - values[x]!) as [number, number];
  const diff = values[i]! - values[j]!;
  return {
    ...base,
    kind: 'number-input',
    prompt: {
      terms: [],
      textKey: 'task.prompt.data.more',
      textParams: { a: plural(animals[i]!), b: plural(animals[j]!) },
    },
    display: { visual },
    answer: diff,
    typicalErrors: errors(diff, [
      [values[i]! + values[j]!, 'data_added'],
      [values[i]!, 'data_value'],
    ]),
    hints: [
      { key: 'hint.tally.compare.1' },
      { key: 'hint.data.more.2', params: { a: values[i]!, b: values[j]! } },
      { key: 'hint.data.more.3', params: { a: values[i]!, b: values[j]!, n: diff } },
    ],
    dedupeKey: `tally:more:${values.join(',')}:${i}${j}`,
  };
};

// ---------------------------------------------------------------------------
// Tabellen

const DAYS = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as const;

export const readTable: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['cell', 'compare', 'sum'] as const);
  const animals = rng.shuffle(ANIMALS).slice(0, 3);
  const start = rng.int(0, 4);
  const days = DAYS.slice(start, start + 3);
  const max = level === 1 ? 12 : 20;
  // Je Zeile verschiedene Werte, damit „am meisten“ eindeutig ist
  const values = animals.map(() => distinct(rng, 3, 1, max));
  const visual = {
    type: 'table' as const,
    head: days.map((d) => `day.short.${d}`),
    rows: animals.map((a, r) => ({ icon: a[0], values: values[r]! })),
  };
  const base = { id, family: READ_TABLE, level, strategyId: `table_${mode}`, display: { visual } };
  const r = rng.int(0, 2);
  const c = rng.int(0, 2);
  const animal = animals[r]!;
  const v = values[r]![c]!;

  if (mode === 'cell') {
    return {
      ...base,
      kind: 'number-input',
      prompt: {
        terms: [],
        textKey: 'task.prompt.table.cell',
        textParams: { animals: plural(animal), day: `@day.${days[c]}` },
      },
      answer: v,
      typicalErrors: errors(v, [
        ...values[r]!.map((x): [number, string] => [x, 'table_column']),
        ...values.map((row): [number, string] => [row[c]!, 'table_row']),
      ]),
      hints: [
        { key: 'hint.table.1' },
        { key: 'hint.table.cell.2', params: { animals: plural(animal), day: `@day.${days[c]}` } },
        { key: 'hint.table.cell.3', params: { n: v } },
      ],
      dedupeKey: `table:cell:${values.flat().join(',')}:${r}${c}`,
    };
  }

  if (mode === 'compare') {
    if (rng.chance(0.5)) {
      const row = values[r]!;
      const best = row.indexOf(Math.max(...row));
      const options: TaskOption[] = days.map((d, i) => ({
        value: d,
        label: { key: `day.${d}` },
        ...(i === best ? {} : { errorTag: 'data_most' }),
      }));
      return {
        ...base,
        kind: 'choice',
        prompt: {
          terms: [],
          textKey: 'task.prompt.table.most',
          textParams: { animals: plural(animal) },
        },
        answer: days[best]!,
        options,
        hints: [
          { key: 'hint.table.1' },
          { key: 'hint.table.row.2', params: { animals: plural(animal) } },
          { key: 'hint.table.most.3', params: { day: `@day.${days[best]}`, n: row[best]! } },
        ],
        dedupeKey: `table:most:${values.flat().join(',')}:${r}`,
      };
    }
    const order = [0, 1, 2].sort((x, y) => values[r]![y]! - values[r]![x]!);
    const c1 = order[0]!;
    const c2 = rng.pick([order[1]!, order[2]!]);
    const hi = values[r]![c1]!;
    const lo = values[r]![c2]!;
    const loDay = days[c2]!;
    const diff = hi - lo;
    return {
      ...base,
      kind: 'number-input',
      prompt: {
        terms: [],
        textKey: 'task.prompt.table.more',
        textParams: { animals: plural(animal), d1: `@day.${days[c1]}`, d2: `@day.${loDay}` },
      },
      answer: diff,
      typicalErrors: errors(diff, [
        [hi + lo, 'data_added'],
        [hi, 'data_value'],
      ]),
      hints: [
        { key: 'hint.table.1' },
        { key: 'hint.data.more.2', params: { a: hi, b: lo } },
        { key: 'hint.data.more.3', params: { a: hi, b: lo, n: diff } },
      ],
      dedupeKey: `table:more:${values.flat().join(',')}:${r}:${lo}`,
    };
  }

  // Summen: eine Zeile (alle Tage) oder eine Spalte (alle Tiere an einem Tag)
  const byRow = rng.chance(0.5);
  const parts = byRow ? values[r]! : values.map((row) => row[c]!);
  const total = parts.reduce((a, b) => a + b, 0);
  return {
    ...base,
    kind: 'number-input',
    prompt: byRow
      ? { terms: [], textKey: 'task.prompt.table.sumRow', textParams: { animals: plural(animal) } }
      : { terms: [], textKey: 'task.prompt.table.sumCol', textParams: { day: `@day.${days[c]}` } },
    answer: total,
    typicalErrors: errors(total, [
      [total - 10, 'tens_off'],
      [total + 10, 'tens_off'],
      [total - 1, 'ones_off'],
      [total + 1, 'ones_off'],
    ]),
    hints: [
      { key: byRow ? 'hint.table.sumRow.1' : 'hint.table.sumCol.1' },
      { key: 'hint.data.total.2', params: { a: parts[0]!, b: parts[1]!, c: parts[2]! } },
      { key: 'hint.data.total.3', params: { a: parts[0]!, b: parts[1]!, c: parts[2]!, n: total } },
    ],
    dedupeKey: `table:sum:${values.flat().join(',')}:${byRow ? `r${r}` : `c${c}`}`,
  };
};

// ---------------------------------------------------------------------------
// Säulendiagramme

export const readChart: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['ones', 'twos', 'tens'] as const);
  const step = mode === 'ones' ? 1 : mode === 'twos' ? 2 : rng.pick([5, 10]);
  const max = step * 10;
  const count = rng.int(3, 4);
  const animals = rng.shuffle(ANIMALS).slice(0, count);
  const values = distinct(rng, count, step, max, step);
  const visual = {
    type: 'bars' as const,
    items: animals.map((a, i) => ({ icon: a[0], value: values[i]! })),
    step,
    max,
  };
  const base = { id, family: READ_CHART, level, strategyId: `chart_${mode}`, display: { visual } };
  const asks =
    level === 1 ? (['value', 'most', 'least'] as const) : (['value', 'most', 'more'] as const);
  const ask = rng.pick(asks);
  const i = rng.int(0, count - 1);

  if (ask === 'value') {
    const v = values[i]!;
    return {
      ...base,
      kind: 'number-input',
      prompt: {
        terms: [],
        textKey: 'task.prompt.chart.value',
        textParams: { animals: plural(animals[i]!) },
      },
      answer: v,
      typicalErrors: errors(v, [
        [v / step, 'chart_scale'],
        [v + step, 'chart_line'],
        [v - step, 'chart_line'],
      ]),
      hints: [
        { key: 'hint.chart.1', params: { step } },
        { key: 'hint.chart.value.2', params: { lines: v / step, step } },
        { key: 'hint.chart.value.3', params: { lines: v / step, step, n: v } },
      ],
      dedupeKey: `chart:value:${values.join(',')}:${i}`,
    };
  }
  if (ask === 'most' || ask === 'least') {
    const target = ask === 'most' ? Math.max(...values) : Math.min(...values);
    const animal = animals[values.indexOf(target)]!;
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: `task.prompt.chart.${ask}` },
      answer: animal[1],
      options: animalOptions(rng, animals, animal, ask === 'most' ? 'data_most' : 'data_least'),
      hints: [
        { key: `hint.chart.${ask}.1` },
        { key: `hint.chart.${ask}.2` },
        { key: `hint.data.${ask}.3`, params: { name: `@avatar.${animal[1]}`, n: target } },
      ],
      dedupeKey: `chart:${ask}:${values.join(',')}`,
    };
  }
  const [a, b] = rng
    .shuffle([...values.keys()])
    .slice(0, 2)
    .sort((x, y) => values[y]! - values[x]!) as [number, number];
  const diff = values[a]! - values[b]!;
  return {
    ...base,
    kind: 'number-input',
    prompt: {
      terms: [],
      textKey: 'task.prompt.data.more',
      textParams: { a: plural(animals[a]!), b: plural(animals[b]!) },
    },
    answer: diff,
    typicalErrors: errors(diff, [
      [values[a]! + values[b]!, 'data_added'],
      [diff / step, 'chart_scale'],
    ]),
    hints: [
      { key: 'hint.chart.1', params: { step } },
      { key: 'hint.data.more.2', params: { a: values[a]!, b: values[b]! } },
      { key: 'hint.data.more.3', params: { a: values[a]!, b: values[b]!, n: diff } },
    ],
    dedupeKey: `chart:more:${values.join(',')}:${a}${b}`,
  };
};

// ---------------------------------------------------------------------------
// Kalender

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const readCalendar: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['weekday', 'week', 'span'] as const);
  const month = rng.int(1, 12);
  const days = MONTH_DAYS[month - 1]!;
  const start = rng.int(0, 6);
  const weekdayOf = (d: number) => DAYS[(start + d - 1) % 7]!;
  const base = { id, family: READ_CALENDAR, level, strategyId: `calendar_${mode}` };
  const cal = (marks: number[] = []) => ({
    visual: { type: 'calendar' as const, month, start, days, ...(marks.length ? { marks } : {}) },
  });
  const m = `@month.${month}`;

  if (mode === 'weekday') {
    if (rng.chance(0.3)) {
      return {
        ...base,
        kind: 'number-input',
        prompt: { terms: [], textKey: 'task.prompt.calendar.days', textParams: { month: m } },
        display: cal(),
        answer: days,
        typicalErrors: errors(days, [
          [days === 31 ? 30 : 31, 'ones_off'],
          [days - 1, 'ones_off'],
        ]),
        hints: [
          { key: 'hint.calendar.days.1' },
          { key: 'hint.calendar.days.2' },
          { key: 'hint.calendar.days.3', params: { month: m, n: days } },
        ],
        dedupeKey: `cal:days:${month}:${start}`,
      };
    }
    const d = rng.int(1, days);
    const right = weekdayOf(d);
    const idx = DAYS.indexOf(right);
    const wrong = [DAYS[(idx + 1) % 7]!, DAYS[(idx + 6) % 7]!];
    const options: TaskOption[] = rng.shuffle([right, ...wrong]).map((w) => ({
      value: w,
      label: { key: `day.${w}` },
      ...(w === right ? {} : { errorTag: 'weekday_neighbor' }),
    }));
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.calendar.weekday', textParams: { d, month: m } },
      display: cal([d]),
      answer: right,
      options,
      hints: [
        { key: 'hint.calendar.weekday.1' },
        { key: 'hint.calendar.weekday.2', params: { d } },
        { key: 'hint.calendar.weekday.3', params: { d, day: `@day.${right}` } },
      ],
      dedupeKey: `cal:wd:${month}:${start}:${d}`,
    };
  }

  if (mode === 'week') {
    if (rng.chance(0.4)) {
      const wd = rng.pick(DAYS);
      const dates: number[] = [];
      for (let d = 1; d <= days; d++) if (weekdayOf(d) === wd) dates.push(d);
      return {
        ...base,
        kind: 'number-input',
        prompt: {
          terms: [],
          textKey: 'task.prompt.calendar.count',
          textParams: { days: `@day.plural.${wd}`, month: m },
        },
        display: cal(),
        answer: dates.length,
        typicalErrors: errors(dates.length, [[dates.length === 4 ? 5 : 4, 'calendar_count']]),
        hints: [
          { key: 'hint.calendar.count.1', params: { day: `@day.short.${wd}` } },
          { key: 'hint.calendar.count.2' },
          { key: 'hint.calendar.count.3', params: { list: dates.join(', '), n: dates.length } },
        ],
        dedupeKey: `cal:count:${month}:${start}:${wd}`,
      };
    }
    const d = rng.int(1, days - 7);
    return {
      ...base,
      kind: 'number-input',
      prompt: { terms: [], textKey: 'task.prompt.calendar.nextWeek', textParams: { d, month: m } },
      display: cal([d]),
      answer: d + 7,
      typicalErrors: errors(d + 7, [
        [d + 1, 'week_day'],
        [d + 6, 'ones_off'],
        [d + 8, 'ones_off'],
      ]),
      hints: [
        { key: 'hint.calendar.week.1' },
        { key: 'hint.calendar.week.2', params: { d } },
        { key: 'hint.calendar.week.3', params: { d, n: d + 7 } },
      ],
      dedupeKey: `cal:week:${month}:${start}:${d}`,
    };
  }

  // Zeitspannen: „Heute ist der 5. In wie vielen Tagen ist der 19.?“ oder zwei Wochen weiter
  if (rng.chance(0.5)) {
    const a = rng.int(1, days - 15);
    const b = rng.int(a + 3, Math.min(days, a + 20));
    return {
      ...base,
      kind: 'number-input',
      prompt: { terms: [], textKey: 'task.prompt.calendar.span', textParams: { a, b } },
      display: cal([a, b]),
      answer: b - a,
      typicalErrors: errors(b - a, [
        [b - a + 1, 'counted_both'],
        [b + a, 'data_added'],
      ]),
      hints: [
        { key: 'hint.calendar.span.1', params: { a } },
        { key: 'hint.calendar.span.2', params: { a, b } },
        { key: 'hint.calendar.span.3', params: { a, b, n: b - a } },
      ],
      dedupeKey: `cal:span:${month}:${a}:${b}`,
    };
  }
  const d = rng.int(1, days - 14);
  return {
    ...base,
    kind: 'number-input',
    prompt: { terms: [], textKey: 'task.prompt.calendar.twoWeeks', textParams: { d, month: m } },
    display: cal([d]),
    answer: d + 14,
    typicalErrors: errors(d + 14, [
      [d + 7, 'week_once'],
      [d + 2, 'week_day'],
    ]),
    hints: [
      { key: 'hint.calendar.week.1' },
      { key: 'hint.calendar.twoWeeks.2', params: { d, w: d + 7 } },
      { key: 'hint.calendar.twoWeeks.3', params: { d, w: d + 7, n: d + 14 } },
    ],
    dedupeKey: `cal:2w:${month}:${start}:${d}`,
  };
};

// ---------------------------------------------------------------------------
// Kombinatorik mit Eis

const FLAVORS: Flavor[] = ['strawberry', 'chocolate', 'vanilla', 'pistachio', 'blueberry'];
const BASES: IceBase[] = ['cone', 'cup'];

const iceKey = (ice: Ice) => `${ice.base}:${ice.scoops.join('-')}`;

/** Alle Paare Sorte × Behälter, geordnet nach Sorte. */
export function allPairs(flavors: readonly Flavor[], bases: readonly IceBase[]): Ice[] {
  return flavors.flatMap((f) => bases.map((b) => ({ scoops: [f], base: b })));
}

/** Alle Anordnungen von k verschiedenen Kugeln aus den Sorten (von unten nach oben). */
export function allStacks(flavors: readonly Flavor[], k: number): Ice[] {
  const out: Ice[] = [];
  const go = (stack: Flavor[]) => {
    if (stack.length === k) {
      out.push({ scoops: stack, base: 'cone' });
      return;
    }
    for (const f of flavors) if (!stack.includes(f)) go([...stack, f]);
  };
  go([]);
  return out;
}

function missingIce(
  level: TaskLevel,
  rng: Rng,
  id: string,
  all: Ice[],
  flavors: Flavor[],
  bases: IceBase[] | undefined,
  kind: 'pairs' | 'stack',
): Task {
  const gone = rng.int(0, all.length - 1);
  const shown = all.filter((_, i) => i !== gone);
  const right = all[gone]!;
  const wrong = rng.shuffle(shown).slice(0, 2);
  const options: TaskOption[] = rng.shuffle([
    { value: iceKey(right), ice: right },
    ...wrong.map((ice) => ({ value: iceKey(ice), ice, errorTag: 'combo_shown' })),
  ]);
  return {
    id,
    family: COMBINATORICS,
    level,
    kind: 'choice',
    strategyId: 'combo_missing',
    prompt: { terms: [], textKey: `task.prompt.ice.missing.${kind}` },
    display: { visual: { type: 'ice', flavors, ...(bases ? { bases } : {}), shown } },
    answer: iceKey(right),
    options,
    hints: [
      { key: `hint.ice.order.${kind}` },
      { key: 'hint.ice.missing.2', params: { n: all.length } },
      { key: 'hint.ice.missing.3' },
    ],
    dedupeKey: `ice:missing:${kind}:${flavors.join(',')}:${bases?.join(',') ?? ''}:${gone}`,
  };
}

export const combinatorics: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['pairs', 'pairsMore', 'stacks'] as const);

  if (mode === 'pairs' || mode === 'pairsMore') {
    const a = mode === 'pairs' ? rng.int(2, 3) : rng.int(2, 5);
    const flavors = rng.shuffle(FLAVORS).slice(0, a);
    const bases = BASES;
    const all = allPairs(flavors, bases);
    if (mode === 'pairsMore' && rng.chance(0.5)) {
      return missingIce(level, rng, id, all, flavors, bases, 'pairs');
    }
    const n = all.length;
    return {
      id,
      family: COMBINATORICS,
      level,
      kind: 'number-input',
      strategyId: 'combo_pairs',
      prompt: { terms: [], textKey: 'task.prompt.ice.pairs', textParams: { a } },
      display: { visual: { type: 'ice', flavors, bases } },
      answer: n,
      typicalErrors: errors(n, [
        [a + 2, 'combo_added'],
        [a, 'combo_one_group'],
      ]),
      hints: [
        { key: 'hint.ice.order.pairs' },
        { key: 'hint.ice.pairs.2', visual: { type: 'ice', flavors, bases, shown: all } },
        { key: 'hint.ice.pairs.3', params: { a, n } },
      ],
      dedupeKey: `ice:pairs:${flavors.join(',')}`,
    };
  }

  // Anordnungen: 3 Kugeln aus 3 Sorten oder 2 Kugeln aus 3 Sorten (je verschieden)
  const k = rng.pick([2, 3]);
  const flavors = rng.shuffle(FLAVORS).slice(0, 3);
  const all = allStacks(flavors, k);
  if (rng.chance(0.4)) return missingIce(level, rng, id, all, flavors, undefined, 'stack');
  return {
    id,
    family: COMBINATORICS,
    level,
    kind: 'number-input',
    strategyId: 'combo_stacks',
    prompt: { terms: [], textKey: `task.prompt.ice.stack.${k}` },
    display: { visual: { type: 'ice', flavors } },
    answer: all.length,
    typicalErrors: errors(all.length, [
      [3, 'combo_flavors'],
      [9, 'combo_repeat'],
      [1, 'combo_order'],
    ]),
    hints: [
      { key: 'hint.ice.order.stack' },
      { key: `hint.ice.stack.${k}.2`, visual: { type: 'ice', flavors, shown: all } },
      { key: `hint.ice.stack.${k}.3` },
    ],
    dedupeKey: `ice:stack:${k}:${flavors.join(',')}`,
  };
};

import { kindShare, num } from '../params';
import type { Rng } from '../rng';
import type { Generator, Hint, Task, TaskOption, Term, TextParams } from '../../types/task';

/**
 * Futteruhr: Zeitspannen vergleichen (KE: compare_duration) und Zeiteinheiten umwandeln
 * (KE: time_units; Stufe 2 Zeitspannen zwischen zwei Uhrzeiten).
 *
 * Texte für Zeitspannen stehen in den Sprachdateien (`duration.*`). Ein Hinweis verweist
 * mit „@schlüssel|n=40“ auf eine Zeitspanne; das Spiel setzt den Text mit diesen Werten ein.
 */
export const COMPARE_DURATION = 'compare_duration';
export const TIME_UNITS = 'time_units';

type Duration = { minutes: number; key: string; n?: number };

const minutes = (n: number): Duration => ({ minutes: n, key: 'duration.minutes', n });
const hours = (n: number): Duration =>
  n === 1 ? { minutes: 60, key: 'duration.hour' } : { minutes: 60 * n, key: 'duration.hours', n };
const FRACTIONS: readonly Duration[] = [
  { minutes: 15, key: 'duration.quarterHour' },
  { minutes: 30, key: 'duration.halfHour' },
  { minutes: 45, key: 'duration.threeQuarterHour' },
];

/** Verweis auf den Text einer Zeitspanne für Hinweise. */
const ref = (d: Duration): string => `@${d.key}${d.n !== undefined ? `|n=${d.n}` : ''}`;
const label = (d: Duration): TaskOption['label'] =>
  d.n !== undefined ? { key: d.key, params: { n: d.n } } : { key: d.key };

function swapDigits(n: number): number {
  return Number(String(n).split('').reverse().join(''));
}

/** Stufe 1: zwei Zeitspannen in derselben Einheit, oft mit vertauschten Ziffern. */
function sameUnit(rng: Rng): Duration[] {
  if (rng.chance(0.3)) {
    const a = rng.int(2, 12);
    let b = rng.int(2, 12);
    while (b === a) b = rng.int(2, 12);
    return [hours(a), hours(b)];
  }
  const a = rng.int(12, 59);
  let b = swapDigits(a);
  if (a % 10 === 0 || a % 11 === 0 || b > 59 || b < 10 || rng.chance(0.4)) {
    do b = rng.int(10, 59);
    while (b === a);
  }
  return [minutes(a), minutes(b)];
}

/** Stufe 2: Viertel-, halbe, Dreiviertel- oder ganze Stunde gegen Minuten. */
function fractionPair(rng: Rng): Duration[] {
  const part = rng.pick([...FRACTIONS, hours(1)]);
  let m = part.minutes + 5 * rng.pick([-3, -2, -1, 1, 2, 3, 4]);
  if (m <= 5) m = part.minutes + 10;
  return rng.shuffle([part, minutes(m)]);
}

/** Stufe 3: drei Zeitspannen in verschiedenen Einheiten, alle verschieden lang. */
function threeMixed(rng: Rng): Duration[] {
  const pool = (): Duration =>
    rng.pick([
      () => minutes(5 * rng.int(4, 30)),
      () => hours(rng.int(1, 3)),
      () => rng.pick(FRACTIONS),
    ])();
  const list: Duration[] = [];
  while (list.length < 3) {
    const d = pool();
    if (!list.some((x) => x.minutes === d.minutes)) list.push(d);
  }
  // mindestens zwei verschiedene Einheiten, sonst ist es nur ein Zahlenvergleich
  if (list.every((d) => d.key === 'duration.minutes')) list[0] = rng.pick(FRACTIONS);
  return list.some((d, i) => list.findIndex((x) => x.minutes === d.minutes) !== i)
    ? threeMixed(rng)
    : list;
}

export const compareDuration: Generator = (level, rng, id, params): Task => {
  const count = num(params, 'options');
  const mixed = num(params, 'mixed') === 1;
  const shown = count >= 3 ? threeMixed(rng) : mixed ? fractionPair(rng) : sameUnit(rng);
  const shortest = count >= 3 && rng.chance(0.5);
  const answer = shown.reduce((best, d) =>
    shortest ? (d.minutes < best.minutes ? d : best) : d.minutes > best.minutes ? d : best,
  );
  const errorTag = mixed ? 'duration_units' : 'duration_digits';
  const options: TaskOption[] = rng.shuffle(
    shown.map((d) => ({
      value: String(d.minutes),
      label: label(d),
      ...(d === answer ? {} : { errorTag }),
    })),
  );
  // Hinweis 2: nur die Zeitspannen, die nicht schon in Minuten angegeben sind
  const convert = shown.filter((d) => d.key !== 'duration.minutes');
  const list: TextParams = Object.fromEntries(
    convert.flatMap((d, i) => [
      [`d${i}`, ref(d)],
      [`m${i}`, d.minutes],
    ]),
  );
  const which = count >= 3 ? (shortest ? 'shortest' : 'longest') : 'longer';
  const hints: [Hint, Hint, Hint] = [
    { key: mixed ? 'hint.compare_duration.units.1' : 'hint.compare_duration.digits.1' },
    mixed && convert.length > 0
      ? { key: `hint.compare_duration.2.${convert.length}`, params: list }
      : { key: 'hint.compare_duration.2.same' },
    { key: `hint.compare_duration.3.${which}`, params: { answer: ref(answer) } },
  ];
  return {
    id,
    family: COMPARE_DURATION,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: `task.prompt.duration.${which}` },
    answer: String(answer.minutes),
    options,
    hints,
    strategyId: COMPARE_DURATION,
    dedupeKey: `duration:${which}:${shown
      .map((d) => `${d.key}${d.n ?? ''}`)
      .sort()
      .join('|')}`,
  };
};

// ---------------------------------------------------------------------------
// Zeiteinheiten

type Unit = {
  terms: Term[];
  answer: number | string;
  hints: [Hint, Hint, Hint];
  key: string;
  errors?: Array<{ value: number; errorTag: string }>;
  /** Frage statt Rechnung (Stufe 3) */
  textKey?: string;
  textParams?: TextParams;
};

/** Stufe 1: Stunden und Minuten (2 h = 120 min, 1 h 15 min = 75 min, 180 min = 3 h). */
function hoursMinutes(rng: Rng, maxHours: number): Unit {
  const h = rng.int(1, maxHours);
  const kind = rng.pick(['hToMin', 'hmToMin', 'minToH'] as const);
  const one: Hint = { key: 'hint.time_units.hour.1' };
  if (kind === 'hToMin') {
    const p = { h, answer: 60 * h };
    return {
      key: `${kind}:${h}`,
      terms: [h, 'h', '=', '?', 'min'],
      answer: 60 * h,
      hints: [
        one,
        { key: 'hint.time_units.hToMin.2' },
        { key: 'hint.time_units.hToMin.3', params: p },
      ],
    };
  }
  if (kind === 'hmToMin') {
    const m = rng.pick([15, 30, 45]);
    const p = { h, m, hm: 60 * h, answer: 60 * h + m };
    return {
      key: `${kind}:${h}:${m}`,
      terms: [h, 'h', m, 'min', '=', '?', 'min'],
      answer: 60 * h + m,
      hints: [
        one,
        { key: 'hint.time_units.hmToMin.2', params: p },
        { key: 'hint.time_units.hmToMin.3', params: p },
      ],
    };
  }
  const p = { min: 60 * h, answer: h };
  return {
    key: `${kind}:${h}`,
    terms: [60 * h, 'min', '=', '?', 'h'],
    answer: h,
    hints: [
      one,
      { key: 'hint.time_units.minToH.2', params: p },
      { key: 'hint.time_units.minToH.3', params: p },
    ],
  };
}

/**
 * Stufe 2: Zeitspannen zwischen zwei Uhrzeiten in Minuten (Von 7:30 bis 8:15 sind es
 * 45 Minuten). Meist über die volle Stunde; Brüche wie ½ h gehören nach Klärung mit der
 * Lehrkraft nicht zu Klasse 2.
 */
function spans(rng: Rng): Unit {
  for (;;) {
    const hour = rng.int(7, 17);
    const sm = 5 * rng.int(0, 11);
    const span = 5 * rng.int(2, 12);
    const start = hour * 60 + sm;
    const end = start + span;
    const crossing = Math.floor(end / 60) > hour;
    // Zwei Drittel der Aufgaben gehen über die volle Stunde, die Endzeit ist keine volle Stunde.
    if (crossing !== rng.chance(0.67) || end % 60 === 0 || end > 18 * 60) continue;
    const clock = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    const full = (hour + 1) * 60;
    const m1 = full - start;
    const m2 = end - full;
    const p = {
      start: clock(start),
      end: clock(end),
      full: clock(full),
      m1,
      m2,
      sm,
      em: end % 60,
      answer: span,
    };
    // Typischer Fehler: Uhrzeiten wie Zahlen abgezogen (8:15 − 7:30 → 815 − 730 = 85)
    const asNumbers = Number(clock(end).replace(':', '')) - Number(clock(start).replace(':', ''));
    const errors = [
      ...(crossing && asNumbers !== span
        ? [{ value: asNumbers, errorTag: 'hundred_minutes' }]
        : []),
      ...(crossing && m1 !== span ? [{ value: m1, errorTag: 'span_part' }] : []),
    ];
    return {
      key: `span:${start}:${end}`,
      terms: ['?'],
      answer: span,
      textKey: 'task.prompt.units.span',
      textParams: { start: p.start, end: p.end },
      errors,
      hints: crossing
        ? [
            { key: 'hint.time_units.span.1' },
            { key: 'hint.time_units.span.2', params: p },
            { key: 'hint.time_units.span.3', params: p },
          ]
        : [
            { key: 'hint.time_units.span.1.same' },
            { key: 'hint.time_units.span.2.same', params: p },
            { key: 'hint.time_units.span.3.same', params: p },
          ],
    };
  }
}

/** Stufe 3: Tag, Woche, Monat, Jahr (als Frage mit Antwortkästchen). */
const CALENDAR = [
  { id: 'dayHours', per: 24, fact: 'day', forward: true, max: 1 },
  { id: 'weekDays', per: 7, fact: 'week', forward: true, max: 4 },
  { id: 'yearMonths', per: 12, fact: 'year', forward: true, max: 2 },
  { id: 'hoursDays', per: 24, fact: 'day', forward: false, max: 3 },
  { id: 'daysWeeks', per: 7, fact: 'week', forward: false, max: 4 },
  { id: 'monthsYears', per: 12, fact: 'year', forward: false, max: 3 },
] as const;

function calendar(rng: Rng): Unit {
  const c = rng.pick(CALENDAR);
  const n = rng.int(1, c.max);
  const given = c.forward ? n : n * c.per;
  const answer = c.forward ? n * c.per : n;
  const calc = c.forward ? `${n} · ${c.per}` : `${given} : ${c.per}`;
  // Typische Fehler: 12 Stunden am Tag (nur der Tag), 5 Tage je Woche (nur die Schultage)
  const errors =
    c.forward && c.fact === 'day'
      ? [{ value: n * 12, errorTag: 'day_hours' }]
      : c.forward && c.fact === 'week'
        ? [{ value: n * 5, errorTag: 'week_days' }]
        : [];
  return {
    key: `${c.id}:${n}`,
    errors,
    terms: ['?'],
    answer,
    textKey: `task.prompt.units.${c.id}${c.forward && n === 1 ? '.one' : ''}`,
    textParams: { n: given },
    hints: [
      { key: 'hint.time_units.calendar.1' },
      { key: `hint.time_units.calendar.2.${c.fact}` },
      { key: 'hint.time_units.calendar.3', params: { calc, answer } },
    ],
  };
}

/** Typische Fehler: 100 statt 60 Minuten je Stunde, 12 statt 24 Stunden am Tag. */
function unitErrors(
  terms: readonly Term[],
  answer: number,
): Array<{ value: number; errorTag: string }> {
  const errors: Array<{ value: number; errorTag: string }> = [];
  if (terms.includes('h') && terms.at(-1) === 'min') {
    const h = typeof terms[0] === 'number' && terms[1] !== 'min' ? terms[0] : 0;
    const rest = answer - 60 * h;
    errors.push({ value: 100 * h + rest, errorTag: 'hundred_minutes' });
  }
  return errors.filter(
    (e, i) => e.value !== answer && errors.findIndex((f) => f.value === e.value) === i,
  );
}

export const timeUnits: Generator = (level, rng, id, params): Task => {
  const stage = num(params, 'stage');
  const unit =
    stage === 1
      ? hoursMinutes(rng, num(params, 'maxHours'))
      : stage === 2
        ? spans(rng)
        : calendar(rng);
  const prompt: Task['prompt'] = unit.textKey
    ? {
        terms: unit.terms,
        textKey: unit.textKey,
        ...(unit.textParams ? { textParams: unit.textParams } : {}),
      }
    : { terms: unit.terms };
  const answer = unit.answer;
  const errors = [
    ...(unit.errors ?? []),
    ...(typeof answer === 'number' ? unitErrors(unit.terms, answer) : []),
  ];
  // Antwortkarten nach Anteil, wenn es typische Fehler als falsche Karten gibt
  const asCards =
    typeof answer === 'number' && errors.length > 0 && rng.chance(kindShare(params, 'choice'));
  let options: TaskOption[] | undefined;
  if (asCards) {
    const a = answer as number;
    const wrong = [...errors.map((e) => ({ value: String(e.value), errorTag: e.errorTag }))];
    for (const d of [15, -15, 30, 60]) {
      if (wrong.length >= 3) break;
      const v = a + d;
      if (v > 0 && !wrong.some((w) => w.value === String(v)))
        wrong.push({ value: String(v), errorTag: 'other' });
    }
    options = rng.shuffle([{ value: String(a) }, ...wrong.slice(0, 3)]);
  }
  return {
    id,
    family: TIME_UNITS,
    level,
    kind: options ? 'choice' : 'number-input',
    prompt,
    answer,
    ...(options ? { options } : {}),
    hints: unit.hints,
    strategyId: TIME_UNITS,
    ...(errors.length > 0 ? { typicalErrors: errors } : {}),
    dedupeKey: `units:${unit.key}`,
  };
};

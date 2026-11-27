import { optionsFromErrors, uniqueErrors } from '../options';
import { choice, kindShare, num, share } from '../params';
import type { Rng } from '../rng';
import { quickCount } from './numbers100';
import { storyTask } from './story';
import type { FamilyParams } from '../../types/content';
import type {
  Generator,
  MathInfo,
  Task,
  TaskKind,
  TaskLevel,
  TypicalError,
  Visual,
} from '../../types/task';

/**
 * Streichelzoo (Klasse 1, docs/streichelzoo-klasse-1.md, Abschnitt 4): Zahlen bis 20.
 * Antwortkarten sind höchstens drei, Fehlerarten passen zu Erstklässlern (verzählt statt
 * „Einer falsch“), Hinweisbilder zeigen Fünfer- und Zehnerstruktur und Fingerbilder.
 */
export const COUNT_20 = 'count_20';
export const QUICK_COUNT_20 = 'quick_count_20';
export const ADDSUB_10 = 'addsub_10';

/** Antwortkarten in Klasse 1: die Lösung und zwei falsche */
export const CARDS = 3;

/** Dinge im Streichelzoo zum Zählen und Rechnen (Bilder aus public/assets/img). */
export const PETTING_ICONS = [
  'objekt_moehre',
  'objekt_kueken',
  'objekt_kaninchen',
  'karte_ziege',
] as const;

/**
 * Ziffernblock oder Antwortkarten (Anteil „choice“ aus families.json). Steht die gesuchte
 * Zahl nicht am Ende (15, 16, ?, 18), wird sie als Lücke eingetippt.
 */
export function withAnswer(
  task: Omit<Task, 'kind' | 'options' | 'typicalErrors'>,
  errors: TypicalError[],
  rng: Rng,
  params: FamilyParams,
  max = 20,
): Task {
  const answer = task.answer as number;
  const clean = uniqueErrors(errors, answer).filter((e) => e.value >= 1 && e.value <= max);
  const cards = clean.length >= CARDS - 1 && rng.chance(kindShare(params, 'choice'));
  const terms = task.prompt.terms;
  const last = terms.length <= 1 || terms.at(-1) === '?';
  const kind: TaskKind = cards ? 'choice' : last ? 'number-input' : 'gap';
  return {
    ...task,
    kind,
    typicalErrors: clean,
    ...(cards ? { options: optionsFromErrors(answer, clean, rng, CARDS) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Zählen

/** Abstand der Mitten beim Zählen (Bildgröße 52 px) */
const STEP = 60;

/** n Dinge in einer Reihe (bis 10). */
export function rowPoints(n: number): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => [Math.round((i - (n - 1) / 2) * STEP), 0]);
}

/**
 * Fünferreihen wie im Zehnerfeld: je 10 in zwei Reihen zu 5, zwei Zehner nebeneinander
 * mit Lücke (Kraft der 5 und der 10).
 */
export function groupPoints(n: number): Array<[number, number]> {
  const blocks = n > 10 ? 2 : 1;
  const blockW = 5 * STEP;
  const gap = 40;
  const total = blocks * blockW + (blocks - 1) * gap;
  const rows = n > 5 ? 2 : 1;
  return Array.from({ length: n }, (_, i) => {
    const block = Math.floor(i / 10);
    const k = i % 10;
    const x = -total / 2 + block * (blockW + gap) + (k % 5) * STEP + STEP / 2;
    const y = (Math.floor(k / 5) - (rows - 1) / 2) * STEP;
    return [Math.round(x), Math.round(y)];
  });
}

/** Verstreut in einer Fläche w × h, kein Ding näher als STEP an einem anderen. */
export function scatterPoints(n: number, rng: Rng, w = 560, h = 180): Array<[number, number]> {
  for (;;) {
    const points: Array<[number, number]> = [];
    for (let tries = 0; points.length < n && tries < 400; tries++) {
      const p: [number, number] = [rng.int(-w / 2, w / 2), rng.int(-h / 2, h / 2)];
      if (points.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) >= STEP)) points.push(p);
    }
    if (points.length === n) return points;
  }
}

/**
 * Stufe 1: bis 10 in einer Reihe. Stufe 2: bis 10 verstreut. Stufe 3: 11 bis 20 in
 * Fünferreihen. Das Kind tippt jedes Ding an (Häkchen) und gibt die Anzahl ein.
 */
export const count20: Generator = (level, rng, id, params): Task => {
  const n = rng.int(num(params, 'min'), num(params, 'max'));
  const icon = rng.pick(PETTING_ICONS);
  const layout = choice(params, 'layout', ['row', 'scatter', 'groups'] as const);
  const points =
    layout === 'row' ? rowPoints(n) : layout === 'groups' ? groupPoints(n) : scatterPoints(n, rng);
  const shown: Visual = { type: 'count', icon, points };
  const sorted: Visual = { type: 'count', icon, points: groupPoints(n) };
  return withAnswer(
    {
      id,
      family: COUNT_20,
      level,
      prompt: { terms: ['?'], textKey: 'task.prompt.count20' },
      display: { visual: shown },
      answer: n,
      hints: [
        { key: 'hint.count20.1' },
        { key: 'hint.count20.2', visual: sorted },
        { key: 'hint.count20.3', params: { n }, visual: sorted },
      ],
      strategyId: 'count_20',
      // je Anordnung eigene Schlüssel: Stufe 1 und 2 nehmen sich keine Zahlen weg
      dedupeKey: `count20:${layout}:${n}`,
    },
    [
      { value: n - 1, errorTag: 'count_skip' },
      { value: n + 1, errorTag: 'count_double' },
      { value: n + 2, errorTag: 'count_double' },
      { value: n - 2, errorTag: 'count_skip' },
    ],
    rng,
    params,
  );
};

// ---------------------------------------------------------------------------
// Blitzblick

/**
 * Stufe 1: Würfelbilder 1 bis 6 und Fingerbilder bis 10. Stufen 2 und 3 wie der Blitzblick
 * im Affenwald (Zehnerfeld bis 10, zwei Zehnerfelder bis 20) mit drei Antwortkarten.
 */
export const quickCount20: Generator = (level, rng, id, params): Task => {
  const flashMs = num(params, 'flashMs');
  if (level > 1) {
    // Karten und Fehlerarten neu: drei Karten, Fehler wie beim Zählen
    const {
      kind: _kind,
      options: _options,
      typicalErrors: _errors,
      ...base
    } = quickCount(level, rng, id, params);
    const n = base.answer as number;
    return withAnswer(
      { ...base, family: QUICK_COUNT_20, strategyId: 'quick_count_20' },
      [
        { value: n - 1, errorTag: 'count_skip' },
        { value: n + 1, errorTag: 'count_double' },
        ...(n > 5 ? [{ value: n - 5, errorTag: 'quick_five' }] : []),
        { value: n + 5, errorTag: 'quick_five' },
      ],
      rng,
      params,
    );
  }
  const fingers = rng.chance(share(params, 'fingerShare'));
  const n = fingers ? rng.int(2, 10) : rng.int(1, 6);
  const visual: Visual = fingers ? { type: 'fingers', n } : { type: 'dice', n };
  return withAnswer(
    {
      id,
      family: QUICK_COUNT_20,
      level,
      prompt: { terms: ['?'], textKey: 'task.prompt.quickCount' },
      display: { visual, flashMs },
      answer: n,
      hints: [
        { key: fingers ? 'hint.quick20.fingers.1' : 'hint.quick20.dice.1' },
        { key: 'hint.quick.2', visual },
        { key: 'hint.quick.3', params: { n }, visual },
      ],
      strategyId: 'quick_count_20',
      dedupeKey: `quick20:${visual.type}:${n}`,
    },
    [
      { value: n - 1, errorTag: 'count_skip' },
      { value: n + 1, errorTag: 'count_double' },
      ...(fingers && n > 5 ? [{ value: n - 5, errorTag: 'quick_five' }] : []),
      { value: n + 2, errorTag: 'count_double' },
    ],
    rng,
    params,
    10,
  );
};

// ---------------------------------------------------------------------------
// Plus und Minus bis 10

const tenframe = (first: number, second: number, op: '+' | '-'): Visual => ({
  type: 'tenframe',
  first,
  second,
  op,
});

/** Fehler bei Plus und Minus bis 10: verzählt, Rechenart vertauscht, eine Zahl abgeschrieben. */
function addSubErrors(m: MathInfo): TypicalError[] {
  const { a, b, result, op } = m;
  return [
    { value: op === '+' ? Math.abs(a - b) : a + b, errorTag: 'wrong_operation' },
    { value: result + 1, errorTag: 'off_by_one' },
    { value: result - 1, errorTag: 'off_by_one' },
    { value: op === '+' ? Math.max(a, b) : a, errorTag: 'operand_echo' },
  ];
}

function addSubTask(m: MathInfo, id: string, level: TaskLevel) {
  const p = { a: m.a, b: m.b, result: m.result, op: m.op };
  const plus = m.op === '+';
  return {
    id,
    family: ADDSUB_10,
    level,
    prompt: { terms: [m.a, m.op, m.b, '=', '?'] as Task['prompt']['terms'] },
    answer: m.result,
    hints: [
      { key: plus ? 'hint.addsub10.plus.1' : 'hint.addsub10.minus.1', params: p },
      {
        key: plus ? 'hint.addsub10.plus.2' : 'hint.addsub10.minus.2',
        params: p,
        visual: tenframe(m.a, m.b, m.op),
      },
      { key: 'hint.addsub10.3', params: p, visual: tenframe(m.a, m.b, m.op) },
    ] as Task['hints'],
    strategyId: plus ? 'addsub10_plus' : 'addsub10_minus',
    math: m,
    dedupeKey: plus ? `as10:+:${Math.min(m.a, m.b)}:${Math.max(m.a, m.b)}` : `as10:-:${m.a}:${m.b}`,
  } satisfies Omit<Task, 'kind'>;
}

function plus(rng: Rng): MathInfo {
  const a = rng.int(1, 8);
  const b = rng.int(1, 10 - a);
  return { op: '+', a, b, result: a + b, missing: 'result', carry: false };
}

function minus(rng: Rng): MathInfo {
  const a = rng.int(3, 10);
  const b = rng.int(1, a - 1);
  return { op: '-', a, b, result: a - b, missing: 'result', carry: false };
}

/**
 * Stufe 1: Plus bis 10 mit Bild, ein Teil als Bildrechengeschichte. Stufe 2: Minus bis 10
 * mit Bild (Weggenommenes durchgestrichen). Stufe 3: gemischt ohne Bild, ein Teil als
 * Umkehraufgabe (aus 4 + 5 = 9 wird 9 − 5).
 */
export const addSub10: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['plus', 'minus', 'mixed'] as const);
  const m =
    mode === 'plus'
      ? plus(rng)
      : mode === 'minus'
        ? minus(rng)
        : rng.chance(0.5)
          ? plus(rng)
          : minus(rng);
  const errors = addSubErrors(m);

  if (mode !== 'mixed' && rng.chance(share(params, 'storyShare'))) {
    const op = m.op === '+' ? 'add' : 'sub';
    const task = storyTask(
      {
        family: ADDSUB_10,
        level,
        id,
        op,
        values: { a: m.a, b: m.b },
        answer: m.result,
        equation: `${m.a} ${m.op === '+' ? '+' : '−'} ${m.b} = ?`,
        picture: m.op === '+' ? { groups: [m.a, m.b] } : { groups: [m.a], crossed: m.b },
        errors,
        math: m,
      },
      rng,
      params,
    );
    if (task.options)
      task.options = optionsFromErrors(m.result, task.typicalErrors ?? [], rng, CARDS);
    return task;
  }

  const base = addSubTask(m, id, level);
  if (mode === 'mixed') {
    if (m.op === '-' && rng.chance(share(params, 'inverseShare'))) {
      return withAnswer(
        {
          ...base,
          prompt: {
            ...base.prompt,
            textKey: 'task.prompt.inverse',
            textParams: { known: `${m.result} + ${m.b} = ${m.a}` },
          },
          dedupeKey: `${base.dedupeKey}:inv`,
        },
        errors,
        rng,
        params,
        10,
      );
    }
    return withAnswer(base, errors, rng, params, 10);
  }
  const icon = rng.pick(PETTING_ICONS);
  return withAnswer(
    {
      ...base,
      prompt: {
        ...base.prompt,
        picture:
          m.op === '+' ? { icon, groups: [m.a, m.b] } : { icon, groups: [m.a], crossed: m.b },
      },
    },
    errors,
    rng,
    params,
    10,
  );
};

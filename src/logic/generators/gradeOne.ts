import { optionsFromErrors } from '../options';
import { choice, share } from '../params';
import type { Rng } from '../rng';
import { plusFacts20 } from './plusFacts20';
import { CARDS, PETTING_ICONS, rowPoints, withAnswer } from './streichelzoo';
import type { FamilyParams } from '../../types/content';
import type {
  Generator,
  Hint,
  MathInfo,
  ShapeColor,
  ShapeKind,
  ShapeSpec,
  Task,
  TaskOption,
  TypicalError,
  Visual,
} from '../../types/task';

/**
 * Eselweide und Ponyhof im Streichelzoo (Klasse 1, docs/streichelzoo-klasse-1.md,
 * Abschnitte 4 und 6): Zerlegen, Plus und Minus bis 20, Formen; dazu eine Hülle, mit der
 * Klasse-2-Generatoren (Lagewörter, Muster, Geld, Uhr) mit eigenen Parametern laufen.
 */
export const DECOMPOSE_10 = 'decompose_10';
export const ADDSUB_20 = 'addsub_20';
export const SHAPES_1 = 'shapes_1';

/**
 * Eine Aufgabe eines anderen Themas für Klasse 1 umschreiben: eigene Familie (Sicherheit und
 * Stufe getrennt von Klasse 2) und höchstens drei Antwortkarten (die richtige bleibt immer).
 */
export function forGradeOne(task: Task, family: string): Task {
  const out: Task = { ...task, family };
  const options = task.options;
  if (!options || options.length <= CARDS) return out;
  const right = options.find((o) => o.value === String(task.answer));
  if (!right) return out;
  const wrong = options.filter((o) => o !== right).slice(0, CARDS - 1);
  out.options = options.filter((o) => o === right || wrong.includes(o));
  return out;
}

/** Hülle: ein vorhandener Generator mit den Parametern des Klasse-1-Themas. */
export const gradeOneFrom =
  (generator: Generator, family: string): Generator =>
  (level, rng, id, params) =>
    forGradeOne(generator(level, rng, id, params), family);

/** Karten neu mischen: höchstens drei, aus den typischen Fehlern der Aufgabe. */
function threeCards(task: Task, rng: Rng): Task {
  if (!task.options) return task;
  return {
    ...task,
    options: optionsFromErrors(task.answer as number, task.typicalErrors ?? [], rng, CARDS),
  };
}

// ---------------------------------------------------------------------------
// Zerlegen

/**
 * Stufe 1: Zahlen 3 bis 6 zerlegen; ein Teil der Tiere hat schon einen Haken, wie viele
 * fehlen noch? Stufe 2: Zahlenhaus bis 10. Stufe 3: Zehnerfreunde (7 + ? = 10).
 * Stufen 2 und 3 nutzen das Einspluseins des Pinguinfelsens (Stufe 1) mit eigenen Anteilen.
 */
export const decompose10: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['picture', 'house', 'ten'] as const);
  if (mode !== 'picture') {
    const base = plusFacts20(1, rng, id, params);
    return threeCards({ ...base, family: DECOMPOSE_10, level }, rng);
  }
  const n = rng.int(3, 6);
  const k = rng.int(1, n - 1);
  const icon = rng.pick(PETTING_ICONS);
  const visual: Visual = {
    type: 'count',
    icon,
    points: rowPoints(n),
    marked: Array.from({ length: k }, (_, i) => i),
  };
  const m: MathInfo = { op: '+', a: k, b: n - k, result: n, missing: 'b', carry: false };
  return withAnswer(
    {
      id,
      family: DECOMPOSE_10,
      level,
      prompt: { terms: [k, '+', '?', '=', n], textKey: 'task.prompt.decompose' },
      display: { visual },
      answer: n - k,
      hints: [
        { key: 'hint.decompose1.1', params: { n, k } },
        {
          key: 'hint.decompose1.2',
          params: { n, k },
          visual: { type: 'tenframe', first: k, second: n - k, op: '+' },
        },
        { key: 'hint.decompose1.3', params: { n, k, rest: n - k } },
      ],
      strategyId: 'decompose',
      math: m,
      dedupeKey: `decomp:${n}:${k}`,
    },
    [
      { value: n, errorTag: 'decompose_sum' },
      { value: k, errorTag: 'operand_echo' },
      { value: n - k + 1, errorTag: 'off_by_one' },
      { value: n - k - 1, errorTag: 'off_by_one' },
    ],
    rng,
    params,
    10,
  );
};

// ---------------------------------------------------------------------------
// Plus und Minus bis 20

const tenframe = (first: number, second: number, op: '+' | '-'): Visual => ({
  type: 'tenframe',
  first,
  second,
  op,
});

function mathTask(
  m: MathInfo,
  id: string,
  level: Task['level'],
  hints: [Hint, Hint, Hint],
  strategyId: string,
): Omit<Task, 'kind' | 'options' | 'typicalErrors'> {
  return {
    id,
    family: ADDSUB_20,
    level,
    prompt: { terms: [m.a, m.op, m.b, '=', '?'] },
    answer: m.result,
    hints,
    strategyId,
    math: m,
    dedupeKey:
      m.op === '+' ? `as20:+:${Math.min(m.a, m.b)}:${Math.max(m.a, m.b)}` : `as20:-:${m.a}:${m.b}`,
  };
}

/** Ohne Zehnerübergang: 13 + 4 ist wie 3 + 4, 17 − 5 ist wie 7 − 5. */
function analog(level: Task['level'], rng: Rng, id: string, params: FamilyParams): Task {
  const ones = rng.int(1, 8);
  const plus = rng.chance(0.5);
  const b = plus ? rng.int(1, 9 - ones) : rng.int(1, ones);
  const a = 10 + ones;
  const result = plus ? a + b : a - b;
  const m: MathInfo = { op: plus ? '+' : '-', a, b, result, missing: 'result', carry: false };
  const small = { a: ones, b, result: result - 10, op: m.op };
  return withAnswer(
    mathTask(
      m,
      id,
      level,
      [
        { key: 'hint.addsub20.analog.1', params: small },
        {
          key: 'hint.addsub20.analog.2',
          params: { a, b, op: m.op },
          visual: tenframe(a, b, m.op),
        },
        { key: 'hint.addsub20.3', params: { a, b, op: m.op, result } },
      ],
      'addsub20_analog',
    ),
    [
      { value: result - 10, errorTag: 'teen_ten' },
      { value: plus ? a - b : a + b, errorTag: 'wrong_operation' },
      { value: result + 1, errorTag: 'off_by_one' },
      { value: result - 1, errorTag: 'off_by_one' },
    ],
    rng,
    params,
  );
}

/** Verdoppeln bis 10 + 10 und Fast-Verdoppeln (6 + 7 = 6 + 6 + 1). */
function doubles(level: Task['level'], rng: Rng, id: string, params: FamilyParams): Task {
  const near = rng.chance(share(params, 'nearShare'));
  const a = near ? rng.int(1, 9) : rng.int(1, 10);
  const b = near ? a + 1 : a;
  const [x, y] = rng.chance(0.5) ? [a, b] : [b, a];
  const m: MathInfo = { op: '+', a: x, b: y, result: a + b, missing: 'result', carry: a + b > 10 };
  return withAnswer(
    mathTask(
      m,
      id,
      level,
      [
        near
          ? { key: 'hint.addsub20.near.1', params: { a, double: 2 * a } }
          : { key: 'hint.addsub20.double.1', params: { a } },
        { key: 'hint.addsub20.double.2', params: { a }, visual: tenframe(a, b, '+') },
        { key: 'hint.addsub20.3', params: { a: x, b: y, op: '+', result: a + b } },
      ],
      near ? 'addsub20_near_double' : 'addsub20_double',
    ),
    [
      { value: near ? 2 * a : a + b + 1, errorTag: near ? 'near_double' : 'off_by_one' },
      { value: a + b - 1, errorTag: 'off_by_one' },
      { value: a, errorTag: 'operand_echo' },
    ],
    rng,
    params,
  );
}

/**
 * Stufe 1: ohne Zehnerübergang, analog zum kleinen Einspluseins. Stufe 2: Verdoppeln und
 * Fast-Verdoppeln. Stufe 3: Zehnerübergang mit Zehnerfeld und Umkehraufgaben (wie das
 * Einspluseins im Pinguinfelsen, Stufe 3).
 */
export const addSub20: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['analog', 'double', 'crossing'] as const);
  if (mode === 'analog') return analog(level, rng, id, params);
  if (mode === 'double') return doubles(level, rng, id, params);
  const base = plusFacts20(3, rng, id, params);
  return threeCards({ ...base, family: ADDSUB_20, level }, rng);
};

// ---------------------------------------------------------------------------
// Formen

const KINDS: ShapeKind[] = ['circle', 'triangle', 'square', 'rect'];
const COLORS: ShapeColor[] = ['red', 'blue', 'yellow', 'green'];

function shape(rng: Rng, kind: ShapeKind): ShapeSpec {
  return {
    kind,
    color: rng.pick(COLORS),
    size: rng.pick(['s', 'm', 'l'] as const),
    rot: rng.pick([0, 0, 15, 30]),
  };
}

/** Drei Karten mit Formen: die gesuchte und zwei andere (Quadrat und Rechteck verwechselt). */
function shapeCards(rng: Rng, kind: ShapeKind): TaskOption[] {
  const others = rng.shuffle(KINDS.filter((k) => k !== kind));
  // Quadrat und Rechteck möglichst gemeinsam zeigen: die typische Verwechslung
  const twin: ShapeKind | undefined =
    kind === 'square' ? 'rect' : kind === 'rect' ? 'square' : undefined;
  const wrong = twin ? [twin, ...others.filter((k) => k !== twin)].slice(0, 2) : others.slice(0, 2);
  return rng.shuffle([
    { value: kind, shape: shape(rng, kind) },
    ...wrong.map((k) => ({
      value: k,
      shape: shape(rng, k),
      errorTag: k === twin ? 'shape_square_rect' : 'shape_name',
    })),
  ]);
}

/**
 * Stufe 1: die gleiche Form finden (andere Farbe, Größe, Drehung). Stufe 2: die genannte Form
 * antippen (vorgelesen). Stufe 3: Formen im Bild zählen. Ohne Fachbegriffe Ecke und Seite.
 */
export const shapes1: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['same', 'hear', 'count'] as const);
  const kind = rng.pick(KINDS);
  const name = `@shape.${kind}`;
  if (mode === 'count') {
    const items = Array.from({ length: rng.int(5, 7) }, () => shape(rng, rng.pick(KINDS)));
    if (!items.some((s) => s.kind === kind)) items[rng.int(0, items.length - 1)] = shape(rng, kind);
    const n = items.filter((s) => s.kind === kind).length;
    const visual: Visual = { type: 'shapes', items };
    const errors: TypicalError[] = [
      { value: n + 1, errorTag: 'count_double' },
      { value: n - 1, errorTag: 'count_skip' },
      { value: items.length, errorTag: 'shape_all' },
    ];
    return withAnswer(
      {
        id,
        family: SHAPES_1,
        level,
        prompt: { terms: ['?'], textKey: `task.prompt.shape.count.${kind}` },
        display: { visual },
        answer: n,
        hints: [
          { key: 'hint.shapes1.count.1', params: { name } },
          { key: 'hint.shapes1.count.2', params: { name }, visual },
          { key: 'hint.shapes1.count.3', params: { n, name } },
        ],
        strategyId: 'shapes_1',
        dedupeKey: `shapes1:count:${items.map((s) => s.kind).join(',')}:${kind}`,
      },
      errors,
      rng,
      params,
      10,
    );
  }
  const shown = shape(rng, kind);
  return {
    id,
    family: SHAPES_1,
    level,
    kind: 'choice',
    prompt:
      mode === 'same'
        ? { terms: [], textKey: 'task.prompt.shapes1.same' }
        : { terms: [], textKey: 'task.prompt.shapes1.hear', textParams: { name } },
    ...(mode === 'same' ? { display: { visual: { type: 'shapes', items: [shown] } } } : {}),
    answer: kind,
    options: shapeCards(rng, kind),
    hints: [
      { key: `hint.shapes1.${mode}.1` },
      { key: `hint.shape.name.2.${kind}` },
      { key: 'hint.shape.name.3', params: { name } },
    ],
    strategyId: 'shapes_1',
    dedupeKey: `shapes1:${mode}:${kind}:${shown.color}:${shown.size}`,
  };
};

import { optionsFromErrors } from '../options';
import { choice, kindShare } from '../params';
import type { Rng } from '../rng';
import type {
  CellFigure,
  Generator,
  ShapeColor,
  ShapeKind,
  ShapeSpec,
  Task,
  TaskOption,
  TypicalError,
} from '../../types/task';

/**
 * Schmetterlingshaus, erster Teil (KE Raum und Form):
 * - shapes_basic: Formen benennen, Ecken und Seiten zählen, Formen zählen, Rätsel
 * - pattern_continue: Formenmuster fortsetzen (AB, ABC/AAB mit Lücke, zwei Merkmale)
 * - symmetry_check: Achsensymmetrie erkennen (ja/nein, knappe Fälle, Achse finden)
 * - area_count: Flächen auslegen und vergleichen, Umfang zählen (Klärung mit der Lehrkraft:
 *   Flächeninhalt und Umfang gehören zu Klasse 2)
 */
export const SHAPES_BASIC = 'shapes_basic';
export const PATTERN_CONTINUE = 'pattern_continue';
export const SYMMETRY_CHECK = 'symmetry_check';
export const AREA_COUNT = 'area_count';

const KINDS: ShapeKind[] = ['circle', 'triangle', 'square', 'rect'];
const COLORS: ShapeColor[] = ['red', 'blue', 'yellow', 'green'];
const CORNERS: Record<ShapeKind, number> = { circle: 0, triangle: 3, square: 4, rect: 4 };

function randomShape(rng: Rng, kind?: ShapeKind): ShapeSpec {
  return {
    kind: kind ?? rng.pick(KINDS),
    color: rng.pick(COLORS),
    size: rng.pick(['s', 'm', 'l'] as const),
    rot: rng.pick([0, 0, 15, 30, 45]),
  };
}

const nameOption = (kind: ShapeKind, right: boolean, errorTag = 'shape_name'): TaskOption => ({
  value: kind,
  label: { key: `shape.${kind}` },
  ...(right ? {} : { errorTag }),
});

// ---------------------------------------------------------------------------
// Formen

export const shapesBasic: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['name', 'corners', 'count'] as const);
  const base = { id, family: SHAPES_BASIC, level, strategyId: SHAPES_BASIC };
  if (mode === 'name') {
    const shape = randomShape(rng);
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.shape.name' },
      display: { visual: { type: 'shapes', items: [shape] } },
      answer: shape.kind,
      options: rng.shuffle(
        KINDS.map((k) =>
          nameOption(
            k,
            k === shape.kind,
            (k === 'square' && shape.kind === 'rect') || (k === 'rect' && shape.kind === 'square')
              ? 'shape_square_rect'
              : 'shape_name',
          ),
        ),
      ),
      hints: [
        { key: 'hint.shape.name.1' },
        { key: `hint.shape.name.2.${shape.kind}` },
        { key: 'hint.shape.name.3', params: { name: `@shape.${shape.kind}` } },
      ],
      dedupeKey: `shape:name:${shape.kind}:${shape.color}:${shape.size}:${shape.rot}`,
    };
  }
  if (mode === 'corners') {
    const shape = randomShape(rng);
    const what = rng.pick(['corners', 'sides'] as const);
    const answer = CORNERS[shape.kind];
    const errors: TypicalError[] = [
      { value: answer + 1, errorTag: 'ones_off' },
      { value: Math.max(0, answer - 1), errorTag: 'ones_off' },
      { value: shape.kind === 'triangle' ? 4 : 3, errorTag: 'shape_name' },
    ].filter((e, i, all) => e.value !== answer && all.findIndex((f) => f.value === e.value) === i);
    const cards = rng.chance(kindShare(params, 'choice'));
    return {
      ...base,
      kind: cards ? 'choice' : 'number-input',
      prompt: { terms: ['?'], textKey: `task.prompt.shape.${what}` },
      display: { visual: { type: 'shapes', items: [shape] } },
      answer,
      ...(cards ? { options: optionsFromErrors(answer, errors, rng, 3) } : {}),
      typicalErrors: errors,
      hints: [
        { key: `hint.shape.${what}.1` },
        { key: `hint.shape.${what}.2.${shape.kind}` },
        { key: `hint.shape.${what}.3`, params: { n: answer, name: `@shape.${shape.kind}` } },
      ],
      dedupeKey: `shape:${what}:${shape.kind}:${shape.color}:${shape.size}:${shape.rot}`,
    };
  }
  // Formen im Bild zählen oder ein Rätsel lösen
  if (rng.chance(0.5)) {
    const target = rng.pick(KINDS);
    const items = Array.from({ length: rng.int(5, 7) }, () => randomShape(rng));
    const n = items.filter((s) => s.kind === target).length;
    if (n === 0) items[rng.int(0, items.length - 1)] = randomShape(rng, target);
    const answer = items.filter((s) => s.kind === target).length;
    const confusable = target === 'square' ? 'rect' : target === 'rect' ? 'square' : undefined;
    const errors: TypicalError[] = [
      ...(confusable
        ? [
            {
              value: answer + items.filter((s) => s.kind === confusable).length,
              errorTag: 'shape_square_rect',
            },
          ]
        : []),
      { value: answer + 1, errorTag: 'ones_off' },
      { value: answer - 1, errorTag: 'ones_off' },
    ].filter(
      (e, i, all) =>
        e.value > 0 && e.value !== answer && all.findIndex((f) => f.value === e.value) === i,
    );
    return {
      ...base,
      kind: 'number-input',
      prompt: { terms: ['?'], textKey: `task.prompt.shape.count.${target}` },
      display: { visual: { type: 'shapes', items } },
      answer,
      typicalErrors: errors,
      hints: [
        { key: `hint.shape.name.2.${target}` },
        { key: 'hint.shape.count.2' },
        { key: 'hint.shape.count.3', params: { n: answer, name: `@shape.plural.${target}` } },
      ],
      dedupeKey: `shape:count:${target}:${items.map((s) => s.kind[0]).join('')}`,
    };
  }
  const riddle = rng.pick(KINDS);
  return {
    ...base,
    kind: 'choice',
    prompt: { terms: [], textKey: `task.prompt.shape.riddle.${riddle}` },
    answer: riddle,
    options: rng.shuffle(
      KINDS.map((k) =>
        nameOption(
          k,
          k === riddle,
          (k === 'square' && riddle === 'rect') || (k === 'rect' && riddle === 'square')
            ? 'shape_square_rect'
            : 'shape_name',
        ),
      ),
    ),
    hints: [
      { key: 'hint.shape.riddle.1' },
      { key: `hint.shape.name.2.${riddle}` },
      { key: 'hint.shape.name.3', params: { name: `@shape.${riddle}` } },
    ],
    dedupeKey: `shape:riddle:${riddle}`,
  };
};

// ---------------------------------------------------------------------------
// Muster

const same = (a: ShapeSpec, b: ShapeSpec) => a.kind === b.kind && a.color === b.color;
const shapeValue = (s: ShapeSpec) => `${s.kind}-${s.color}`;

export const patternContinue: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['ab', 'abc', 'two'] as const);
  // Farbenblind-sicher: Rot und Grün kommen nie zusammen in einem Muster vor (auch nicht auf
  // den Karten), weil sie bei Rot-Grün-Schwäche gleich aussehen können.
  const COLORS: ShapeColor[] = rng.chance(0.5)
    ? ['red', 'blue', 'yellow']
    : ['green', 'blue', 'yellow'];
  let unit: ShapeSpec[];
  if (mode === 'two') {
    // zwei Merkmale: Form wiederholt sich nach 2, Farbe nach 3 → Muster nach 6
    const kinds = rng.shuffle(KINDS).slice(0, 2);
    const colors = rng.shuffle(COLORS).slice(0, 3);
    unit = Array.from({ length: 6 }, (_, i) => ({ kind: kinds[i % 2]!, color: colors[i % 3]! }));
  } else {
    const kinds = rng.shuffle(KINDS);
    const colors = rng.shuffle(COLORS);
    const parts =
      mode === 'ab'
        ? [0, 1]
        : rng.pick([
            [0, 1, 2],
            [0, 0, 1],
            [0, 1, 1],
          ]);
    // A und B unterscheiden sich in der Form, manchmal auch in der Farbe
    const varyColor = rng.chance(0.5);
    unit = parts.map((p) => ({ kind: kinds[p]!, color: varyColor ? colors[p]! : colors[0]! }));
  }
  const length = mode === 'two' ? 8 : mode === 'ab' ? 6 : 7;
  const sequence = Array.from({ length }, (_, i) => unit[i % unit.length]!);
  const gap = mode === 'abc' ? rng.int(3, length - 1) : length - 1;
  const answer = sequence[gap]!;
  // falsche Karten: gleiche Form in anderer Farbe, gleiche Farbe als andere Form, Nachbar im Muster
  const candidates: ShapeSpec[] = [
    sequence[gap - 1]!,
    {
      kind: answer.kind,
      color:
        COLORS.find(
          (c) => c !== answer.color && !unit.some((u) => u.kind === answer.kind && u.color === c),
        ) ?? COLORS.find((c) => c !== answer.color)!,
    },
    {
      kind:
        KINDS.find(
          (k) => k !== answer.kind && !unit.some((u) => u.kind === k && u.color === answer.color),
        ) ?? KINDS.find((k) => k !== answer.kind)!,
      color: answer.color,
    },
  ];
  const wrong = candidates.filter(
    (c, i) => !same(c, answer) && candidates.findIndex((d) => same(c, d)) === i,
  );
  const items = sequence.map((s, i) => (i === gap ? null : s));
  return {
    id,
    family: PATTERN_CONTINUE,
    level,
    kind: 'choice',
    prompt: {
      terms: [],
      textKey: gap === length - 1 ? 'task.prompt.pattern.next' : 'task.prompt.pattern.gap',
    },
    display: { visual: { type: 'shapes', items } },
    answer: shapeValue(answer),
    options: rng.shuffle([
      { value: shapeValue(answer), shape: answer },
      ...wrong
        .slice(0, 2)
        .map((w) => ({ value: shapeValue(w), shape: w, errorTag: 'pattern_wrong' })),
    ]),
    hints: [
      { key: 'hint.pattern.1' },
      { key: 'hint.pattern.2', params: { n: unit.length } },
      { key: 'hint.pattern.3', visual: { type: 'shapes', items: sequence } },
    ],
    strategyId: PATTERN_CONTINUE,
    dedupeKey: `pattern:${mode}:${sequence.map(shapeValue).join(',')}:${gap}`,
  };
};

// ---------------------------------------------------------------------------
// Symmetrie

const SIZE = 6;
type Axis = 'v' | 'h';

function key(c: number, r: number) {
  return `${c},${r}`;
}

function mirrorFigure(rng: Rng, axes: Axis[]): Set<string> {
  const cells = new Set<string>();
  const halfC = axes.includes('v') ? SIZE / 2 : SIZE;
  const halfR = axes.includes('h') ? SIZE / 2 : SIZE;
  for (let c = 0; c < halfC; c++) {
    for (let r = 0; r < halfR; r++) {
      if (!rng.chance(0.45)) continue;
      const mc = axes.includes('v') ? [c, SIZE - 1 - c] : [c];
      const mr = axes.includes('h') ? [r, SIZE - 1 - r] : [r];
      for (const cc of mc) for (const rr of mr) cells.add(key(cc, rr));
    }
  }
  return cells;
}

function isSymmetric(cells: Set<string>, axis: Axis): boolean {
  for (const k of cells) {
    const [c, r] = k.split(',').map(Number) as [number, number];
    const m = axis === 'v' ? key(SIZE - 1 - c, r) : key(c, SIZE - 1 - r);
    if (!cells.has(m)) return false;
  }
  return true;
}

function toFigure(cells: Set<string>): CellFigure {
  return {
    cols: SIZE,
    rows: SIZE,
    cells: [...cells].map((k) => k.split(',').map(Number) as [number, number]),
  };
}

/** Kippt `n` Kästchen auf einer Seite, damit die Figur nicht mehr symmetrisch ist. */
function breakSymmetry(rng: Rng, cells: Set<string>, axis: Axis, n: number): Set<string> {
  const out = new Set(cells);
  for (let i = 0; i < n; i++) {
    const c = axis === 'v' ? rng.int(0, SIZE / 2 - 1) : rng.int(0, SIZE - 1);
    const r = axis === 'h' ? rng.int(0, SIZE / 2 - 1) : rng.int(0, SIZE - 1);
    const k = key(c, r);
    if (out.has(k)) out.delete(k);
    else out.add(k);
  }
  return out;
}

export const symmetryCheck: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['yesno', 'near', 'axis'] as const);
  const base = { id, family: SYMMETRY_CHECK, level, strategyId: SYMMETRY_CHECK };
  if (mode === 'axis') {
    const kind = rng.pick(['v', 'h', 'both', 'none'] as const);
    let cells: Set<string>;
    for (;;) {
      cells =
        kind === 'both'
          ? mirrorFigure(rng, ['v', 'h'])
          : kind === 'none'
            ? breakSymmetry(rng, mirrorFigure(rng, ['v']), 'v', 3)
            : mirrorFigure(rng, [kind]);
      const v = isSymmetric(cells, 'v');
      const h = isSymmetric(cells, 'h');
      const actual = v && h ? 'both' : v ? 'v' : h ? 'h' : 'none';
      if (actual === kind && cells.size >= 6 && cells.size <= 26) break;
    }
    const options: TaskOption[] = (['v', 'h', 'both', 'none'] as const).map((k) => ({
      value: k,
      label: { key: `symmetry.axis.${k}` },
      ...(k === kind ? {} : { errorTag: 'symmetry_axis' }),
    }));
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.symmetry.axis' },
      display: { visual: { type: 'cells', figures: [toFigure(cells)] } },
      answer: kind,
      options,
      hints: [
        { key: 'hint.symmetry.1' },
        { key: 'hint.symmetry.axis.2' },
        {
          key: 'hint.symmetry.axis.3',
          params: { axis: `@symmetry.axis.${kind}` },
          ...(kind === 'v' || kind === 'h'
            ? { visual: { type: 'cells' as const, figures: [toFigure(cells)], axis: kind } }
            : {}),
        },
      ],
      dedupeKey: `sym:axis:${[...cells].sort().join(';')}`,
    };
  }
  const axis: Axis = mode === 'yesno' ? 'v' : rng.pick(['v', 'h'] as const);
  const symmetric = rng.chance(0.5);
  let cells: Set<string>;
  for (;;) {
    const mirrored = mirrorFigure(rng, [axis]);
    cells = symmetric ? mirrored : breakSymmetry(rng, mirrored, axis, mode === 'yesno' ? 3 : 1);
    if (isSymmetric(cells, axis) === symmetric && cells.size >= 6 && cells.size <= 26) break;
  }
  const answer = symmetric ? 'yes' : 'no';
  const figure = toFigure(cells);
  return {
    ...base,
    kind: 'choice',
    prompt: { terms: [], textKey: 'task.prompt.symmetry.yesno' },
    display: { visual: { type: 'cells', figures: [figure], axis } },
    answer,
    options: [
      {
        value: 'yes',
        label: { key: 'option.yes' },
        ...(symmetric ? {} : { errorTag: 'symmetry_wrong' }),
      },
      {
        value: 'no',
        label: { key: 'option.no' },
        ...(symmetric ? { errorTag: 'symmetry_wrong' } : {}),
      },
    ],
    hints: [
      { key: 'hint.symmetry.1' },
      { key: 'hint.symmetry.2' },
      { key: `hint.symmetry.3.${answer}` },
    ],
    dedupeKey: `sym:${axis}:${[...cells].sort().join(';')}`,
  };
};

// ---------------------------------------------------------------------------
// Flächen und Umfang

function rectangle(cols: number, rows: number, w: number, h: number, dx = 0, dy = 0): CellFigure {
  const cells: Array<[number, number]> = [];
  for (let c = 0; c < w; c++) for (let r = 0; r < h; r++) cells.push([c + dx, r + dy]);
  return { cols, rows, cells };
}

/** L-Form: Rechteck mit fehlender Ecke. */
function lShape(rng: Rng, w: number, h: number): CellFigure {
  const fig = rectangle(w, h, w, h);
  const cw = rng.int(1, w - 1);
  const ch = rng.int(1, h - 1);
  fig.cells = fig.cells.filter(([c, r]) => !(c >= w - cw && r < ch));
  return fig;
}

export const areaCount: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['count', 'compare', 'perimeter'] as const);
  const base = { id, family: AREA_COUNT, level, strategyId: `area_${mode}` };
  if (mode === 'compare') {
    // Welche Fläche ist größer? Oft ist die längere Figur nicht die größere.
    for (;;) {
      const a = rng.chance(0.5)
        ? rectangle(6, 6, rng.int(2, 6), rng.int(1, 3))
        : lShape(rng, rng.int(3, 5), rng.int(3, 5));
      const b = rng.chance(0.5)
        ? rectangle(6, 6, rng.int(1, 3), rng.int(2, 6))
        : lShape(rng, rng.int(3, 5), rng.int(3, 5));
      const na = a.cells.length;
      const nb = b.cells.length;
      if (Math.abs(na - nb) > 3) continue;
      const answer = na > nb ? 'left' : nb > na ? 'right' : 'same';
      return {
        ...base,
        kind: 'choice',
        prompt: { terms: [], textKey: 'task.prompt.area.compare' },
        display: { visual: { type: 'cells', figures: [a, b] } },
        answer,
        options: (['left', 'right', 'same'] as const).map((k) => ({
          value: k,
          label: { key: `area.${k}` },
          ...(k === answer ? {} : { errorTag: 'area_compare' }),
        })),
        hints: [
          { key: 'hint.area.compare.1' },
          { key: 'hint.area.compare.2', params: { a: na, b: nb } },
          { key: `hint.area.compare.3.${answer}`, params: { a: na, b: nb } },
        ],
        dedupeKey: `area:cmp:${JSON.stringify(a.cells)}:${JSON.stringify(b.cells)}`,
      };
    }
  }
  if (mode === 'perimeter') {
    const w = rng.int(2, 5);
    const h = rng.int(1, 4);
    const fig = rectangle(w, h, w, h);
    const answer = 2 * (w + h);
    const errors: TypicalError[] = [
      { value: w * h, errorTag: 'area_perimeter' },
      { value: w + h, errorTag: 'perimeter_half' },
      { value: answer - 4, errorTag: 'perimeter_corners' },
    ].filter((e, i, all) => e.value !== answer && all.findIndex((f) => f.value === e.value) === i);
    return {
      ...base,
      kind: 'number-input',
      prompt: { terms: ['?'], textKey: 'task.prompt.area.perimeter' },
      display: { visual: { type: 'cells', figures: [fig], outline: true } },
      answer,
      typicalErrors: errors,
      hints: [
        { key: 'hint.area.perimeter.1' },
        { key: 'hint.area.perimeter.2', params: { w, h } },
        { key: 'hint.area.perimeter.3', params: { w, h, answer } },
      ],
      dedupeKey: `area:per:${w}x${h}`,
    };
  }
  const rect = rng.chance(0.6);
  const w = rng.int(2, 5);
  const h = rng.int(2, 4);
  const fig = rect ? rectangle(w, h, w, h) : lShape(rng, w + 1, h);
  const answer = fig.cells.length;
  const errors: TypicalError[] = [
    { value: answer + 1, errorTag: 'ones_off' },
    { value: answer - 1, errorTag: 'ones_off' },
    ...(rect ? [{ value: w + h, errorTag: 'area_perimeter' }] : []),
  ].filter(
    (e, i, all) =>
      e.value > 0 && e.value !== answer && all.findIndex((f) => f.value === e.value) === i,
  );
  const cards = rng.chance(kindShare(params, 'choice'));
  return {
    ...base,
    kind: cards ? 'choice' : 'number-input',
    prompt: { terms: ['?'], textKey: 'task.prompt.area.count' },
    display: { visual: { type: 'cells', figures: [fig] } },
    answer,
    ...(cards ? { options: optionsFromErrors(answer, errors, rng, 3) } : {}),
    typicalErrors: errors,
    hints: [
      { key: 'hint.area.count.1' },
      rect ? { key: 'hint.area.count.2.rect', params: { w, h } } : { key: 'hint.area.count.2' },
      { key: 'hint.area.count.3', params: { answer } },
    ],
    dedupeKey: `area:count:${JSON.stringify(fig.cells)}`,
  };
};

export { same as sameShape };

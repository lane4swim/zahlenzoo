import { allVisible, frontView, heightsKey, mirror, sideView, total } from '../cubes';
import { choice } from '../params';
import type { Rng } from '../rng';
import type {
  Generator,
  Heights,
  SolidKind,
  SolidSpec,
  Task,
  TaskOption,
  TypicalError,
} from '../../types/task';

export const SOLIDS_BASIC = 'solids_basic';
export const CUBE_BUILDINGS = 'cube_buildings';

export const SOLIDS: SolidKind[] = ['cube', 'cuboid', 'sphere', 'cylinder', 'cone', 'pyramid'];

/** Körper, die Kinder leicht verwechseln, mit der passenden Rückmeldung. */
const PARTNER: Record<SolidKind, [SolidKind, string]> = {
  cube: ['cuboid', 'solid_cube_cuboid'],
  cuboid: ['cube', 'solid_cube_cuboid'],
  cone: ['pyramid', 'solid_cone_pyramid'],
  pyramid: ['cone', 'solid_cone_pyramid'],
  sphere: ['cylinder', 'solid_name'],
  cylinder: ['cone', 'solid_name'],
};

function errors(answer: number, list: Array<[number, string]>): TypicalError[] {
  const out: TypicalError[] = [];
  for (const [value, errorTag] of list) {
    if (value === answer || value < 0 || out.some((e) => e.value === value)) continue;
    out.push({ value, errorTag });
  }
  return out;
}

const look = (rng: Rng): SolidSpec['look'] => (rng.chance(0.5) ? 'object' : 'plain');

/** Eigenschaften für Stufe 3: passende Körper und Körper, die sicher nicht passen. */
const PROPS: Record<string, { yes: SolidKind[]; no: SolidKind[] }> = {
  roll: { yes: ['sphere', 'cylinder', 'cone'], no: ['cube', 'cuboid', 'pyramid'] },
  tip: { yes: ['cone', 'pyramid'], no: ['cube', 'cuboid', 'sphere', 'cylinder'] },
  squares: { yes: ['cube'], no: ['cuboid', 'pyramid', 'cylinder'] },
  stack: { yes: ['cube', 'cuboid'], no: ['sphere', 'cone', 'pyramid'] },
  curved: { yes: ['sphere'], no: ['cube', 'cuboid', 'pyramid'] },
};

/** Ecken und Flächen der eckigen Körper (Pyramide mit quadratischer Grundfläche). */
const COUNTS: Record<
  'cube' | 'cuboid' | 'pyramid',
  { corners: number; faces: number; edges: number }
> = {
  cube: { corners: 8, faces: 6, edges: 12 },
  cuboid: { corners: 8, faces: 6, edges: 12 },
  pyramid: { corners: 5, faces: 5, edges: 8 },
};
/** Von schräg oben sichtbar: so viele Ecken bzw. Flächen zählen Kinder oft. */
const VISIBLE: Record<
  'cube' | 'cuboid' | 'pyramid',
  { corners: number; faces: number; edges: number }
> = {
  cube: { corners: 7, faces: 3, edges: 9 },
  cuboid: { corners: 7, faces: 3, edges: 9 },
  pyramid: { corners: 4, faces: 2, edges: 5 },
};

export const solidsBasic: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['name', 'sort', 'props'] as const);
  const base = { id, family: SOLIDS_BASIC, level, strategyId: `solids_${mode}` };

  if (mode === 'name') {
    const kind = rng.pick(SOLIDS);
    const spec: SolidSpec = { kind, look: look(rng) };
    const [partner, tag] = PARTNER[kind];
    const other = rng.pick(SOLIDS.filter((k) => k !== kind && k !== partner));
    const options: TaskOption[] = rng.shuffle([kind, partner, other]).map((k) => ({
      value: k,
      label: { key: `solid.${k}` },
      ...(k === kind ? {} : { errorTag: k === partner ? tag : 'solid_name' }),
    }));
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: `task.prompt.solid.name.${spec.look}` },
      display: { visual: { type: 'solids', items: [spec] } },
      answer: kind,
      options,
      hints: [
        { key: 'hint.solid.name.1' },
        { key: `hint.solid.${kind}` },
        { key: 'hint.solid.name.3', params: { name: `@solid.a.${kind}` } },
      ],
      dedupeKey: `solid:name:${kind}:${spec.look}:${options.map((o) => o.value).join(',')}`,
    };
  }

  if (mode === 'sort') {
    const kind = rng.pick(SOLIDS);
    const hits = rng.int(2, 3);
    const [partner] = PARTNER[kind];
    const others = [
      partner,
      ...rng.shuffle(SOLIDS.filter((k) => k !== kind && k !== partner)),
    ].slice(0, 6 - hits);
    const kinds = rng.shuffle([...Array<SolidKind>(hits).fill(kind), ...others]);
    const items: SolidSpec[] = kinds.map((k) => ({ kind: k, look: look(rng) }));
    const answer = kinds.flatMap((k, i) => (k === kind ? [i] : []));
    return {
      ...base,
      kind: 'select',
      prompt: { terms: [], textKey: `task.prompt.solid.pick.${kind}` },
      select: items,
      answer,
      unordered: true,
      hints: [
        { key: 'hint.solid.pick.1' },
        { key: `hint.solid.${kind}` },
        { key: 'hint.solid.pick.3', params: { n: hits, plural: `@solid.plural.${kind}` } },
      ],
      dedupeKey: `solid:sort:${items.map((i) => `${i.kind}.${i.look}`).join(',')}`,
    };
  }

  if (rng.chance(0.6)) {
    const prop = rng.pick(Object.keys(PROPS));
    const { yes, no } = PROPS[prop]!;
    const right = rng.pick(yes);
    const wrong = rng.shuffle(no).slice(0, 2);
    const options: TaskOption[] = rng.shuffle([right, ...wrong]).map((k) => ({
      value: k,
      solid: { kind: k, look: 'plain' },
      ...(k === right ? {} : { errorTag: 'solid_property' }),
    }));
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: `task.prompt.solid.prop.${prop}` },
      answer: right,
      options,
      hints: [
        { key: `hint.solid.prop.${prop}.1` },
        { key: `hint.solid.prop.${prop}.2` },
        { key: 'hint.solid.prop.3', params: { name: `@solid.a.${right}` } },
      ],
      dedupeKey: `solid:prop:${prop}:${options.map((o) => o.value).join(',')}`,
    };
  }
  const kind = rng.pick(['cube', 'cuboid', 'pyramid'] as const);
  const what = rng.pick(['corners', 'faces', 'edges'] as const);
  const n = COUNTS[kind][what];
  return {
    ...base,
    kind: 'number-input',
    prompt: {
      terms: ['?'],
      textKey: `task.prompt.solid.count.${what}`,
      textParams: { name: `@solid.the.${kind}` },
    },
    display: { visual: { type: 'solids', items: [{ kind, look: 'plain' }] } },
    answer: n,
    typicalErrors: errors(n, [[VISIBLE[kind][what], 'solid_hidden']]),
    hints: [
      { key: `hint.solid.count.${what}.1` },
      { key: 'hint.solid.count.2' },
      { key: `hint.solid.count.${kind}.${what}` },
    ],
    dedupeKey: `solid:count:${kind}:${what}`,
  };
};

// ---------------------------------------------------------------------------
// Würfelbauten

/** Zufälliges Gebäude: cells Felder belegt, Höhen 1 bis maxH. */
function building(rng: Rng, cells: number, maxH: number): Heights {
  const h: Heights = Array<number>(9).fill(0);
  for (const i of rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, cells)) h[i] = rng.int(1, maxH);
  return h;
}

const planOptions = (rng: Rng, h: Heights): TaskOption[] => {
  const wrong: Array<[Heights, string]> = [];
  const m = mirror(h);
  if (heightsKey(m) !== heightsKey(h)) wrong.push([m, 'plan_mirrored']);
  const filled = h.flatMap((v, i) => (v > 0 ? [i] : []));
  for (const i of rng.shuffle(filled)) {
    if (wrong.length >= 2) break;
    const v = h[i]!;
    const c = [...h];
    c[i] = v >= 3 ? v - 1 : v + 1;
    if (!wrong.some(([w]) => heightsKey(w) === heightsKey(c))) wrong.push([c, 'plan_count']);
  }
  return rng.shuffle([
    { value: heightsKey(h), plan: h },
    ...wrong.slice(0, 2).map(([p, tag]) => ({ value: heightsKey(p), plan: p, errorTag: tag })),
  ]);
};

export const cubeBuildings: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['count', 'hidden', 'plan'] as const);
  const base = { id, family: CUBE_BUILDINGS, level };

  if (mode === 'count') {
    let h: Heights;
    do h = building(rng, rng.int(3, 5), 2);
    while (!allVisible(h) || total(h) < 4 || total(h) > 8);
    const n = total(h);
    const towers = h.filter((v) => v > 0).length;
    return {
      ...base,
      kind: 'number-input',
      strategyId: 'cubes_count',
      prompt: { terms: ['?'], textKey: 'task.prompt.cubes.count' },
      display: { visual: { type: 'building', heights: h } },
      answer: n,
      typicalErrors: errors(n, [
        [towers, 'cube_tops'],
        [n - 1, 'ones_off'],
        [n + 1, 'ones_off'],
      ]),
      hints: [
        { key: 'hint.cubes.count.1' },
        { key: 'hint.cubes.count.2', params: { towers } },
        { key: 'hint.cubes.count.3', params: { n } },
      ],
      dedupeKey: `cubes:count:${heightsKey(h)}`,
    };
  }

  if (mode === 'hidden') {
    if (rng.chance(0.5)) {
      // größere Gebäude mit Türmen bis 3 hoch, aber jeder Würfel bleibt sichtbar
      let h: Heights;
      do h = building(rng, rng.int(4, 6), 3);
      while (!allVisible(h) || Math.max(...h) < 3 || total(h) < 6 || total(h) > 12);
      const n = total(h);
      const towers = h.filter((v) => v > 0).length;
      return {
        ...base,
        kind: 'number-input',
        strategyId: 'cubes_count',
        prompt: { terms: ['?'], textKey: 'task.prompt.cubes.count' },
        display: { visual: { type: 'building', heights: h } },
        answer: n,
        typicalErrors: errors(n, [
          [towers, 'cube_tops'],
          [n - 1, 'ones_off'],
          [n + 1, 'ones_off'],
        ]),
        hints: [
          { key: 'hint.cubes.count.1' },
          { key: 'hint.cubes.count.2', params: { towers } },
          { key: 'hint.cubes.count.3', params: { n } },
        ],
        dedupeKey: `cubes:count:${heightsKey(h)}`,
      };
    }
    let h: Heights;
    do h = building(rng, rng.int(3, 5), 3);
    while (!allVisible(h) || heightsKey(mirror(h)) === heightsKey(h) || total(h) < 5);
    return {
      ...base,
      kind: 'choice',
      strategyId: 'cubes_plan',
      prompt: { terms: [], textKey: 'task.prompt.cubes.whichPlan' },
      display: { visual: { type: 'building', heights: h, marks: true } },
      answer: heightsKey(h),
      options: planOptions(rng, h),
      hints: [
        { key: 'hint.cubes.plan.1' },
        { key: 'hint.cubes.plan.2' },
        { key: 'hint.cubes.plan.3' },
      ],
      dedupeKey: `cubes:plan:${heightsKey(h)}`,
    };
  }

  // Stufe 3: nach Plan bauen, Bauplan schreiben oder Ansicht wählen
  const kind = rng.pick(['build', 'write', 'views'] as const);
  if (kind === 'views') {
    let h: Heights;
    let side: boolean;
    let right: number[];
    let wrong: Array<[number[], string]>;
    for (;;) {
      h = building(rng, rng.int(4, 6), 3);
      side = rng.chance(0.4);
      right = side ? sideView(h) : frontView(h);
      const other = side ? frontView(h) : sideView(h);
      const mirrored = [...right].reverse();
      wrong = [
        [other, 'view_side'],
        [mirrored, 'view_mirrored'],
      ];
      const keys = [right, ...wrong.map((w) => w[0])].map((v) => v.join(','));
      if (new Set(keys).size === 3) break;
    }
    const view = side ? 'side' : 'front';
    return {
      ...base,
      kind: 'choice',
      strategyId: 'cubes_views',
      prompt: { terms: [], textKey: `task.prompt.cubes.view.${view}` },
      display: { visual: { type: 'building', heights: h, marks: true } },
      answer: right.join(','),
      options: rng.shuffle([
        { value: right.join(','), view: right },
        ...wrong.map(([v, tag]) => ({ value: v.join(','), view: v, errorTag: tag })),
      ]),
      hints: [
        { key: `hint.cubes.view.${view}.1` },
        { key: 'hint.cubes.view.2' },
        { key: 'hint.cubes.view.3', params: { a: right[0]!, b: right[1]!, c: right[2]! } },
      ],
      dedupeKey: `cubes:view:${view}:${heightsKey(h)}`,
    };
  }
  let h: Heights;
  // Bauplan schreiben: Das Kind liest jeden Turm am Bild ab, also muss jeder Würfel sichtbar sein.
  do h = building(rng, rng.int(3, 6), 3);
  while (total(h) < 5 || total(h) > 14 || (kind === 'write' && !allVisible(h)));
  const m = mirror(h);
  return {
    ...base,
    kind: 'build',
    strategyId: kind === 'build' ? 'cubes_build' : 'cubes_write',
    prompt: { terms: [], textKey: `task.prompt.cubes.${kind}` },
    build: { mode: kind === 'build' ? 'build' : 'plan', target: h },
    answer: h,
    ...(heightsKey(m) !== heightsKey(h)
      ? { errorAnswers: [{ value: heightsKey(m), errorTag: 'plan_mirrored' }] }
      : {}),
    hints: [
      { key: `hint.cubes.${kind}.1` },
      { key: `hint.cubes.${kind}.2`, params: { n: total(h) } },
      { key: `hint.cubes.${kind}.3` },
    ],
    dedupeKey: `cubes:${kind}:${heightsKey(h)}`,
  };
};

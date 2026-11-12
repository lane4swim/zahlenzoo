import { cellsKey, mirrorCells, normalizeShape, walk, MOVES, type Move } from '../grid';
import { choice } from '../params';
import type { Rng } from '../rng';
import type { Cell, Generator, Hint, Task, TaskOption } from '../../types/task';

export const GRID_DRAW = 'grid_draw';
export const SPACE_ORIENTATION = 'space_orientation';

const k = ([c, r]: Cell) => `${c}:${r}`;

/** Zusammenhängende Figur aus n Kästchen in einem Feld cols × rows. */
function growFigure(rng: Rng, n: number, cols: number, rows: number, seed?: Cell): Cell[] {
  const start: Cell = seed ?? [rng.int(0, cols - 1), rng.int(0, rows - 1)];
  const cells: Cell[] = [start];
  const have = new Set([k(start)]);
  for (let guard = 0; cells.length < n && guard < 200; guard++) {
    const [c, r] = rng.pick(cells);
    const [dc, dr] = rng.pick(Object.values(MOVES));
    const next: Cell = [c + dc, r + dr];
    if (next[0] < 0 || next[1] < 0 || next[0] >= cols || next[1] >= rows) continue;
    if (have.has(k(next))) continue;
    have.add(k(next));
    cells.push(next);
  }
  return cells;
}

const rowsOf = (cells: readonly Cell[]) => new Set(cells.map((c) => c[1])).size;

// ---------------------------------------------------------------------------
// Kästchen malen

export const gridDraw: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['copy', 'mirror', 'rect'] as const);
  const base = { id, family: GRID_DRAW, level, kind: 'grid' as const, strategyId: `grid_${mode}` };

  if (mode === 'copy') {
    let cells: Cell[];
    do cells = growFigure(rng, rng.int(4, 7), 4, 4);
    while (rowsOf(cells) < 2);
    const shifted = cells.map(([c, r]) => [c + 1, r] as Cell);
    const mirrored = normalizeShape(mirrorCells(cells, 'v', 4));
    const top = Math.min(...cells.map((c) => c[1]));
    const first = cells.filter((c) => c[1] === top).length;
    return {
      ...base,
      prompt: { terms: [], textKey: 'task.prompt.grid.copy' },
      grid: {
        mode: 'cells',
        board: { cols: 5, rows: 5 },
        model: { cols: 5, rows: 5, cells: shifted },
        rule: { type: 'shape', cells: shifted },
      },
      answer: cellsKey(shifted),
      ...(mirrored !== normalizeShape(cells)
        ? { errorAnswers: [{ value: mirrored, errorTag: 'grid_mirrored' }] }
        : {}),
      hints: [
        { key: 'hint.grid.copy.1' },
        { key: 'hint.grid.copy.2', params: { n: cells.length, rows: rowsOf(cells) } },
        { key: 'hint.grid.copy.3', params: { first } },
      ],
      dedupeKey: `grid:copy:${normalizeShape(cells)}`,
    };
  }

  if (mode === 'mirror') {
    // Hälfte an der Achse ergänzen: senkrechte Achse (6 × 5) oder waagerechte (5 × 6)
    const axis = rng.pick(['v', 'v', 'h'] as const);
    const half: Cell[] = growFigure(rng, rng.int(3, 6), 3, 5, [2, rng.int(0, 4)]);
    const given = axis === 'v' ? half : half.map(([c, r]) => [r, c] as Cell);
    const answerCells = mirrorCells(given, axis, 6);
    const copied = given.map(([c, r]) => (axis === 'v' ? [c + 3, r] : [c, r + 3]) as Cell);
    const answer = cellsKey(answerCells);
    return {
      ...base,
      prompt: { terms: [], textKey: `task.prompt.grid.mirror.${axis}` },
      grid: {
        mode: 'cells',
        board: axis === 'v' ? { cols: 6, rows: 5, given, axis } : { cols: 5, rows: 6, given, axis },
      },
      answer,
      ...(cellsKey(copied) !== answer
        ? { errorAnswers: [{ value: cellsKey(copied), errorTag: 'mirror_copied' }] }
        : {}),
      hints: [
        { key: 'hint.grid.mirror.1' },
        { key: 'hint.grid.mirror.2' },
        { key: 'hint.grid.mirror.3', params: { n: given.length } },
      ],
      dedupeKey: `grid:mirror:${axis}:${cellsKey(given)}`,
    };
  }

  // Rechteck oder Quadrat mit n Kästchen; jedes passende Rechteck ist richtig.
  const square = rng.chance(0.3);
  const [w, h] = square
    ? rng.pick([
        [2, 2],
        [3, 3],
      ] as const)
    : rng.pick([
        [3, 2],
        [4, 2],
        [5, 2],
        [4, 3],
        [3, 4],
        [2, 4],
        [5, 3],
        [6, 2],
      ] as const);
  const area = w * h;
  const example: Cell[] = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) example.push([c, r]);
  const shape = square ? 'square' : 'rect';
  return {
    ...base,
    prompt: { terms: [], textKey: `task.prompt.grid.${shape}`, textParams: { n: area } },
    grid: {
      mode: 'cells',
      board: { cols: 6, rows: 5 },
      rule: { type: 'rect', area, ...(square ? { square } : {}) },
    },
    answer: cellsKey(example),
    hints: [
      { key: `hint.grid.${shape}.1` },
      { key: 'hint.grid.rect.2', params: { n: area, w, h } },
      { key: 'hint.grid.rect.3', params: { n: area, w, h } },
    ],
    dedupeKey: `grid:${shape}:${area}:${rng.int(0, 2)}`,
  };
};

// ---------------------------------------------------------------------------
// Lage und Wege

/** Bilder auf dem Spielfeld: Kartensymbole der Tiere und Gegenstände (Textur, Text-Kennung). */
export const THINGS = [
  ['karte_affe', 'monkey'],
  ['karte_pinguin', 'penguin'],
  ['karte_elefant', 'elephant'],
  ['karte_papagei', 'parrot'],
  ['karte_eule', 'owl'],
  ['karte_giraffe', 'giraffe'],
  ['karte_erdmaennchen', 'meerkat'],
  ['karte_schmetterling', 'butterfly'],
  ['objekt_banane', 'banana'],
  ['objekt_eimer', 'bucket'],
  ['objekt_fisch', 'fish'],
  ['objekt_futternapf', 'bowl'],
] as const;

const PLACES = ['over', 'under', 'front', 'behind', 'next'] as const;
type Place = (typeof PLACES)[number];
const PARTNER: Record<Place, Place> = {
  over: 'under',
  under: 'over',
  front: 'behind',
  behind: 'front',
  next: 'behind',
};
const PLACE_ERROR: Record<Place, string> = {
  over: 'over_under',
  under: 'over_under',
  front: 'front_back',
  behind: 'front_back',
  next: 'position_word',
};

function words(level: Task['level'], rng: Rng, id: string): Task {
  const place = rng.pick(PLACES);
  const others = rng.shuffle(PLACES.filter((p) => p !== place && p !== PARTNER[place]));
  const wrong = [PARTNER[place], others[0]!];
  const options: TaskOption[] = rng.shuffle([place, ...wrong]).map((p) => ({
    value: p,
    label: { key: `position.${p}` },
    ...(p === place
      ? {}
      : { errorTag: p === PARTNER[place] ? PLACE_ERROR[place] : 'position_word' }),
  }));
  return {
    id,
    family: SPACE_ORIENTATION,
    level,
    kind: 'choice',
    strategyId: 'space_words',
    prompt: { terms: [], textKey: 'task.prompt.position.where' },
    display: { visual: { type: 'position', place } },
    answer: place,
    options,
    hints: [
      { key: 'hint.position.1' },
      { key: `hint.position.2.${place}` },
      { key: 'hint.position.3', params: { word: `@position.${place}` } },
    ],
    dedupeKey: `pos:${place}:${wrong.join(',')}`,
  };
}

/** 4 × 3 Felder, jedes mit einem anderen Bild. */
function thingBoard(rng: Rng) {
  const things = rng.shuffle(THINGS);
  const items = things.map(([icon], i) => ({ cell: [i % 4, Math.floor(i / 4)] as Cell, icon }));
  const at = (c: number, r: number) => things[r * 4 + c]!;
  return { items, at };
}

const dat = (thing: readonly [string, string]) => `@thing.${thing[1]}.dat`;

function pick(level: Task['level'], rng: Rng, id: string, rel: string): Task {
  const { items, at } = thingBoard(rng);
  let target: Cell;
  let textParams: Record<string, string>;
  const errorAnswers: Array<{ value: string; errorTag: string }> = [];
  if (rel === 'over' || rel === 'under') {
    const c = rng.int(0, 3);
    const r = rel === 'over' ? rng.int(0, 1) : rng.int(1, 2);
    const ref: Cell = [c, rel === 'over' ? r + 1 : r - 1];
    target = [c, r];
    textParams = { ref: dat(at(...ref)) };
    const opposite: Cell = [c, rel === 'over' ? r + 2 : r - 2];
    if (opposite[1] >= 0 && opposite[1] <= 2)
      errorAnswers.push({ value: cellsKey([opposite]), errorTag: 'over_under' });
    errorAnswers.push({ value: cellsKey([ref]), errorTag: 'position_ref' });
  } else if (rel === 'between') {
    const c = rng.int(1, 2);
    const r = rng.int(0, 2);
    target = [c, r];
    textParams = { a: dat(at(c - 1, r)), b: dat(at(c + 1, r)) };
  } else {
    // links oder rechts neben: beide Nachbarn sind da, damit eine Verwechslung erkennbar ist
    const c = rng.int(1, 2);
    const r = rng.int(0, 2);
    const dc = rel === 'left' ? -1 : 1;
    target = [c + dc, r];
    textParams = { ref: dat(at(c, r)) };
    errorAnswers.push({ value: cellsKey([[c - dc, r]]), errorTag: 'left_right' });
    errorAnswers.push({ value: cellsKey([[c, r]]), errorTag: 'position_ref' });
  }
  const pos = { row: target[1] + 1, col: target[0] + 1 };
  return {
    id,
    family: SPACE_ORIENTATION,
    level,
    kind: 'grid',
    strategyId: rel === 'left' || rel === 'right' ? 'space_leftright' : 'space_words',
    prompt: { terms: [], textKey: `task.prompt.grid.${rel}`, textParams },
    grid: { mode: 'pick', board: { cols: 4, rows: 3, items } },
    answer: cellsKey([target]),
    errorAnswers,
    hints: [
      {
        key:
          rel === 'left' || rel === 'right'
            ? 'hint.leftright.1'
            : `hint.grid.find.${rel === 'between' ? 'two' : 'one'}`,
        params: textParams,
      },
      { key: `hint.grid.${rel}.2` },
      { key: 'hint.grid.at.3', params: pos },
    ],
    dedupeKey: `pick:${rel}:${items.map((i) => i.icon).join(',')}:${k(target)}`,
  };
}

function walkTask(level: Task['level'], rng: Rng, id: string): Task {
  const h = rng.pick(['r', 'l'] as const);
  const v = rng.pick(['u', 'd'] as const);
  const a = rng.int(1, 3);
  const b = rng.int(1, 2);
  const dc = h === 'r' ? a : -a;
  const dr = v === 'd' ? b : -b;
  const sc = h === 'r' ? rng.int(0, 4 - a) : rng.int(a, 4);
  const sr = v === 'd' ? rng.int(0, 4 - b) : rng.int(b, 4);
  const end: Cell = [sc + dc, sr + dr];
  const errorAnswers: Array<{ value: string; errorTag: string }> = [];
  const add = (cell: Cell, tag: string) => {
    if (cell[0] < 0 || cell[1] < 0 || cell[0] > 4 || cell[1] > 4) return;
    const value = cellsKey([cell]);
    if (value === cellsKey([end]) || errorAnswers.some((e) => e.value === value)) return;
    errorAnswers.push({ value, errorTag: tag });
  };
  add([sc - dc, sr + dr], 'left_right');
  add([sc + dc, sr - dr], 'up_down');
  add([sc + (dc > 0 ? b : -b), sr + (dr > 0 ? a : -a)], 'steps_swapped');
  return {
    id,
    family: SPACE_ORIENTATION,
    level,
    kind: 'grid',
    strategyId: 'space_walk',
    prompt: { terms: [], textKey: `task.prompt.walk.${h}${v}`, textParams: { a, b } },
    grid: {
      mode: 'pick',
      board: { cols: 5, rows: 5, start: { cell: [sc, sr], icon: 'karte_pinguin' } },
    },
    answer: cellsKey([end]),
    errorAnswers,
    hints: [
      { key: 'hint.leftright.1' },
      { key: 'hint.walk.2', params: { a, b } },
      { key: 'hint.grid.at.3', params: { row: end[1] + 1, col: end[0] + 1 } },
    ],
    dedupeKey: `walk:${sc}:${sr}:${h}${a}:${v}${b}`,
  };
}

/** Kürzester Weg (Breitensuche); bei gleich langen Wegen der mit den wenigsten Knicken. */
function shortest(
  start: Cell,
  goal: Cell,
  cols: number,
  rows: number,
  stones: Cell[],
): string | undefined {
  const blocked = new Set(stones.map(k));
  const seen = new Map<string, string>([[k(start), '']]);
  let frontier: Array<[Cell, string]> = [[start, '']];
  while (frontier.length) {
    const next: Array<[Cell, string]> = [];
    const found: string[] = [];
    for (const [cell, path] of frontier) {
      for (const m of ['r', 'l', 'u', 'd'] as Move[]) {
        const n: Cell = [cell[0] + MOVES[m][0], cell[1] + MOVES[m][1]];
        if (n[0] < 0 || n[1] < 0 || n[0] >= cols || n[1] >= rows || blocked.has(k(n))) continue;
        const p = path + m;
        if (n[0] === goal[0] && n[1] === goal[1]) found.push(p);
        if (seen.has(k(n))) continue;
        seen.set(k(n), p);
        next.push([n, p]);
      }
    }
    if (found.length) return found.sort((x, y) => bends(x) - bends(y))[0];
    // Alle gleich langen Wege weiterverfolgen, damit Wege mit wenigen Knicken gefunden werden
    frontier = next;
  }
  return undefined;
}

const bends = (p: string) => [...p].filter((m, i) => i > 0 && m !== p[i - 1]).length;

/** Läufe eines Weges: „rrul“ → [r 2, u 1, l 1] */
export function runs(moves: string): Array<[Move, number]> {
  const out: Array<[Move, number]> = [];
  for (const m of moves as Iterable<Move>) {
    const last = out[out.length - 1];
    if (last && last[0] === m) last[1]++;
    else out.push([m, 1]);
  }
  return out;
}

/** Weg als Text für Hinweise: „2 nach rechts, dann 1 nach oben“ (Textbausteine). */
function wayHint(moves: string): Hint {
  const parts = runs(moves).slice(0, 4);
  const params: Record<string, string> = {};
  parts.forEach(([m, n], i) => (params[`s${i + 1}`] = `@route.${m}|n=${n}`));
  return { key: `hint.route.3.${parts.length}`, params };
}

function routeBoard(rng: Rng) {
  for (;;) {
    const start: Cell = [rng.int(0, 1), rng.int(0, 4)];
    const goal: Cell = [rng.int(3, 4), rng.int(0, 4)];
    const stones: Cell[] = [];
    while (stones.length < rng.int(2, 3)) {
      const s: Cell = [rng.int(1, 3), rng.int(0, 4)];
      if ([start, goal, ...stones].some((c) => k(c) === k(s))) continue;
      stones.push(s);
    }
    const path = shortest(start, goal, 5, 5, stones);
    if (!path || path.length < 3 || path.length > 7 || runs(path).length > 4) continue;
    // Die Steine sollen etwas ausmachen: ohne sie gäbe es einen kürzeren oder anderen Weg
    const free = shortest(start, goal, 5, 5, []);
    if (free === path && rng.chance(0.7)) continue;
    const items = [
      { cell: goal, icon: 'objekt_futternapf' },
      ...stones.map((cell) => ({ cell, icon: 'stone' })),
    ];
    return { start, goal, stones, path, items };
  }
}

function routeCards(level: Task['level'], rng: Rng, id: string): Task {
  const { start, goal, stones, path, items } = routeBoard(rng);
  const reaches = (moves: string) => {
    const run = walk(start, moves, 5, 5, stones);
    return !run.blocked && run.end[0] === goal[0] && run.end[1] === goal[1];
  };
  const flip: Record<Move, Move> = { r: 'l', l: 'r', u: 'd', d: 'u' };
  const candidates: Array<[string, string]> = [
    [[...path].map((m) => (m === 'r' || m === 'l' ? flip[m] : m)).join(''), 'left_right'],
    [[...path].map((m) => (m === 'u' || m === 'd' ? flip[m] : m)).join(''), 'up_down'],
    [path.slice(0, -1), 'path_end'],
    [path + path[path.length - 1], 'path_end'],
    [[...path].reverse().join(''), 'path_blocked'],
    [rng.shuffle([...path]).join(''), 'path_blocked'],
  ];
  const wrong: TaskOption[] = [];
  for (const [moves, tag] of candidates) {
    if (moves === '' || moves === path || reaches(moves)) continue;
    if (wrong.some((o) => o.value === moves)) continue;
    const run = walk(start, moves, 5, 5, stones);
    wrong.push({ value: moves, moves, errorTag: run.blocked ? 'path_blocked' : tag });
    if (wrong.length === 2) break;
  }
  const options = rng.shuffle([{ value: path, moves: path }, ...wrong]);
  return {
    id,
    family: SPACE_ORIENTATION,
    level,
    kind: 'choice',
    strategyId: 'space_route',
    prompt: { terms: [], textKey: 'task.prompt.route.which' },
    display: {
      visual: {
        type: 'board',
        cols: 5,
        rows: 5,
        items,
        start: { cell: start, icon: 'karte_pinguin' },
      },
    },
    answer: path,
    options,
    hints: [{ key: 'hint.route.1' }, { key: 'hint.route.2' }, wayHint(path)],
    dedupeKey: `route:${k(start)}:${k(goal)}:${stones.map(k).sort().join(',')}`,
  };
}

function arrowPath(level: Task['level'], rng: Rng, id: string): Task {
  const { start, goal, path, items } = routeBoard(rng);
  return {
    id,
    family: SPACE_ORIENTATION,
    level,
    kind: 'path',
    strategyId: 'space_route',
    prompt: { terms: [], textKey: 'task.prompt.route.lay' },
    grid: {
      mode: 'path',
      board: { cols: 5, rows: 5, items, start: { cell: start, icon: 'karte_pinguin' } },
      rule: { type: 'path', goal },
    },
    answer: path,
    hints: [{ key: 'hint.route.lay.1' }, { key: 'hint.route.2' }, wayHint(path)],
    dedupeKey: `path:${k(start)}:${k(goal)}:${items
      .map((i) => k(i.cell))
      .sort()
      .join(',')}`,
  };
}

export const spaceOrientation: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['positions', 'leftright', 'routes'] as const);
  if (mode === 'positions') {
    return rng.chance(0.5)
      ? words(level, rng, id)
      : pick(level, rng, id, rng.pick(['over', 'under', 'between']));
  }
  if (mode === 'leftright') {
    return rng.chance(0.5)
      ? pick(level, rng, id, rng.pick(['left', 'right']))
      : walkTask(level, rng, id);
  }
  return rng.chance(0.5) ? routeCards(level, rng, id) : arrowPath(level, rng, id);
};

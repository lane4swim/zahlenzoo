import type { Cell, CheckResult, GridInfo, Task, TaskInput } from '../types/task';

/** Kästchen als Text: „c:r“, mehrere mit „|“, sortiert nach Zeile und Spalte. */
export function cellsKey(cells: readonly Cell[]): string {
  return [...cells]
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([c, r]) => `${c}:${r}`)
    .join('|');
}

export function parseCells(text: string): Cell[] | undefined {
  const compact = text.replace(/\s+/g, '');
  if (compact === '') return [];
  const cells: Cell[] = [];
  for (const part of compact.split('|')) {
    const m = /^(\d+):(\d+)$/.exec(part);
    if (!m) return undefined;
    cells.push([Number(m[1]), Number(m[2])]);
  }
  return cells;
}

/** Verschiebt Kästchen so, dass das oberste linke Kästchen der Umgebung bei 0:0 liegt. */
export function normalizeShape(cells: readonly Cell[]): string {
  if (cells.length === 0) return '';
  const minC = Math.min(...cells.map((c) => c[0]));
  const minR = Math.min(...cells.map((c) => c[1]));
  return cellsKey(cells.map(([c, r]) => [c - minC, r - minR] as Cell));
}

export function mirrorCells(cells: readonly Cell[], axis: 'v' | 'h', size: number): Cell[] {
  return cells.map(([c, r]) => (axis === 'v' ? [size - 1 - c, r] : [c, size - 1 - r]) as Cell);
}

export const MOVES = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] } as const;
export type Move = keyof typeof MOVES;

/**
 * Läuft einen Weg ab. Liefert die Felder bis zum ersten Hindernis oder Rand;
 * blocked: der Weg stößt an einen Stein oder den Rand.
 */
export function walk(
  start: Cell,
  moves: string,
  cols: number,
  rows: number,
  stones: readonly Cell[] = [],
): { cells: Cell[]; end: Cell; blocked: boolean } {
  const stone = new Set(stones.map(([c, r]) => `${c}:${r}`));
  let [c, r] = start;
  const cells: Cell[] = [[c, r]];
  for (const m of moves) {
    const step = MOVES[m as Move];
    if (!step) continue;
    const nc = c + step[0];
    const nr = r + step[1];
    if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || stone.has(`${nc}:${nr}`)) {
      return { cells, end: [c, r], blocked: true };
    }
    c = nc;
    r = nr;
    cells.push([c, r]);
  }
  return { cells, end: [c, r], blocked: false };
}

export function stonesOf(grid: GridInfo): Cell[] {
  return (grid.board.items ?? []).filter((i) => i.icon === 'stone').map((i) => i.cell);
}

/** Prüft Eingaben auf dem Raster (Kästchen, Feld, Weg). */
export function checkGrid(task: Task, input: TaskInput): CheckResult {
  const grid = task.grid!;
  const text = String(input);
  const known = (value: string) => task.errorAnswers?.find((e) => e.value === value)?.errorTag;

  if (grid.mode === 'path') {
    const moves = text.replace(/[^rlud]/g, '');
    if (moves === '') return { correct: false, invalid: true };
    const rule = grid.rule?.type === 'path' ? grid.rule : undefined;
    const start = grid.board.start?.cell;
    if (!rule || !start) return { correct: moves === task.answer };
    const run = walk(start, moves, grid.board.cols, grid.board.rows, stonesOf(grid));
    if (run.blocked) return { correct: false, errorTag: 'path_blocked' };
    const atGoal = run.end[0] === rule.goal[0] && run.end[1] === rule.goal[1];
    return atGoal ? { correct: true } : { correct: false, errorTag: 'path_end' };
  }

  const cells = parseCells(text);
  if (!cells || cells.length === 0) return { correct: false, invalid: true };
  const key = cellsKey(cells);
  const tag = known(key);

  if (grid.mode === 'pick') {
    if (key === task.answer) return { correct: true };
    return { correct: false, ...(tag ? { errorTag: tag } : {}) };
  }

  const rule = grid.rule;
  if (rule?.type === 'rect') {
    if (cells.length !== rule.area) return { correct: false, errorTag: 'grid_count' };
    const cs = cells.map((c) => c[0]);
    const rs = cells.map((c) => c[1]);
    const w = Math.max(...cs) - Math.min(...cs) + 1;
    const h = Math.max(...rs) - Math.min(...rs) + 1;
    if (w * h !== cells.length) return { correct: false, errorTag: 'grid_not_rect' };
    if (rule.square && w !== h) return { correct: false, errorTag: 'grid_not_square' };
    return { correct: true };
  }
  if (rule?.type === 'shape') {
    // Abmalen: Die Figur darf an anderer Stelle stehen.
    const shape = normalizeShape(cells);
    if (shape === normalizeShape(rule.cells)) return { correct: true };
    const shapeTag = task.errorAnswers?.find((e) => e.value === shape)?.errorTag;
    if (shapeTag) return { correct: false, errorTag: shapeTag };
    return { correct: false, errorTag: countTag(cells.length, rule.cells.length) };
  }
  if (key === task.answer) return { correct: true };
  if (tag) return { correct: false, errorTag: tag };
  const target = parseCells(String(task.answer)) ?? [];
  return { correct: false, errorTag: countTag(cells.length, target.length) };
}

function countTag(given: number, wanted: number): string {
  return given < wanted ? 'grid_missing' : given > wanted ? 'grid_extra' : 'grid_wrong';
}

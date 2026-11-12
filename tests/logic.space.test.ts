import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { shapesCompose } from '../src/logic/generators/compose';
import { gridDraw, spaceOrientation } from '../src/logic/generators/space';
import { cellsKey, mirrorCells, parseCells, walk } from '../src/logic/grid';
import { piecePoints, sameLie } from '../src/logic/pieces';
import { createRng } from '../src/logic/rng';
import type { Cell, Generator, Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const SEEDS = 300;

function tasks(family: string, gen: Generator, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) => gen(level, createRng(s), `t${s}`, P(level)));
}

const shift = (cells: Cell[], dc: number, dr: number) =>
  cells.map(([c, r]) => [c + dc, r + dr] as Cell);

describe('Raster und Wege', () => {
  it('Kästchen als Text hin und zurück, sortiert', () => {
    expect(
      cellsKey([
        [2, 1],
        [0, 0],
        [1, 1],
      ]),
    ).toBe('0:0|1:1|2:1');
    expect(parseCells('0:0|1:1')).toEqual([
      [0, 0],
      [1, 1],
    ]);
    expect(parseCells('x')).toBeUndefined();
  });

  it('Weg stoppt an Steinen und am Rand', () => {
    expect(walk([0, 0], 'rr', 3, 3).end).toEqual([2, 0]);
    expect(walk([0, 0], 'rrr', 3, 3).blocked).toBe(true);
    expect(walk([0, 0], 'rd', 3, 3, [[1, 0]]).blocked).toBe(true);
  });

  it('Drehung: Dreieck rot 1 hat den rechten Winkel oben links', () => {
    const pts = piecePoints({ kind: 'tri', rot: 1 });
    expect(pts).toContainEqual([-0.5, -0.5]);
    expect(sameLie('rect', 0, 2)).toBe(true);
    expect(sameLie('tri', 0, 2)).toBe(false);
  });
});

describe('Kästchen malen', () => {
  it('Abmalen: verschoben richtig, gespiegelt erkannt, fehlende Kästchen gemeldet', () => {
    for (const t of tasks('grid_draw', gridDraw, 1)) {
      const rule = t.grid!.rule!;
      expect(rule.type).toBe('shape');
      if (rule.type !== 'shape') continue;
      const cells = rule.cells;
      const minC = Math.min(...cells.map((c) => c[0]));
      expect(check(t, cellsKey(shift(cells, -minC, 0))).correct).toBe(true);
      expect(check(t, cellsKey(cells.slice(1))).errorTag).toBe('grid_missing');
      if (t.errorAnswers?.length) {
        const mirrored = mirrorCells(cells, 'v', 5);
        expect(check(t, cellsKey(mirrored)).errorTag).toBe('grid_mirrored');
      }
      expect(check(t, '').invalid).toBe(true);
    }
  });

  it('Spiegeln: Lösung liegt auf der anderen Seite, Verschieben wird erkannt', () => {
    for (const t of tasks('grid_draw', gridDraw, 2)) {
      const { board } = t.grid!;
      const given = board.given!;
      const answer = parseCells(String(t.answer))!;
      expect(answer).toHaveLength(given.length);
      const half = board.axis === 'v' ? board.cols / 2 : board.rows / 2;
      for (const [c, r] of answer) expect(board.axis === 'v' ? c : r).toBeGreaterThanOrEqual(half);
      const copied = given.map(([c, r]) => (board.axis === 'v' ? [c + 3, r] : [c, r + 3]) as Cell);
      if (cellsKey(copied) !== t.answer)
        expect(check(t, cellsKey(copied)).errorTag).toBe('mirror_copied');
    }
  });

  it('Rechteck: jedes Rechteck mit n Kästchen ist richtig', () => {
    const t = tasks('grid_draw', gridDraw, 3).find(
      (u) =>
        u.grid!.rule!.type === 'rect' && !('square' in u.grid!.rule!) && u.grid!.rule!.area === 6,
    )!;
    const rect = (w: number, h: number, dx = 0, dy = 0) => {
      const out: Cell[] = [];
      for (let c = 0; c < w; c++) for (let r = 0; r < h; r++) out.push([c + dx, r + dy]);
      return cellsKey(out);
    };
    expect(check(t, rect(3, 2, 2, 1)).correct).toBe(true);
    expect(check(t, rect(2, 3)).correct).toBe(true);
    expect(check(t, rect(6, 1)).correct).toBe(true);
    expect(check(t, rect(2, 2)).errorTag).toBe('grid_count');
    expect(check(t, '0:0|1:0|2:0|0:1|1:1|3:1').errorTag).toBe('grid_not_rect');
  });
});

describe('Lage und Wege', () => {
  it('Felder wählen: rechts und links vertauscht wird erkannt', () => {
    let leftRight = 0;
    for (const level of [1, 2] as TaskLevel[]) {
      for (const t of tasks('space_orientation', spaceOrientation, level)) {
        if (t.grid?.mode !== 'pick') continue;
        expect(check(t, String(t.answer)).correct).toBe(true);
        for (const e of t.errorAnswers ?? []) {
          expect(e.value).not.toBe(t.answer);
          expect(check(t, e.value).errorTag).toBe(e.errorTag);
          if (e.errorTag === 'left_right') leftRight++;
        }
      }
    }
    expect(leftRight).toBeGreaterThan(50);
  });

  it('Wege: Lösung erreicht das Futter, falsche Karten nicht', () => {
    for (const t of tasks('space_orientation', spaceOrientation, 3)) {
      if (t.grid) {
        const { board } = t.grid;
        const stones = board.items!.filter((i) => i.icon === 'stone').map((i) => i.cell);
        const run = walk(board.start!.cell, String(t.answer), 5, 5, stones);
        expect(run.blocked).toBe(false);
        expect(check(t, String(t.answer)).correct).toBe(true);
        expect(check(t, 'l'.repeat(9)).errorTag).toBe('path_blocked');
        continue;
      }
      expect(t.options!.length).toBe(3);
      const v = t.display!.visual;
      if (v.type !== 'board') throw new Error('Spielfeld erwartet');
      const stones = v.items!.filter((i) => i.icon === 'stone').map((i) => i.cell);
      const goal = v.items!.find((i) => i.icon !== 'stone')!.cell;
      for (const o of t.options!) {
        const run = walk(v.start!.cell, o.moves!, 5, 5, stones);
        const ok = !run.blocked && run.end[0] === goal[0] && run.end[1] === goal[1];
        expect(ok).toBe(o.value === t.answer);
      }
    }
  });
});

describe('Formen legen', () => {
  it('Stufe 1: Teile passen ohne Drehen; Stufe 2: mindestens ein Teil ist gedreht', () => {
    for (const level of [1, 2] as TaskLevel[]) {
      for (const t of tasks('shapes_compose', shapesCompose, level)) {
        const { slots, pieces } = t.compose!;
        expect(pieces).toHaveLength(slots.length);
        const free = [...slots];
        let turned = 0;
        for (const p of pieces) {
          const i = free.findIndex((s) => s.kind === p.kind && sameLie(p.kind, p.rot, s.rot));
          if (i >= 0) free.splice(i, 1);
          else turned++;
        }
        if (level === 1) expect(turned).toBe(0);
        else expect(turned).toBeGreaterThan(0);
        expect(check(t, 'rotation').errorTag).toBe('piece_rotation');
        expect(check(t, 'done').correct).toBe(true);
      }
    }
  });
});

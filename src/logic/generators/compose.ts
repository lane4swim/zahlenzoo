import { lies, sameLie } from '../pieces';
import { choice } from '../params';
import type { Generator, Piece, PieceKind, PieceSlot, Task, TaskOption } from '../../types/task';

export const SHAPES_COMPOSE = 'shapes_compose';

type Figure = { id: string; cols: number; rows: number; slots: PieceSlot[] };

const sq = (c: number, r: number): PieceSlot => ({ kind: 'square', rot: 0, c, r });
const re = (c: number, r: number, rot = 0): PieceSlot => ({ kind: 'rect', rot, c, r });
const tr = (c: number, r: number, rot: number): PieceSlot => ({ kind: 'tri', rot, c, r });
const se = (c: number, r: number, rot: number): PieceSlot => ({ kind: 'semi', rot, c, r });

/**
 * Zielfiguren. Dreieck rot: rechter Winkel 0 unten links, 1 oben links, 2 oben rechts,
 * 3 unten rechts. Halbkreis rot: gerade Seite 0 unten, 1 links, 2 oben, 3 rechts.
 */
export const FIGURES: Figure[] = [
  { id: 'house', cols: 2, rows: 2, slots: [sq(0, 1), sq(1, 1), tr(0, 0, 3), tr(1, 0, 0)] },
  { id: 'block', cols: 3, rows: 1, slots: [sq(0, 0), sq(1, 0), tr(2, 0, 0), tr(2, 0, 2)] },
  { id: 'icecream', cols: 2, rows: 2, slots: [se(0, 0, 0), se(1, 0, 0), tr(0, 1, 2), tr(1, 1, 1)] },
  {
    id: 'butterfly',
    cols: 3,
    rows: 2,
    slots: [re(1, 0, 1), tr(0, 0, 2), tr(0, 1, 3), tr(2, 0, 1), tr(2, 1, 0)],
  },
  {
    id: 'fish',
    cols: 4,
    rows: 1,
    slots: [tr(0, 0, 2), tr(0, 0, 3), sq(1, 0), sq(2, 0), se(3, 0, 1)],
  },
  {
    id: 'boat',
    cols: 4,
    rows: 2,
    slots: [tr(1, 0, 3), tr(2, 0, 0), tr(0, 1, 2), re(1, 1), tr(3, 1, 1)],
  },
  {
    id: 'rocket',
    cols: 4,
    rows: 3,
    slots: [tr(1, 0, 3), tr(2, 0, 0), re(1, 1, 1), re(2, 1, 1), tr(0, 2, 3), tr(3, 2, 0)],
  },
  {
    id: 'train',
    cols: 3,
    rows: 3,
    slots: [sq(2, 0), re(0, 1), sq(2, 1), se(0, 2, 2), se(2, 2, 2)],
  },
];

const EASY = ['house', 'block', 'icecream', 'butterfly', 'train'];

const pieceKey = (p: Piece) =>
  `${p.kind}${p.kind === 'square' ? 0 : p.rot % (p.kind === 'rect' ? 2 : 4)}`;

/** Passen alle Teile so, wie sie liegen, auf die Plätze? */
function fitsWithoutTurning(pieces: readonly Piece[], slots: readonly PieceSlot[]): boolean {
  const free = [...slots];
  for (const p of pieces) {
    const i = free.findIndex((s) => s.kind === p.kind && sameLie(p.kind, p.rot, s.rot));
    if (i < 0) return false;
    free.splice(i, 1);
  }
  return true;
}

export const shapesCompose: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['lay', 'rotate', 'complete'] as const);
  const base = { id, family: SHAPES_COMPOSE, level };

  if (mode === 'lay' || mode === 'rotate') {
    const pool = mode === 'lay' ? FIGURES.filter((f) => EASY.includes(f.id)) : FIGURES;
    const fig = rng.pick(pool);
    // Stufe 2: Teile liegen gedreht in der Ablage (mindestens eines anders als im Umriss)
    let pieces: Piece[];
    for (;;) {
      pieces = fig.slots.map((s) => ({
        kind: s.kind,
        rot:
          mode === 'lay' || lies(s.kind) === 1
            ? s.rot
            : rng.int(0, 3) % (s.kind === 'rect' ? 2 : 4),
      }));
      if (mode === 'lay' || !fitsWithoutTurning(pieces, fig.slots)) break;
    }
    pieces = rng.shuffle(pieces);
    return {
      ...base,
      kind: 'compose',
      strategyId: `compose_${mode}`,
      prompt: {
        terms: [],
        textKey: `task.prompt.compose.${mode}`,
        textParams: { name: `@figure.${fig.id}` },
      },
      compose: { cols: fig.cols, rows: fig.rows, slots: fig.slots, pieces },
      answer: 'done',
      errorAnswers: [
        { value: 'rotation', errorTag: 'piece_rotation' },
        { value: 'wrong', errorTag: 'piece_wrong' },
      ],
      hints: [
        { key: mode === 'lay' ? 'hint.compose.1' : 'hint.compose.rotate.1' },
        { key: mode === 'lay' ? 'hint.compose.lay.2' : 'hint.compose.rotate.2' },
        { key: 'hint.compose.3', params: { n: fig.slots.length } },
      ],
      dedupeKey: `compose:${mode}:${fig.id}:${pieces.map(pieceKey).join(',')}`,
    };
  }

  const fig = rng.pick(FIGURES);
  if (rng.chance(0.5)) {
    // Welches Teil fehlt?
    const index = rng.int(0, fig.slots.length - 1);
    const slot = fig.slots[index]!;
    const right: Piece = { kind: slot.kind, rot: slot.rot };
    const wrong: Array<[Piece, string]> = [];
    if (lies(slot.kind) > 1) {
      const turn = slot.kind === 'rect' ? 1 : rng.pick([1, 2, 3]);
      wrong.push([{ kind: slot.kind, rot: (slot.rot + turn) % 4 }, 'piece_rotation']);
    }
    const kinds: PieceKind[] = (['square', 'rect', 'tri', 'semi'] as PieceKind[]).filter(
      (k) => k !== slot.kind,
    );
    for (const k of rng.shuffle(kinds)) {
      if (wrong.length >= 2) break;
      wrong.push([{ kind: k, rot: k === 'tri' || k === 'semi' ? slot.rot : 0 }, 'piece_wrong']);
    }
    const options: TaskOption[] = rng.shuffle([
      { value: pieceKey(right), piece: right },
      ...wrong.map(([p, tag]) => ({ value: pieceKey(p), piece: p, errorTag: tag })),
    ]);
    return {
      ...base,
      kind: 'choice',
      strategyId: 'compose_missing',
      prompt: { terms: [], textKey: 'task.prompt.compose.missing' },
      display: {
        visual: {
          type: 'pieces',
          cols: fig.cols,
          rows: fig.rows,
          slots: fig.slots,
          hidden: [index],
        },
      },
      answer: pieceKey(right),
      options,
      hints: [
        { key: 'hint.compose.missing.1' },
        { key: `hint.compose.missing.2.${slot.kind}` },
        { key: 'hint.compose.missing.3', params: { name: `@piece.${slot.kind}` } },
      ],
      dedupeKey: `compose:missing:${fig.id}:${index}`,
    };
  }

  // Aus wie vielen … besteht die Figur?
  const counts = new Map<PieceKind, number>();
  for (const s of fig.slots) counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1);
  const kind = rng.pick([...counts.keys()].filter((k) => (counts.get(k) ?? 0) >= 2));
  const n = counts.get(kind) ?? 0;
  const plural = `@piece.plural.${kind}`;
  return {
    ...base,
    kind: 'number-input',
    strategyId: 'compose_count',
    prompt: { terms: [], textKey: `task.prompt.compose.count.${kind}` },
    display: { visual: { type: 'pieces', cols: fig.cols, rows: fig.rows, slots: fig.slots } },
    answer: n,
    ...(fig.slots.length !== n
      ? { typicalErrors: [{ value: fig.slots.length, errorTag: 'count_all_pieces' }] }
      : {}),
    hints: [
      { key: 'hint.compose.count.1', params: { plural } },
      { key: kind === 'tri' ? 'hint.compose.count.2.tri' : 'hint.compose.count.2' },
      { key: 'hint.compose.count.3', params: { n, plural } },
    ],
    dedupeKey: `compose:count:${fig.id}:${kind}`,
  };
};

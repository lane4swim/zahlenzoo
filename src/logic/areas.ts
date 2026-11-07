import { add100, ADD_100 } from './generators/add100';
import type { Generator } from '../types/task';

/** Bereiche der Weltkarte. Später aus `areas.json`; in Phase 2 nur der Pinguinfelsen spielbar. */
export type AreaDef = {
  id: string;
  animal: string;
  family?: { id: string; generator: Generator };
  /** Bereich, in dem 6 Sterne gesammelt sein müssen; fehlt bei Startbereichen */
  requires?: string;
};

export const AREAS: readonly AreaDef[] = [
  { id: 'affenwald', animal: 'monkey' },
  { id: 'pinguinfelsen', animal: 'penguin', family: { id: ADD_100, generator: add100 } },
];

export function findArea(id: string): AreaDef | undefined {
  return AREAS.find((a) => a.id === id);
}

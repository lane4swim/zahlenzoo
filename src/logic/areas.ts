import { add100, ADD_100 } from './generators/add100';
import { multTable, MULT_TABLE } from './generators/multTable';
import { neighbors100, NEIGHBORS_100 } from './generators/neighbors100';
import { STARS_TO_UNLOCK_NEXT_AREA } from './rewards';
import type { Generator } from '../types/task';

/** Bereiche der Weltkarte (Spezifikation, Abschnitt 5). Später aus `areas.json`. */
export type AreaDef = {
  id: string;
  animal: string;
  /** Aufgabenfamilie; fehlt, solange der Bereich noch keine Aufgaben hat */
  family?: { id: string; generator: Generator };
  /** Vorgängerbereich, in dem 6 Sterne gesammelt sein müssen; fehlt bei Startbereichen */
  requires?: string;
};

export const AREAS: readonly AreaDef[] = [
  { id: 'affenwald', animal: 'monkey', family: { id: NEIGHBORS_100, generator: neighbors100 } },
  { id: 'pinguinfelsen', animal: 'penguin', family: { id: ADD_100, generator: add100 } },
  {
    id: 'elefantenwiese',
    animal: 'elephant',
    family: { id: MULT_TABLE, generator: multTable },
    requires: 'pinguinfelsen',
  },
  { id: 'zookasse', animal: 'parrot', requires: 'elefantenwiese' },
  { id: 'futteruhr', animal: 'owl', requires: 'zookasse' },
  { id: 'schmetterlingshaus', animal: 'butterfly', requires: 'futteruhr' },
  { id: 'giraffenhof', animal: 'giraffe', requires: 'schmetterlingshaus' },
  { id: 'zoozaehlung', animal: 'meerkat', requires: 'giraffenhof' },
];

export function findArea(id: string): AreaDef | undefined {
  return AREAS.find((a) => a.id === id);
}

export type AreaState =
  /** freigeschaltet und mit Aufgaben: Tier wird gezeigt und führt zu den Aufgaben */
  | 'open'
  /** freigeschaltet, aber noch ohne Aufgaben */
  | 'soon'
  /** gesperrt, bis im Vorgänger genug Sterne gesammelt sind */
  | 'locked';

/** Zustand eines Bereichs aus den gesammelten Sternen je Bereich. */
export function areaState(area: AreaDef, starsByArea: Readonly<Record<string, number>>): AreaState {
  const unlocked =
    area.requires === undefined || (starsByArea[area.requires] ?? 0) >= STARS_TO_UNLOCK_NEXT_AREA;
  if (!unlocked) return 'locked';
  return area.family ? 'open' : 'soon';
}

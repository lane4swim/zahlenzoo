import type { AreaConfig, Rules } from '../types/content';

export type AreaState =
  /** freigeschaltet und mit Aufgaben: Tier wird gezeigt und führt zu den Aufgaben */
  | 'open'
  /** freigeschaltet, aber noch ohne Aufgaben */
  | 'soon'
  /** gesperrt, bis im Vorgänger genug Sterne gesammelt sind */
  | 'locked';

/** Zustand eines Bereichs aus den gesammelten Sternen je Bereich (Schwelle aus rules.json). */
export function areaState(
  area: AreaConfig,
  starsByArea: Readonly<Record<string, number>>,
  rules: Pick<Rules, 'areaUnlockStars'>,
): AreaState {
  const unlocked =
    area.requires === undefined || (starsByArea[area.requires] ?? 0) >= rules.areaUnlockStars;
  if (!unlocked) return 'locked';
  return area.families.length > 0 ? 'open' : 'soon';
}

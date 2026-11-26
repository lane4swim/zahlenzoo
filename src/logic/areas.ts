import type { AreaConfig, Rules } from '../types/content';
import type { Grade, Profile } from '../types/save';

/** Klasse des Profils; ältere Profile ohne Angabe gehören zu Klasse 2. */
export function profileGrade(profile: Pick<Profile, 'grade'>): Grade {
  return profile.grade === 1 ? 1 : 2;
}

export type AreaState =
  /** freigeschaltet und mit Aufgaben: Tier wird gezeigt und führt zu den Aufgaben */
  | 'open'
  /** freigeschaltet, aber noch ohne Aufgaben */
  | 'soon'
  /** gesperrt, bis im Vorgänger genug Sterne gesammelt sind */
  | 'locked';

/**
 * Zustand eines Bereichs aus den gesammelten Sternen je Bereich (Schwelle aus rules.json).
 * Klasse 1: Bereiche mit `requiresGrade1` öffnen erst ab `gradeOne.bridgeStars` Sternen dort.
 */
export function areaState(
  area: AreaConfig,
  starsByArea: Readonly<Record<string, number>>,
  rules: Pick<Rules, 'areaUnlockStars'> & Partial<Pick<Rules, 'gradeOne'>>,
  grade: Grade = 2,
): AreaState {
  if (grade === 1 && area.requiresGrade1 !== undefined) {
    const bridge = rules.gradeOne?.bridgeStars ?? 0;
    if ((starsByArea[area.requiresGrade1] ?? 0) < bridge) return 'locked';
  }
  const unlocked =
    area.requires === undefined || (starsByArea[area.requires] ?? 0) >= rules.areaUnlockStars;
  if (!unlocked) return 'locked';
  return area.families.length > 0 ? 'open' : 'soon';
}

/** Vorgängerbereich, den ein gesperrter Bereich für diese Klasse braucht (für den Kartenhinweis). */
export function requiredArea(area: AreaConfig, grade: Grade = 2): string | undefined {
  return (grade === 1 ? area.requiresGrade1 : undefined) ?? area.requires;
}

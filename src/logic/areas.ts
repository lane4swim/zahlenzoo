import type { AreaConfig, MapId, Rules } from '../types/content';
import type { Grade, Profile } from '../types/save';

export type AreaState =
  /** freigeschaltet und mit Aufgaben: Tier wird gezeigt und führt zu den Aufgaben */
  | 'open'
  /** freigeschaltet, aber noch ohne Aufgaben */
  | 'soon'
  /** gesperrt, bis im Vorgänger genug Sterne gesammelt sind */
  | 'locked';

/** Klasse des Profils; ältere Profile ohne Angabe gehören zu Klasse 2. */
export function profileGrade(profile: Pick<Profile, 'grade'>): Grade {
  return profile.grade === 1 ? 1 : 2;
}

/** Karte eines Geheges (fehlt die Angabe: der große Zoo). */
export function areaMap(area: Pick<AreaConfig, 'map'>): MapId {
  return area.map ?? 'zoo';
}

/** Startkarte: Klasse 1 beginnt im Streichelzoo, Klasse 2 im großen Zoo. */
export function defaultMap(grade: Grade): MapId {
  return grade === 1 ? 'streichelzoo' : 'zoo';
}

/** Alle Sterne der Gehege einer Karte. */
export function mapStars(
  areas: readonly AreaConfig[],
  starsByArea: Readonly<Record<string, number>>,
  map: MapId,
): number {
  return areas.filter((a) => areaMap(a) === map).reduce((s, a) => s + (starsByArea[a.id] ?? 0), 0);
}

/**
 * Zustand eines Bereichs aus den gesammelten Sternen je Bereich (Schwelle aus rules.json).
 * Klasse 1: Gehege mit `gradeOneBridge` öffnen erst ab `gradeOne.bridgeStars` Sternen im
 * ganzen Streichelzoo (`pettingStars`).
 */
export function areaState(
  area: AreaConfig,
  starsByArea: Readonly<Record<string, number>>,
  rules: Pick<Rules, 'areaUnlockStars'> & Partial<Pick<Rules, 'gradeOne'>>,
  grade: Grade = 2,
  pettingStars = 0,
): AreaState {
  if (grade === 1 && area.gradeOneBridge && pettingStars < (rules.gradeOne?.bridgeStars ?? 0)) {
    return 'locked';
  }
  const unlocked =
    area.requires === undefined || (starsByArea[area.requires] ?? 0) >= rules.areaUnlockStars;
  if (!unlocked) return 'locked';
  return area.families.length > 0 ? 'open' : 'soon';
}

/** Zustände aller Bereiche für ein Profil (Sterne, Klasse und Sterne im Streichelzoo). */
export function areaStates(
  content: { areas: readonly AreaConfig[]; rules: Rules },
  profile: Pick<Profile, 'grade' | 'areas'>,
): Record<string, AreaState> {
  const stars = Object.fromEntries(
    content.areas.map((a) => [a.id, profile.areas[a.id]?.stars ?? 0]),
  );
  const petting = mapStars(content.areas, stars, 'streichelzoo');
  const grade = profileGrade(profile);
  return Object.fromEntries(
    content.areas.map((a) => [a.id, areaState(a, stars, content.rules, grade, petting)]),
  );
}

/**
 * Warum ein Gehege gesperrt ist: Für Klasse 1 fehlen Sterne im Streichelzoo (`bridge`),
 * sonst im Vorgängerbereich.
 */
export function lockReason(
  area: AreaConfig,
  grade: Grade,
  pettingStars: number,
  rules: Pick<Rules, 'gradeOne'>,
): { bridge: number } | { requires: string } | undefined {
  if (grade === 1 && area.gradeOneBridge && pettingStars < rules.gradeOne.bridgeStars) {
    return { bridge: rules.gradeOne.bridgeStars - pettingStars };
  }
  return area.requires ? { requires: area.requires } : undefined;
}

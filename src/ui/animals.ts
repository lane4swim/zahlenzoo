import type { GameContent } from '../types/content';

/** Animationen als Sprite-Sheets; Ausdrücke als Einzelbilder (512 px). */
export const ANIMATIONS = ['idle', 'freude', 'fuetterung'] as const;
export const EXPRESSIONS = ['froh', 'jubelnd', 'nachdenklich'] as const;
export type Animation = (typeof ANIMATIONS)[number];
export type Expression = (typeof EXPRESSIONS)[number];

export const areaBackground = (areaId: string) => `${areaId}_hintergrund`;
export const taskBackground = (areaId: string) => `${areaId}_aufgabe`;

/** Spielbare Bereiche (mit Aufgabenfamilie): nur deren Tiere und Hintergründe werden geladen. */
export function playableAreas(content: GameContent) {
  return content.areas.filter((a) => a.families.length > 0);
}

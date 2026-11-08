/** Tiergrafiken (aus art/build_scenes.py) und ihre Plätze in den Szenen. */
export type AnimalArt = {
  /** Präfix der Dateien, z. B. „pinguinfelsen_pinguin“ */
  prefix: string;
  /** Fußpunkt in der Aufgabenansicht (auf Eisklippe bzw. Ast des Hintergrunds) */
  taskSpot: { x: number; y: number };
  /** Fußpunkt im Gehege */
  areaSpot: { x: number; y: number };
};

export const ANIMAL_ART: Readonly<Record<string, AnimalArt>> = {
  penguin: {
    prefix: 'pinguinfelsen_pinguin',
    taskSpot: { x: 118, y: 328 },
    areaSpot: { x: 200, y: 604 },
  },
  monkey: {
    prefix: 'affenwald_affe',
    taskSpot: { x: 150, y: 342 },
    areaSpot: { x: 290, y: 722 },
  },
  elephant: {
    prefix: 'elefantenwiese_elefant',
    taskSpot: { x: 112, y: 336 },
    areaSpot: { x: 220, y: 712 },
  },
};

/** Animationen als Sprite-Sheets; Ausdrücke als Einzelbilder (512 px). */
export const ANIMATIONS = ['idle', 'freude', 'fuetterung'] as const;
export const EXPRESSIONS = ['froh', 'jubelnd', 'nachdenklich'] as const;
export type Animation = (typeof ANIMATIONS)[number];
export type Expression = (typeof EXPRESSIONS)[number];

/** Bereiche mit eigenen Hintergründen für Gehege und Aufgabenansicht. */
export const AREA_ART = ['pinguinfelsen', 'affenwald', 'elefantenwiese'] as const;

export const areaBackground = (areaId: string) => `${areaId}_hintergrund`;
export const taskBackground = (areaId: string) => `${areaId}_aufgabe`;
export const hasAreaArt = (areaId: string) => (AREA_ART as readonly string[]).includes(areaId);

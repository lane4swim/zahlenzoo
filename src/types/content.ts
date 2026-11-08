/** Inhalte aus public/assets/data/*.json (Spezifikation, Abschnitt 11). */

/** Startwerte (rules.json). */
export type Rules = {
  round: {
    size: number;
    minSize: number;
    maxSize: number;
    mix: { current: number; previous: number; next: number };
  };
  maxLevel: number;
  attempts: number;
  maxRepeats: number;
  stars: { two: number; three: number };
  levelUnlockStars: number;
  areaUnlockStars: number;
  skillHistory: number;
};

/** Bereich der Weltkarte (areas.json). */
export type AreaConfig = {
  id: string;
  animal: string;
  /** Aufgabenfamilien in der Reihenfolge im Gehege; leer, solange der Bereich keine Aufgaben hat */
  families: string[];
  /** Vorgängerbereich; fehlt bei Startbereichen */
  requires?: string;
};

/** Parameter einer Stufe; `description` dient nur der Lesbarkeit. */
export type LevelParams = Readonly<Record<string, number | number[] | string>>;

/** Aufgabenfamilie (families.json). */
export type FamilyConfig = {
  title: string;
  /** Anteile der Eingabeformen, z. B. { "choice": 0.35 } */
  kinds: Readonly<Record<string, number>>;
  levels: Readonly<Record<string, LevelParams>>;
};

/** Parameter, die ein Generator für eine Aufgabe bekommt. */
export type FamilyParams = { kinds: Readonly<Record<string, number>>; level: LevelParams };

type Point = { x: number; y: number };

/** Tiergrafik und Plätze in den Szenen (animals.json). */
export type AnimalConfig = {
  prefix: string;
  icon: string;
  taskSpot: Point;
  areaSpot: Point;
  babyPrice: number;
};

/** Lob (praise.de.json). */
export type Praise = { firstTry: string[]; withHelp: string[] };

/** Impressum und Datenschutz (legal.json), Daten folgen vor der Veröffentlichung. */
export type Legal = {
  imprint: { provider: string; street: string; city: string; email: string };
  privacy: string[];
};

export type GameContent = {
  rules: Rules;
  areas: AreaConfig[];
  families: Readonly<Record<string, FamilyConfig>>;
  animals: Readonly<Record<string, AnimalConfig>>;
  praise: Praise;
  legal: Legal;
};

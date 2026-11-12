/** Inhalte aus src/data/*.json (Spezifikation, Abschnitt 11). */

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
  /**
   * Frage „Wie hast du gerechnet?“ nach richtig gelösten Aufgaben dieser Familien mit
   * Zehnerübergang (Spezifikation 6; Häufigkeit laut Lehrkraft einstellbar).
   * chance 0 schaltet sie ab.
   */
  strategyPick: { families: string[]; chance: number; maxPerRound: number };
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

/** Rechenart einer Sachaufgabe: hinzufügen, wegnehmen, malnehmen, verteilen, aufteilen. */
export type StoryOp = 'add' | 'sub' | 'mult' | 'share' | 'measure';

/** Vorlage einer Sachaufgabe (stories.json); Text und Einheit in word-templates.de.json. */
export type StoryTemplate = { id: string; op: StoryOp; icon: string; family: string };

/**
 * Sachsituation ohne Rechnung (situations.json): passende Frage wählen oder entscheiden,
 * ob genau gerechnet werden muss. Texte in word-templates.de.json unter `situation.<id>`.
 * params: Bereich [von, bis] je Platzhalter; answer: Lösung bei festen Antworten.
 */
export type SituationTemplate = {
  id: string;
  family: string;
  levels: number[];
  params: Readonly<Record<string, readonly [number, number]>>;
  answer?: string;
};

/** Parameter, die ein Generator für eine Aufgabe bekommt. */
export type FamilyParams = {
  kinds: Readonly<Record<string, number>>;
  level: LevelParams;
  /** Sachaufgaben-Vorlagen dieser Familie */
  stories?: readonly StoryTemplate[];
  /** Sachsituationen dieser Familie */
  situations?: readonly SituationTemplate[];
};

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

/** Dekoration für die Zoo-Karte (decor.json): Preis in Sternen, fester Platz und Größe. */
export type DecorConfig = { id: string; price: number; x: number; y: number; size: number };

/** Bedingung eines Abzeichens (achievements.json). */
export type AchievementCondition =
  | { type: 'rounds' | 'streak' | 'roundStars' | 'totalStars' | 'level' | 'areasDone'; min: number }
  | { type: 'withHelp' | 'babies'; min: number }
  | { type: 'familyBest'; families: string[]; level: number; stars: number };

export type Achievement = { id: string; condition: AchievementCondition };

export type GameContent = {
  rules: Rules;
  areas: AreaConfig[];
  families: Readonly<Record<string, FamilyConfig>>;
  animals: Readonly<Record<string, AnimalConfig>>;
  praise: Praise;
  legal: Legal;
  stories: StoryTemplate[];
  situations: SituationTemplate[];
  decor: DecorConfig[];
  achievements: Achievement[];
};

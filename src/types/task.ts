import type { Rng } from '../logic/rng';
import type { FamilyParams } from './content';

/** Eingabeformen einer Aufgabe (Spezifikation, Abschnitt 6). */
export type TaskKind =
  | 'number-input'
  | 'choice'
  | 'gap'
  | 'drag-sort'
  | 'number-line'
  | 'clock'
  | 'money'
  | 'pattern'
  | 'word'
  /** Felder auf einem Raster antippen (Kästchen malen, Feld wählen) */
  | 'grid'
  /** Weg mit Pfeiltasten legen */
  | 'path'
  /** Formteile in einen Umriss legen */
  | 'compose'
  /** mehrere Dinge antippen, dann OK (Körper sortieren) */
  | 'select'
  /** Würfelgebäude bauen oder Bauplan schreiben (Feld antippen: ein Würfel mehr) */
  | 'build'
  /** Paare verbinden: Zahl und Darstellung (Darstellungswechsel) */
  | 'match';

/**
 * Stufe einer Aufgabenfamilie. Stufe 0 gibt es nur für das Einspluseins bis 20
 * im Pinguinfelsen (Spezifikation, Abschnitt 5).
 */
export type TaskLevel = 0 | 1 | 2 | 3;

export type TextParams = Readonly<Record<string, string | number>>;

/** Form für Muster und Formenaufgaben (Farben aus der Stilvorgabe). */
export type ShapeKind = 'circle' | 'square' | 'rect' | 'triangle';
export type ShapeColor = 'red' | 'blue' | 'yellow' | 'green';
export type ShapeSpec = {
  kind: ShapeKind;
  color: ShapeColor;
  size?: 's' | 'm' | 'l';
  rot?: number;
};

/** Figur aus Kästchen auf einem Raster (Spalte, Zeile ab 0). */
export type CellFigure = { cols: number; rows: number; cells: Array<[number, number]> };

/** Feld auf einem Raster: Spalte, Zeile ab 0 (oben links). */
export type Cell = [number, number];

/**
 * Spielfeld mit Kästchen: feste grüne Kästchen (given), Bilder auf Feldern (icon: Textur oder
 * 'stone'), Spiegelachse in der Mitte, Startfigur für Wege.
 */
export type BoardSpec = {
  cols: number;
  rows: number;
  given?: Cell[];
  items?: Array<{ cell: Cell; icon: string }>;
  axis?: 'v' | 'h';
  start?: { cell: Cell; icon: string };
};

/**
 * Raster als Eingabe. cells: Kästchen an- und abtippen, dann OK; pick: ein Feld antippen;
 * path: Weg mit Pfeilen legen (Buchstaben r, l, u, d). model: Vorlage links daneben.
 * rule: wie die Eingabe geprüft wird (ohne rule: genau die Antwort).
 */
export type GridInfo = {
  mode: 'cells' | 'pick' | 'path';
  board: BoardSpec;
  model?: CellFigure;
  rule?:
    | { type: 'shape'; cells: Cell[] }
    | { type: 'rect'; area: number; square?: boolean }
    | { type: 'path'; goal: Cell };
};

/** Formteil: Quadrat, Rechteck (2 × 1), rechtwinkliges Dreieck, Halbkreis; rot in 90°-Schritten. */
export type PieceKind = 'square' | 'rect' | 'tri' | 'semi';
export type Piece = { kind: PieceKind; rot: number };
/** Platz eines Teils in einer Figur (Feld oben links). */
export type PieceSlot = Piece & { c: number; r: number };

/** Formen legen: Umriss aus Plätzen, Teile in der Ablage (in der Startlage). */
export type ComposeInfo = { cols: number; rows: number; slots: PieceSlot[]; pieces: Piece[] };

/** Eissorten und Behälter (Kombinatorik in der Zoo-Zählung). */
export type Flavor = 'strawberry' | 'chocolate' | 'vanilla' | 'pistachio' | 'blueberry';
export type IceBase = 'cone' | 'cup';
/** Ein Eis: Kugeln von unten nach oben, Waffel oder Becher. */
export type Ice = { scoops: Flavor[]; base: IceBase };

/** Körper: Würfel, Quader, Kugel, Zylinder, Kegel, Pyramide; look: Körper oder Gegenstand. */
export type SolidKind = 'cube' | 'cuboid' | 'sphere' | 'cylinder' | 'cone' | 'pyramid';
export type SolidSpec = { kind: SolidKind; look: 'plain' | 'object' };

/** Würfelgebäude auf 3 × 3 Feldern: Höhen zeilenweise von hinten nach vorn, links nach rechts. */
export type Heights = number[];

/** Würfelgebäude: Bauplan (Draufsicht) zum Nachbauen oder Gebäude zum Aufschreiben. */
export type BuildInfo = { mode: 'build' | 'plan'; target: Heights };

/**
 * Zahlenstrahl von min bis max: kleine Striche alle `ticks`, Zahlen alle `labels`.
 * marks: Zahlen, die unter dem Strahl stehen (z. B. die Lösung); arrow: Pfeil auf eine Zahl.
 */
export type LineSpec = {
  min: number;
  max: number;
  ticks: number;
  labels: number;
  arrow?: number;
  marks?: number[];
};

/**
 * Marker auf dem Zahlenstrahl setzen (Antwort: die Zahl). snap: Raster beim Setzen;
 * tolerance: so weit darf der Marker daneben liegen (Stufe 3: ungefähr).
 */
export type LineInfo = LineSpec & { snap: number; tolerance: number };

/**
 * Verteilen (share: total Dinge gerecht auf groups Teller) oder Aufteilen (measure: immer size
 * Dinge in einen Korb) zum Selbermachen. Antwort: Anzahl je Teller oder Anzahl Körbe.
 */
export type ShareInfo =
  | { mode: 'share'; total: number; groups: number; icon: string }
  | { mode: 'measure'; total: number; size: number; icon: string };

/** Darstellung einer Zahl auf einer Zuordnungskarte. */
export type ReprKind = 'digits' | 'word' | 'tensones' | 'tenframe';
export type MatchCard = { n: number; repr: ReprKind };

/**
 * Paare verbinden: oben die Karten `top`, unten `bottom` (gemischt). Antwort: zu jeder oberen
 * Karte die Nummer der passenden unteren Karte.
 */
export type MatchInfo = { top: MatchCard[]; bottom: MatchCard[] };

/** Darstellungen für Hinweise und einblendbare Hilfen. */
export type Visual =
  | ({ type: 'board' } & BoardSpec)
  | ({ type: 'line' } & LineSpec)
  | {
      /** Zahlenhaus: Dachzahl, Stockwerke mit zwei Zahlen; null ist die gesuchte Zahl */
      type: 'house';
      top: number;
      floors: Array<[number | null, number | null]>;
    }
  | {
      /** Zuordnung gelöst: Paare aus Zahl und Darstellung nebeneinander (Hinweis) */
      type: 'repr';
      pairs: Array<[MatchCard, MatchCard]>;
    }
  | {
      /** Körper oder Gegenstände nebeneinander */
      type: 'solids';
      items: SolidSpec[];
    }
  | {
      /** Würfelgebäude von schräg oben; marks: Seiten „vorn“ und „rechts“ beschriften */
      type: 'building';
      heights: Heights;
      marks?: boolean;
    }
  | {
      /** Bauplan: Draufsicht mit der Anzahl der Würfel je Feld */
      type: 'plan';
      heights: Heights;
    }
  | {
      /** Strichliste: je Zeile ein Bild und n Striche (Fünferbündel) */
      type: 'tally';
      rows: Array<{ icon: string; n: number }>;
    }
  | {
      /** Tabelle: Spaltenköpfe als Textschlüssel, Zeilen mit Bild und Zahlen */
      type: 'table';
      head: string[];
      rows: Array<{ icon: string; values: number[] }>;
    }
  | {
      /** Säulendiagramm: Säulen mit Bild darunter, Skala in Schritten von step bis max */
      type: 'bars';
      items: Array<{ icon: string; value: number }>;
      step: number;
      max: number;
    }
  | {
      /** Kalenderblatt: Monat 1–12, erster Tag als Wochentag (0 = Montag), Tage; marks: eingekreist */
      type: 'calendar';
      month: number;
      start: number;
      days: number;
      marks?: number[];
    }
  | {
      /** Eis: Auswahl (Sorten, Behälter) und schon gelegte Möglichkeiten */
      type: 'ice';
      flavors: Flavor[];
      bases?: IceBase[];
      shown?: Ice[];
    }
  | {
      /** Figur aus Formteilen; hidden: Plätze, die nur als Umriss erscheinen (Lücke) */
      type: 'pieces';
      cols: number;
      rows: number;
      slots: PieceSlot[];
      hidden?: number[];
    }
  | {
      /** Lagewörter: Schmetterling über, unter, vor, hinter oder neben dem Tisch */
      type: 'position';
      place: 'over' | 'under' | 'front' | 'behind' | 'next';
    }
  | {
      /** Lineal (0 bis max cm) mit Gegenständen von from bis to; ticks: Zahlen zeigen */
      type: 'ruler';
      max: number;
      items: Array<{ from: number; to: number; look: 'pencil' | 'worm' | 'feather' }>;
    }
  | {
      /** Formen in einer Reihe; null ist die Lücke (Muster fortsetzen) */
      type: 'shapes';
      items: Array<ShapeSpec | null>;
    }
  | {
      /** Kästchenfiguren nebeneinander; axis: Spiegelachse in der Mitte der ersten Figur */
      type: 'cells';
      figures: CellFigure[];
      axis?: 'v' | 'h';
      /** Rand der Figur betonen (Umfang) */
      outline?: boolean;
    }
  | {
      /** Rechenstrich: Start, Sprünge; Zwischenwerte auf Wunsch verdeckt. */
      type: 'jumps';
      start: number;
      jumps: number[];
      hideResults?: boolean;
    }
  | {
      /** Hundertertafel mit markierten Zahlen */
      type: 'hundred';
      marked: number[];
    }
  | {
      /**
       * Zwei Zehnerfelder (bis 20): `first` Plättchen; bei „+“ kommen `second` als Ringe
       * dazu, bei „−“ werden die letzten `second` durchgestrichen.
       */
      type: 'tenframe';
      first: number;
      second: number;
      op: '+' | '-';
    }
  | {
      /** Zehnerstangen und Einerwürfel; ones darf über 9 liegen (Umbündeln) */
      type: 'tensones';
      tens: number;
      ones: number;
    }
  | {
      /** Punktefeld: rows Reihen mit je cols Punkten; die ersten `split` Reihen andersfarbig */
      type: 'dots';
      rows: number;
      cols: number;
      split?: number;
      /** ohne Beschriftung „Reihen · Spalten“ */
      noLabel?: boolean;
    };

/**
 * Eine Hilfestufe: 1 lenkender Satz, 2 Bild der Strategie, 3 Lösung mit Rechenweg.
 * Texte stehen in `hints.de.json`; die Logik liefert nur Schlüssel und Werte.
 */
export type Hint = {
  key: string;
  params?: TextParams;
  visual?: Visual;
};

/**
 * Antwortkarte. Ohne `label` steht `value` auf der Karte; mit `label` ein Text aus den
 * Sprachdateien (z. B. eine Frage zur Sachsituation).
 */
export type TaskOption = {
  value: string;
  errorTag?: string;
  label?: { key: string; params?: TextParams };
  /** Form auf der Karte statt Text (Muster fortsetzen) */
  shape?: ShapeSpec;
  /** Formteil auf der Karte (Welches Teil fehlt?) */
  piece?: Piece;
  /** Weg als Pfeile auf der Karte (Buchstaben r, l, u, d) */
  moves?: string;
  /** Strichliste auf der Karte; bundled: false = Striche ohne Fünferbündel */
  tally?: { n: number; bundled: boolean };
  /** Eis auf der Karte (Welches Eis fehlt?) */
  ice?: Ice;
  /** Körper auf der Karte */
  solid?: SolidSpec;
  /** Bauplan auf der Karte */
  plan?: Heights;
  /** Ansicht auf der Karte: Höhen der Säulen von links nach rechts */
  view?: number[];
};

export type TaskAnswer = number | number[] | string;

/** Bestandteil einer Rechnung oder Zahlenreihe: Zahl, Zeichen oder die gesuchte Stelle. */
export type Term =
  | number
  | '+'
  | '-'
  | '·'
  | ':'
  | '='
  | '<'
  | ','
  | '?'
  | '€'
  | 'ct'
  | 'h'
  | 'min'
  /** Zehner und Einer (Stellenwert) */
  | 'Z'
  | 'E'
  /** Rest beim Teilen (17 : 5 = 3 R 2) */
  | 'R'
  /** Längen */
  | 'm'
  | 'cm'
  | '>';

/**
 * Bild zu einer Sachaufgabe: Gruppen gleicher Dinge (Texturschlüssel `icon`).
 * crossed: so viele Dinge der letzten Gruppe sind durchgestrichen (Wegnehmen).
 */
export type StoryPicture = { icon: string; groups: number[]; crossed?: number };

/** Betrag in Euro oder Cent (ganzzahlig, Klasse 2) und die Münzen und Scheine dafür. */
export type MoneyInfo = { amount: number; unit: 'euro' | 'cent'; denominations: number[] };

/**
 * Uhr zur Aufgabe. time: Minuten seit 0:00 (0 bis 1439). face: Uhr in der Aufgabe zeigen
 * (Uhr lesen). set: das Kind stellt die Zeiger ein; Schrittweite des langen Zeigers in Minuten.
 */
export type ClockInfo = { time: number; face: boolean; set?: { step: number } };

/** Typische falsche Antwort mit Fehlerart (für Antwortkarten und Rückmeldung). */
export type TypicalError = { value: number; errorTag: string };

/** Zahlen einer Rechnung, damit Prüfer und Hilfen nicht den Text zerlegen müssen. */
export type MathInfo = {
  op: '+' | '-';
  a: number;
  b: number;
  result: number;
  /** gesuchte Zahl: Ergebnis (Standard) oder zweiter Summand (Ergänzen) */
  missing: 'result' | 'b';
  /** Zehnerübergang */
  carry: boolean;
};

export type Task = {
  /** eindeutig pro Runde */
  id: string;
  /** z. B. "add_100", "mult_core", "clock_half" */
  family: string;
  level: TaskLevel;
  kind: TaskKind;
  /**
   * Rechnung oder Zahlenreihe; textKey: Frage dazu (Schlüssel in den Texten).
   * Sachaufgaben: story (Vorlage und Zahlen) und picture (Bild der Dinge aus der Geschichte).
   */
  prompt: {
    terms: Term[];
    textKey?: string;
    /** Werte für Platzhalter in der Frage, z. B. { amount: '17 €' } */
    textParams?: TextParams;
    /** Arbeitsanweisung, die zu Beginn im Hinweisbereich steht (z. B. „Welche Frage passt?“) */
    instructionKey?: string;
    images?: string[];
    story?: { id: string; params: TextParams };
    picture?: StoryPicture;
  };
  answer: TaskAnswer;
  /** true: Reihenfolge der Zahlen in einer Antwortliste ist egal */
  unordered?: boolean;
  options?: TaskOption[];
  hints: [Hint, Hint, Hint];
  /** Verweis auf die Strategie, z. B. "add_stepwise" */
  strategyId?: string;
  math?: MathInfo;
  /** Geld legen: Betrag und angebotene Münzen und Scheine (Werte in Cent) */
  money?: MoneyInfo;
  /**
   * Bild zur Aufgabe unter der Frage (z. B. Zehnerstangen zum Zählen). flashMs: nur so lange
   * sichtbar (Blitzblick); der zweite Hinweis zeigt es wieder.
   */
  display?: { visual: Visual; flashMs?: number };
  /** Raster zum Antippen (Kästchen malen, Feld wählen, Weg legen) */
  grid?: GridInfo;
  /** Formteile in einen Umriss legen */
  compose?: ComposeInfo;
  /** Mehrfachauswahl: Dinge zum Antippen (Antwort: Nummern der richtigen Dinge) */
  select?: SolidSpec[];
  /** Würfelgebäude bauen oder Bauplan schreiben */
  build?: BuildInfo;
  /** Paare verbinden (Darstellungswechsel) */
  match?: MatchInfo;
  /** Ziehen und Ordnen: Beschriftung links und rechts der Reihe (Textschlüssel) */
  sortEnds?: [string, string];
  /** Marker auf dem Zahlenstrahl setzen */
  line?: LineInfo;
  /** Verteilen oder Aufteilen zum Selbermachen */
  share?: ShareInfo;
  /** Uhrzeit: angezeigte oder einzustellende Zeit */
  clock?: ClockInfo;
  /** typische falsche Antworten als Text (z. B. Uhrzeiten) mit Fehlerart */
  errorAnswers?: Array<{ value: string; errorTag: string }>;
  /** typische Fehler, falls nicht aus `math` ableitbar */
  typicalErrors?: TypicalError[];
  /** Schlüssel zum Erkennen von Duplikaten; Tauschaufgaben haben denselben */
  dedupeKey: string;
};

/** Rohe Eingabe des Kindes, bevor sie normalisiert und geprüft wird. */
export type TaskInput = string | number | number[];

export type CheckResult = { correct: boolean; errorTag?: string; invalid?: boolean };

/** Erzeugt eine Aufgabe einer Familie und Stufe mit den Parametern aus families.json. */
export type Generator = (level: TaskLevel, rng: Rng, id: string, params: FamilyParams) => Task;

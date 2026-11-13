/**
 * Anzeige-Einstellungen des aktiven Profils (Spezifikation 9): größere Schrift, hoher Kontrast,
 * weniger Bewegung. Jede Szene übernimmt sie beim Start (BaseScene), Farben und Größen unten
 * richten sich danach.
 */
export type DisplaySettings = { largeText: boolean; highContrast: boolean; reducedMotion: boolean };
const display: DisplaySettings = { largeText: false, highContrast: false, reducedMotion: false };

export function applyDisplay(settings: Partial<DisplaySettings> | undefined): void {
  display.largeText = settings?.largeText === true;
  display.highContrast = settings?.highContrast === true;
  display.reducedMotion = settings?.reducedMotion === true;
}

export function displaySettings(): Readonly<DisplaySettings> {
  return display;
}

/** Größere Schrift: Lesetexte wachsen um etwa ein Achtel, Ziffern und Titel bleiben. */
const LARGE = 1.125;
const scaled = (px: number) => (display.largeText ? Math.round(px * LARGE) : px);

/**
 * Farben und Schriftgrößen aus der Stilvorgabe (`stilprobe/tokens.json`,
 * `stilprobe/style-guide.md`). Keine anderen Farbwerte verwenden; einzige Ausnahme ist der
 * hohe Kontrast (Schwarz auf Weiß für Konturen, Text und helle Flächen).
 */
export const Color = {
  get kontur(): number {
    return display.highContrast ? 0x000000 : 0x4a3426;
  },
  get text(): number {
    return display.highContrast ? 0x000000 : 0x3a2a20;
  },
  get papier(): number {
    return display.highContrast ? 0xffffff : 0xfff8ec;
  },
  kartenSchatten: 0xe8d3a8,
  himmel: 0xbfe6f2,
  himmelTief: 0x8fcde3,
  wasser: 0x5bb8d9,
  grasHell: 0xb5e08f,
  gras: 0x8ccb6b,
  stern: 0xffc83d,
  sonne: 0xffd25a,
  orange: 0xffb347,
  rosa: 0xff8fa3,
  erde: 0xc98f5a,
  weiss: 0xffffff,
  grauWarm: 0xc9bba3,
  laub: 0x3f8f4f,
  pinguinGefieder: 0x6c8ea3,
};

export const CssColor = {
  get kontur(): string {
    return display.highContrast ? '#000000' : '#4A3426';
  },
  get text(): string {
    return display.highContrast ? '#000000' : '#3A2A20';
  },
  get papier(): string {
    return display.highContrast ? '#FFFFFF' : '#FFF8EC';
  },
};

/** Schriften: Andika (Text und Ziffern), Fredoka (Titel); beide selbst gehostet (SIL OFL). */
export const FontFamily = {
  text: 'Andika, system-ui, sans-serif',
  title: 'Fredoka, Andika, system-ui, sans-serif',
} as const;

/** Mindestgrößen in der Basisauflösung (Spezifikation, Abschnitt 9). */
export const FontSize = {
  get small(): number {
    return scaled(24);
  },
  get text(): number {
    return scaled(28);
  },
  digits: 48,
  title: 56,
};

export const Stroke = {
  get outline(): number {
    return display.highContrast ? 5 : 4;
  },
  get inner(): number {
    return display.highContrast ? 3.5 : 2.5;
  },
};

/** Tasten mindestens 96 × 96 px (Stilvorgabe); Abstand mindestens 16 px. */
export const Layout = {
  minTouch: 96,
  gap: 16,
  margin: 24,
} as const;

/** Bewegung reduzieren, wenn das Betriebssystem es verlangt (Spezifikation, Abschnitt 9). */
export function reducedMotion(): boolean {
  if (display.reducedMotion) return true;
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/** Texturschlüssel der geladenen Bilder. */
export const Tex = {
  starFull: 'ui_stern_voll',
  starEmpty: 'ui_stern_leer',
  hint: 'ui_hinweis_gluehbirne',
  correct: 'ui_richtig_haken',
  tryAgain: 'ui_nochmal_wolke',
  ten: 'mathe_zehner',
  one: 'mathe_einer',
  speaker: 'ui_vorlesen',
  back: 'ui_zurueck',
  next: 'ui_weiter',
  mapIcon: 'ui_karte',
  backspace: 'ui_loeschen',
  aidTens: 'ui_hilfe_zehner',
  aidLine: 'ui_hilfe_rechenstrich',
  aidHundred: 'ui_hilfe_hundertertafel',
  menuStart: 'menue_start',
  menuProfile: 'menue_profil',
  menuAdults: 'menue_erwachsene',
  menuRoundEnd: 'menue_rundenende',
  map: 'karte_hintergrund',
  mapLock: 'karte_schloss',
  mapSign: 'karte_schild',
} as const;

/**
 * Farben und Schriftgrößen aus der Stilvorgabe (`stilprobe/tokens.json`,
 * `stilprobe/style-guide.md`). Keine anderen Farbwerte verwenden.
 */
export const Color = {
  kontur: 0x4a3426,
  text: 0x3a2a20,
  papier: 0xfff8ec,
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
} as const;

export const CssColor = {
  kontur: '#4A3426',
  text: '#3A2A20',
  papier: '#FFF8EC',
} as const;

/** Schriften: Andika (Text und Ziffern), Fredoka (Titel); beide selbst gehostet (SIL OFL). */
export const FontFamily = {
  text: 'Andika, system-ui, sans-serif',
  title: 'Fredoka, Andika, system-ui, sans-serif',
} as const;

/** Mindestgrößen in der Basisauflösung (Spezifikation, Abschnitt 9). */
export const FontSize = {
  small: 24,
  text: 28,
  digits: 48,
  title: 56,
} as const;

export const Stroke = {
  outline: 4,
  inner: 2.5,
} as const;

/** Tasten mindestens 96 × 96 px (Stilvorgabe); Abstand mindestens 16 px. */
export const Layout = {
  minTouch: 96,
  gap: 16,
  margin: 24,
} as const;

/** Bewegung reduzieren, wenn das Betriebssystem es verlangt (Spezifikation, Abschnitt 9). */
export function reducedMotion(): boolean {
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
  map: 'karte_hintergrund',
  mapLock: 'karte_schloss',
  mapSign: 'karte_schild',
} as const;

/** Kartensymbol je Tier; fehlt eines, zeigt die Karte das Schild „bald“. */
export const AnimalIcon: Readonly<Record<string, string>> = {
  monkey: 'karte_affe',
  penguin: 'karte_pinguin',
};

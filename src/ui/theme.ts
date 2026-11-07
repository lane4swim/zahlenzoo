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
  gras: 0x8ccb6b,
  stern: 0xffc83d,
  orange: 0xffb347,
  wasser: 0x5bb8d9,
} as const;

export const CssColor = {
  kontur: '#4A3426',
  text: '#3A2A20',
  papier: '#FFF8EC',
} as const;

/** Schrift: Andika folgt (selbst gehostet); bis dahin eine Systemschrift. */
export const FontFamily = {
  text: 'Andika, "Atkinson Hyperlegible", system-ui, sans-serif',
  title: 'Fredoka, Andika, system-ui, sans-serif',
} as const;

/** Mindestgrößen in der Basisauflösung (Spezifikation, Abschnitt 9). */
export const FontSize = {
  text: 28,
  digits: 48,
  title: 64,
} as const;

export const Stroke = {
  outline: 4,
} as const;

/** Tasten mindestens 96 × 96 px (Stilvorgabe); Abstand mindestens 16 px. */
export const Layout = {
  minTouch: 96,
  gap: 16,
  margin: 24,
} as const;

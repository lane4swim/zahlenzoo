/**
 * Audio (Spezifikation 9 und 11, Variante B): Effekte, Tierlaute, Musik je Szene und
 * Vorlesen. Vorlesen spielt eine eingesprochene Datei, wenn es für den Textschlüssel eine
 * gibt, sonst liest die Sprachausgabe des Browsers. Hier steht nur die reine Logik;
 * abgespielt wird im AudioService.
 */

/** Effekte (Dateien in public/assets/audio/sfx/, erzeugt mit art/build_audio.py). */
export const SFX = [
  'correct',
  'wrong',
  'tap',
  'digit',
  'pick',
  'drop',
  'star',
  'unlock',
  'round_end',
  'hint',
  'erase',
  'coin',
  'badge',
  'clock',
  'swoosh',
] as const;
export type Sfx = (typeof SFX)[number];

/** Tierlaute (public/assets/audio/animals/<tier>.mp3). */
export const ANIMAL_SOUNDS = [
  'penguin',
  'monkey',
  'elephant',
  'parrot',
  'owl',
  'butterfly',
  'giraffe',
  'meerkat',
] as const;

/** Musikstücke als Loop (public/assets/audio/music/). */
export const MUSIC = ['map', 'task', 'round_end'] as const;
export type Music = (typeof MUSIC)[number];

/** Musik je Szene; undefined: Musik läuft weiter, null: Stille. */
const SCENE_MUSIC: Readonly<Record<string, Music | null>> = {
  Profile: 'map',
  ProfileCreate: 'map',
  Menu: 'map',
  Map: 'map',
  Area: 'map',
  Zoo: 'map',
  Pattern: 'map',
  Settings: 'map',
  Parent: null,
  Task: 'task',
  RoundEnd: 'round_end',
};

export function musicFor(sceneKey: string): Music | null | undefined {
  return SCENE_MUSIC[sceneKey];
}

/** Während des Vorlesens wird die Musik leiser, damit die Stimme gut zu hören ist. */
export const DUCK = 0.3;

/** Musik ist leiser als die Effekte: Sie soll nicht ablenken (Spezifikation 9). */
export const MUSIC_GAIN = 0.5;

export function musicVolume(setting: number, ducked: boolean): number {
  const v = Math.max(0, Math.min(1, setting)) * MUSIC_GAIN;
  return ducked ? v * DUCK : v;
}

/** Teil eines vorgelesenen Textes: Schlüssel (für eine Aufnahme) und der fertige Text. */
export type SpeechPart = { key?: string; params?: Readonly<Record<string, unknown>>; text: string };

/** Abspielschritt: eingesprochene Datei oder Sprachausgabe. */
export type SpeechStep = { file: string } | { tts: string };

/**
 * Plant das Vorlesen. Eine Aufnahme gibt es nur für Sätze ohne Platzhalter (eine Datei kann
 * keine Zahlen einsetzen); alles andere liest die Sprachausgabe. Aufeinanderfolgende Texte
 * für die Sprachausgabe werden zusammengefasst, damit sie flüssig klingt.
 */
export function speechPlan(
  parts: readonly SpeechPart[],
  recorded: ReadonlySet<string>,
): SpeechStep[] {
  const steps: SpeechStep[] = [];
  for (const part of parts) {
    const text = part.text.trim();
    if (text === '') continue;
    const fixed = !part.params || Object.keys(part.params).length === 0;
    if (part.key && fixed && recorded.has(part.key)) {
      steps.push({ file: voiceFile(part.key) });
      continue;
    }
    const last = steps[steps.length - 1];
    if (last && 'tts' in last) last.tts = `${last.tts} ${text}`;
    else steps.push({ tts: text });
  }
  return steps;
}

/** Pfad einer Aufnahme (relativ zu assets/); Punkte im Schlüssel bleiben erhalten. */
export function voiceFile(key: string): string {
  return `audio/voice/${key}.mp3`;
}

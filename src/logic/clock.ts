import type { TextParams } from '../types/task';

/**
 * Uhrzeiten als Minuten seit 0:00. Analoge Uhren zeigen 12 Stunden; Antworten zum
 * Einstellen und Lesen werden als „h:mm“ mit h von 1 bis 12 verglichen.
 */
export const DAY = 24 * 60;
export const HALF_DAY = 12 * 60;

export type MinuteType = 'full' | 'half' | 'quarterPast' | 'quarterTo';

/** Zeit in den Bereich 0 bis 1439 bringen (auch nach Rückwärtsrechnen). */
export const wrapDay = (time: number): number => ((time % DAY) + DAY) % DAY;

/** Stunde auf der analogen Uhr: 1 bis 12. */
export function hour12(time: number): number {
  const h = Math.floor(wrapDay(time) / 60) % 12;
  return h === 0 ? 12 : h;
}

export const minuteOf = (time: number): number => wrapDay(time) % 60;

/** Antwort auf der analogen Uhr, z. B. „7:30“ (ohne Vormittag und Nachmittag). */
export function analog(time: number): string {
  return `${hour12(time)}:${String(minuteOf(time)).padStart(2, '0')}`;
}

/** Digitale Schreibweise mit 24 Stunden, z. B. „19:30“ und „7:05“. */
export function digital(time: number): string {
  const t = wrapDay(time);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

export function minuteType(time: number): MinuteType {
  const m = minuteOf(time);
  if (m === 30) return 'half';
  if (m === 15) return 'quarterPast';
  if (m === 45) return 'quarterTo';
  if (m === 0) return 'full';
  throw new Error(`Keine volle, halbe oder Viertelstunde: ${digital(time)}`);
}

/**
 * Gesprochene Uhrzeit als Textschlüssel: „7 Uhr“, „halb 8“, „Viertel nach 7“,
 * „Viertel vor 8“. h: Stunde, die gerade war; next: Stunde, die kommt.
 */
export function timeLabel(time: number): { key: string; params: TextParams } {
  const h = hour12(time);
  return { key: `time.${minuteType(time)}`, params: { h, next: (h % 12) + 1 } };
}

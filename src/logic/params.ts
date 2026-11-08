import type { FamilyParams } from '../types/content';

/**
 * Lesen der Stufenparameter aus families.json. Fehlt ein Wert oder hat er den
 * falschen Typ, gibt es einen klaren Fehler (die Inhaltstests decken das ab).
 */
export function num(params: FamilyParams, key: string): number {
  const value = params.level[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Parameter „${key}“ fehlt oder ist keine Zahl`);
  }
  return value;
}

/** Anteil zwischen 0 und 1. */
export function share(params: FamilyParams, key: string): number {
  const value = num(params, key);
  if (value < 0 || value > 1) throw new Error(`Parameter „${key}“ muss zwischen 0 und 1 liegen`);
  return value;
}

export function nums(params: FamilyParams, key: string): number[] {
  const value = params.level[key];
  if (!Array.isArray(value) || value.length === 0 || !value.every(Number.isInteger)) {
    throw new Error(`Parameter „${key}“ muss eine Liste ganzer Zahlen sein`);
  }
  return value;
}

/** Anteil einer Eingabeform; fehlt sie, ist der Anteil 0. */
export function kindShare(params: FamilyParams, kind: string): number {
  return params.kinds[kind] ?? 0;
}

import animals from './animals.json';
import areas from './areas.json';
import families from './families.json';
import hints from './hints.de.json';
import legal from './legal.json';
import praise from './praise.de.json';
import rules from './rules.json';
import strings from './strings.de.json';
import type { RawContent } from '../logic/content';

/**
 * Inhalte und Texte werden mit dem Programm gebaut (nicht zur Laufzeit nachgeladen).
 * So passen Code und Daten nach einem Update immer zusammen, auch wenn der Browser
 * einzelne Dateien noch aus dem Cache liefert.
 */
export const RAW_CONTENT: RawContent = { rules, areas, families, animals, praise, legal };

/** Texte je Sprache: Oberfläche und Hinweise. */
export const TEXTS_DE: readonly unknown[] = [strings, hints];

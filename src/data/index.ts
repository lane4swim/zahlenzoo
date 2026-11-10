import achievements from './achievements.json';
import animals from './animals.json';
import areas from './areas.json';
import decor from './decor.json';
import families from './families.json';
import hints from './hints.de.json';
import legal from './legal.json';
import praise from './praise.de.json';
import rules from './rules.json';
import situations from './situations.json';
import stories from './stories.json';
import strings from './strings.de.json';
import wordTemplates from './word-templates.de.json';
import type { RawContent } from '../logic/content';

/**
 * Inhalte und Texte werden mit dem Programm gebaut (nicht zur Laufzeit nachgeladen).
 * So passen Code und Daten nach einem Update immer zusammen, auch wenn der Browser
 * einzelne Dateien noch aus dem Cache liefert.
 */
export const RAW_CONTENT: RawContent = {
  rules,
  areas,
  families,
  animals,
  praise,
  legal,
  stories,
  situations,
  decor,
  achievements,
};

/** Texte je Sprache: Oberfläche, Hinweise und Sachaufgaben. */
export const TEXTS_DE: readonly unknown[] = [strings, hints, wordTemplates];

import animals from '../../public/assets/data/animals.json';
import areas from '../../public/assets/data/areas.json';
import families from '../../public/assets/data/families.json';
import legal from '../../public/assets/data/legal.json';
import praise from '../../public/assets/data/praise.de.json';
import rules from '../../public/assets/data/rules.json';
import { familyParams, parseContent, type RawContent } from '../../src/logic/content';
import { GENERATOR_IDS } from '../../src/logic/generators';
import type { FamilyParams } from '../../src/types/content';

/** Die Inhaltsdateien des Spiels, wie sie die BootScene lädt. */
export const RAW: RawContent = { rules, areas, families, animals, praise, legal };

export const CONTENT = parseContent(RAW, GENERATOR_IDS);
export const RULES = CONTENT.rules;

/** Parameter einer Familie für eine Stufe aus families.json. */
export const paramsOf =
  (family: string) =>
  (level: number): FamilyParams =>
    familyParams(CONTENT, family, level);

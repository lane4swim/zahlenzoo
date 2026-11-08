import animals from '../../src/data/animals.json';
import areas from '../../src/data/areas.json';
import families from '../../src/data/families.json';
import legal from '../../src/data/legal.json';
import praise from '../../src/data/praise.de.json';
import rules from '../../src/data/rules.json';
import situations from '../../src/data/situations.json';
import stories from '../../src/data/stories.json';
import { familyParams, parseContent, type RawContent } from '../../src/logic/content';
import { GENERATOR_IDS } from '../../src/logic/generators';
import type { FamilyParams } from '../../src/types/content';

/** Die Inhaltsdateien des Spiels, wie sie die BootScene lädt. */
export const RAW: RawContent = {
  rules,
  areas,
  families,
  animals,
  praise,
  legal,
  stories,
  situations,
};

export const CONTENT = parseContent(RAW, GENERATOR_IDS);
export const RULES = CONTENT.rules;

/** Parameter einer Familie für eine Stufe aus families.json. */
export const paramsOf =
  (family: string) =>
  (level: number): FamilyParams =>
    familyParams(CONTENT, family, level);

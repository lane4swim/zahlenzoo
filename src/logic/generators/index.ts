import { add100, ADD_100 } from './add100';
import { multTable, MULT_TABLE } from './multTable';
import { neighbors100, NEIGHBORS_100 } from './neighbors100';
import { plusFacts20, PLUS_FACTS_20 } from './plusFacts20';
import { moneyLay, MONEY_LAY } from './moneyLay';
import { storyAddSub, STORY_ADDSUB, storyAddSubFor } from './storyAddSub';
import { storyMultDiv, STORY_MULTDIV } from './storyMultDiv';
import { sub100, SUB_100 } from './sub100';
import type { Generator } from '../../types/task';

/** Generatoren je Aufgabenfamilie; areas.json und families.json verweisen auf diese IDs. */
export const GENERATORS: Readonly<Record<string, Generator>> = {
  [ADD_100]: add100,
  [NEIGHBORS_100]: neighbors100,
  [MULT_TABLE]: multTable,
  [SUB_100]: sub100,
  [PLUS_FACTS_20]: plusFacts20,
  [STORY_ADDSUB]: storyAddSub,
  [STORY_MULTDIV]: storyMultDiv,
  [MONEY_LAY]: moneyLay,
  money_calc: storyAddSubFor('money_calc'),
};

export const GENERATOR_IDS = Object.keys(GENERATORS);

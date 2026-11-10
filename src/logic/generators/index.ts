import { add100, ADD_100 } from './add100';
import { multTable, MULT_TABLE } from './multTable';
import { neighbors100, NEIGHBORS_100 } from './neighbors100';
import {
  COMPARE_100,
  compare100,
  COUNT_STEPS_100,
  countSteps,
  PLACE_VALUE_100,
  placeValue,
  QUICK_COUNT,
  quickCount,
  READ_WRITE_100,
  readWrite,
} from './numbers100';
import { plusFacts20, PLUS_FACTS_20 } from './plusFacts20';
import { CLOCK_FAMILIES, clockFor } from './clock';
import { compareMoney, COMPARE_MONEY } from './compareMoney';
import {
  ESTIMATE_100,
  estimate100,
  PATH_CHOICE,
  pathChoice,
  QUICK_TENS,
  quickTens,
} from './mental';
import { moneyConvert, MONEY_CONVERT } from './moneyConvert';
import { moneyLay, MONEY_LAY } from './moneyLay';
import { EXACT_OR_ESTIMATE, exactOrEstimate, QUESTION_PICK, questionPick } from './situations';
import { storyAddSub, STORY_ADDSUB, storyAddSubFor } from './storyAddSub';
import { storyMultDiv, STORY_MULTDIV } from './storyMultDiv';
import { sub100, SUB_100 } from './sub100';
import { COMPARE_DURATION, compareDuration, TIME_UNITS, timeUnits } from './time';
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
  [MONEY_CONVERT]: moneyConvert,
  [COMPARE_MONEY]: compareMoney,
  [QUESTION_PICK]: questionPick,
  [EXACT_OR_ESTIMATE]: exactOrEstimate,
  ...Object.fromEntries(CLOCK_FAMILIES.map((f) => [f, clockFor(f)])),
  [COMPARE_DURATION]: compareDuration,
  [TIME_UNITS]: timeUnits,
  [COUNT_STEPS_100]: countSteps,
  [READ_WRITE_100]: readWrite,
  [PLACE_VALUE_100]: placeValue,
  [QUICK_COUNT]: quickCount,
  [COMPARE_100]: compare100,
  [QUICK_TENS]: quickTens,
  [ESTIMATE_100]: estimate100,
  [PATH_CHOICE]: pathChoice,
};

export const GENERATOR_IDS = Object.keys(GENERATORS);

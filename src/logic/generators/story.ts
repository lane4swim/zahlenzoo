import { optionsFromErrors, uniqueErrors } from '../options';
import { kindShare } from '../params';
import type { Rng } from '../rng';
import type { FamilyParams, StoryOp } from '../../types/content';
import type {
  MathInfo,
  StoryPicture,
  Task,
  TaskLevel,
  TextParams,
  TypicalError,
} from '../../types/task';

/**
 * Baustein für Sachaufgaben (Eingabeform `word`): wählt eine Vorlage der Rechenart,
 * baut Bild, Hinweise und Antwortkarten. Texte stehen in word-templates.de.json;
 * die Logik liefert nur Vorlage und Zahlen.
 */
export type StorySpec = {
  family: string;
  level: TaskLevel;
  id: string;
  op: StoryOp;
  /** Werte für die Platzhalter der Vorlage */
  values: Readonly<Record<string, number>>;
  answer: number;
  /** Rechnung mit „?“ für die Lösung, z. B. „12 + 5 = ?“ */
  equation: string;
  picture: Omit<StoryPicture, 'icon'>;
  errors: TypicalError[];
  math?: MathInfo;
};

export function storyTask(spec: StorySpec, rng: Rng, params: FamilyParams): Task {
  const templates = (params.stories ?? []).filter((s) => s.op === spec.op);
  if (templates.length === 0) {
    throw new Error(`${spec.family}: keine Vorlage für die Rechenart ${spec.op}`);
  }
  const template = rng.pick(templates);
  const values: TextParams = { ...spec.values };
  const solved = spec.equation.replace('?', String(spec.answer));
  const errors = uniqueErrors(spec.errors, spec.answer);
  const task: Task = {
    id: spec.id,
    family: spec.family,
    level: spec.level,
    kind: 'word',
    prompt: {
      terms: ['?'],
      story: { id: template.id, params: values },
      picture: { icon: template.icon, ...spec.picture },
    },
    answer: spec.answer,
    hints: [
      // Forscherfrage: Was ist gegeben, was ist gesucht? (KE, Problemlösen)
      { key: `hint.story_${spec.op}.1`, params: values },
      { key: 'hint.story.2', params: { equation: spec.equation } },
      { key: 'hint.story.3', params: { equation: solved, answer: spec.answer } },
    ],
    strategyId: `story_${spec.op}`,
    typicalErrors: errors,
    dedupeKey: `story:${spec.op}:${Object.values(spec.values).join(':')}`,
  };
  if (spec.math) task.math = spec.math;
  if (rng.chance(kindShare(params, 'choice'))) {
    task.options = optionsFromErrors(spec.answer, errors, rng);
  }
  return task;
}

/** Bild als Gruppen gleich großer Teile, z. B. 4 Gruppen mit je 3. */
export const repeated = (groups: number, each: number) =>
  Array.from({ length: groups }, () => each);

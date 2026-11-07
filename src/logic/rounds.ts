import type { Rng } from './rng';
import type { AnswerOutcome, RoundSummary } from '../types/round';
import type { Generator, Task, TaskLevel } from '../types/task';

/** Unveränderlicher Zustand einer Runde. */
export type Round = {
  readonly tasks: readonly Task[];
  readonly outcomes: readonly AnswerOutcome[];
};

export function createRound(tasks: readonly Task[]): Round {
  if (tasks.length === 0) throw new RangeError('createRound(): Runde ohne Aufgaben');
  const ids = new Set(tasks.map((task) => task.id));
  if (ids.size !== tasks.length) throw new RangeError('createRound(): doppelte Aufgaben-IDs');
  return { tasks: [...tasks], outcomes: [] };
}

export function isFinished(round: Round): boolean {
  return round.outcomes.length >= round.tasks.length;
}

export function currentTask(round: Round): Task | undefined {
  return round.tasks[round.outcomes.length];
}

export function recordOutcome(round: Round, outcome: AnswerOutcome): Round {
  if (isFinished(round)) throw new RangeError('recordOutcome(): Runde ist schon beendet');
  return { tasks: round.tasks, outcomes: [...round.outcomes, outcome] };
}

/** Hängt eine Aufgabe an (z. B. Wiederholung derselben Familie nach drei Fehlversuchen). */
export function appendTask(round: Round, task: Task): Round {
  if (round.tasks.some((t) => t.id === task.id)) {
    throw new RangeError('appendTask(): doppelte Aufgaben-ID');
  }
  return { tasks: [...round.tasks, task], outcomes: round.outcomes };
}

export function progress(round: Round): { done: number; total: number } {
  return { done: round.outcomes.length, total: round.tasks.length };
}

export function summarize(round: Round): RoundSummary {
  const count = (outcome: AnswerOutcome) => round.outcomes.filter((o) => o === outcome).length;
  return {
    total: round.outcomes.length,
    firstTry: count('first_try'),
    withHelp: count('with_help'),
    wrong: count('wrong'),
  };
}

// ---------------------------------------------------------------------------
// Rundenzusammenstellung (Spezifikation, Abschnitt 7)

export const ROUND_SIZE = { min: 8, max: 12, default: 10 } as const;
const MAX_LEVEL = 3;
/** Versuche, eine neue (nicht doppelte) Aufgabe zu erzeugen, bevor aufgegeben wird. */
const MAX_TRIES = 200;

/** Anzahl Aufgaben je Stufe: 70 % aktuell, 20 % Vorstufe, 10 % nächste Stufe. */
export function levelMix(level: TaskLevel, size: number): Array<[TaskLevel, number]> {
  const prev = level > 1 ? Math.round(size * 0.2) : 0;
  const next = level < MAX_LEVEL ? Math.max(1, Math.round(size * 0.1)) : 0;
  const current = size - prev - next;
  const mix: Array<[TaskLevel, number]> = [[level, current]];
  if (prev > 0) mix.push([(level - 1) as TaskLevel, prev]);
  if (next > 0) mix.push([(level + 1) as TaskLevel, next]);
  return mix;
}

/**
 * Ordnet Aufgaben leicht ansteigend: erst leichter, in der Mitte schwerer,
 * am Ende wieder leichter. Gleich schwere Aufgaben werden gemischt.
 */
export function hillOrder<T>(items: readonly T[], difficulty: (item: T) => number, rng: Rng): T[] {
  const sorted = rng.shuffle(items).sort((x, y) => difficulty(x) - difficulty(y));
  const front: T[] = [];
  const back: T[] = [];
  sorted.forEach((item, i) => (i % 2 === 0 ? front : back).push(item));
  return [...front, ...back.reverse()];
}

export type ComposeOptions = {
  family: string;
  generator: Generator;
  level: TaskLevel;
  rng: Rng;
  size?: number;
};

/** Erzeugt Aufgaben ohne Duplikate (Tauschaufgaben zählen als gleich). */
export class TaskFactory {
  private readonly used = new Set<string>();
  private counter = 0;

  constructor(
    private readonly family: string,
    private readonly generator: Generator,
    private readonly rng: Rng,
  ) {}

  next(level: TaskLevel): Task {
    for (let i = 0; i < MAX_TRIES; i++) {
      const task = this.generator(level, this.rng, `${this.family}-${this.counter + 1}`);
      if (this.used.has(task.dedupeKey)) continue;
      this.used.add(task.dedupeKey);
      this.counter++;
      return task;
    }
    throw new Error(`TaskFactory: keine neue Aufgabe für ${this.family} Stufe ${level}`);
  }
}

export function composeRound(options: ComposeOptions): { round: Round; factory: TaskFactory } {
  const size = options.size ?? ROUND_SIZE.default;
  if (size < ROUND_SIZE.min || size > ROUND_SIZE.max) {
    throw new RangeError(`composeRound(): ${size} Aufgaben, erlaubt 8 bis 12`);
  }
  const factory = new TaskFactory(options.family, options.generator, options.rng);
  const tasks: Task[] = [];
  for (const [level, count] of levelMix(options.level, size)) {
    for (let i = 0; i < count; i++) tasks.push(factory.next(level));
  }
  const ordered = hillOrder(tasks, (t) => t.level, options.rng);
  return { round: createRound(ordered), factory };
}

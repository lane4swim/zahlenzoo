import type {
  Achievement,
  AchievementCondition,
  AnimalConfig,
  DecorConfig,
  AreaConfig,
  FamilyConfig,
  GameContent,
  Legal,
  LevelParams,
  Praise,
  Rules,
  SkillRules,
  SituationTemplate,
  StoryOp,
  StoryTemplate,
} from '../types/content';

/**
 * Prüft die Inhaltsdateien beim Laden. Fehler nennen Datei und Stelle, damit
 * Änderungen an den JSON-Dateien (z. B. nach dem Pilot) sicher bleiben.
 */
export class ContentError extends Error {}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function obj(v: unknown, where: string): Obj {
  if (!isObj(v)) throw new ContentError(`${where}: Objekt erwartet`);
  return v;
}

function str(v: unknown, where: string, allowEmpty = false): string {
  if (typeof v !== 'string' || (!allowEmpty && v.trim() === '')) {
    throw new ContentError(`${where}: Text erwartet`);
  }
  return v;
}

function int(v: unknown, where: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    throw new ContentError(`${where}: ganze Zahl von ${min} bis ${max} erwartet`);
  }
  return v;
}

function frac(v: unknown, where: string): number {
  if (typeof v !== 'number' || v < 0 || v > 1)
    throw new ContentError(`${where}: Anteil 0 bis 1 erwartet`);
  return v;
}

function strings(v: unknown, where: string): string[] {
  if (!Array.isArray(v) || v.length === 0) throw new ContentError(`${where}: Liste erwartet`);
  return v.map((s, i) => str(s, `${where}[${i}]`));
}

/** Fehlt der Eintrag, ist die Frage „Wie hast du gerechnet?“ abgeschaltet. */
function parseStrategyPick(v: unknown): Rules['strategyPick'] {
  if (v === undefined) return { families: [], chance: 0, maxPerRound: 0 };
  const o = obj(v, 'rules.json strategyPick');
  return {
    families: strings(o.families, 'strategyPick.families'),
    chance: frac(o.chance, 'strategyPick.chance'),
    maxPerRound: int(o.maxPerRound, 'strategyPick.maxPerRound', 0, 50),
  };
}

/** Fehlt der Eintrag, gelten die Startwerte der Spezifikation (Abschnitt 7). */
function parseSkillRules(v: unknown): SkillRules {
  const o = v === undefined ? {} : obj(v, 'rules.json skill');
  const def: SkillRules = {
    upConfidence: 0.85,
    upMin: 8,
    downConfidence: 0.5,
    downWindow: 6,
    explainAfterErrors: 3,
    dailyTasks: 5,
    dailyPauseDays: 7,
    tempoMinLevel: 2,
    tempoConfidence: 0.85,
  };
  return {
    upConfidence:
      o.upConfidence === undefined ? def.upConfidence : frac(o.upConfidence, 'skill.upConfidence'),
    upMin: o.upMin === undefined ? def.upMin : int(o.upMin, 'skill.upMin', 1, 100),
    downConfidence:
      o.downConfidence === undefined
        ? def.downConfidence
        : frac(o.downConfidence, 'skill.downConfidence'),
    downWindow:
      o.downWindow === undefined ? def.downWindow : int(o.downWindow, 'skill.downWindow', 1, 100),
    explainAfterErrors:
      o.explainAfterErrors === undefined
        ? def.explainAfterErrors
        : int(o.explainAfterErrors, 'skill.explainAfterErrors', 1, 50),
    dailyTasks:
      o.dailyTasks === undefined ? def.dailyTasks : int(o.dailyTasks, 'skill.dailyTasks', 1, 20),
    dailyPauseDays:
      o.dailyPauseDays === undefined
        ? def.dailyPauseDays
        : int(o.dailyPauseDays, 'skill.dailyPauseDays', 1, 365),
    tempoMinLevel:
      o.tempoMinLevel === undefined
        ? def.tempoMinLevel
        : int(o.tempoMinLevel, 'skill.tempoMinLevel', 1, 3),
    tempoConfidence:
      o.tempoConfidence === undefined
        ? def.tempoConfidence
        : frac(o.tempoConfidence, 'skill.tempoConfidence'),
  };
}

export function parseRules(data: unknown): Rules {
  const d = obj(data, 'rules.json');
  const round = obj(d.round, 'rules.json round');
  const mix = obj(round.mix, 'rules.json round.mix');
  const stars = obj(d.stars, 'rules.json stars');
  const rules: Rules = {
    round: {
      size: int(round.size, 'round.size', 1, 50),
      minSize: int(round.minSize, 'round.minSize', 1, 50),
      maxSize: int(round.maxSize, 'round.maxSize', 1, 50),
      mix: {
        current: frac(mix.current, 'round.mix.current'),
        previous: frac(mix.previous, 'round.mix.previous'),
        next: frac(mix.next, 'round.mix.next'),
      },
    },
    maxLevel: int(d.maxLevel, 'maxLevel', 1, 3),
    attempts: int(d.attempts, 'attempts', 1, 10),
    maxRepeats: int(d.maxRepeats, 'maxRepeats', 0, 10),
    stars: { two: frac(stars.two, 'stars.two'), three: frac(stars.three, 'stars.three') },
    levelUnlockStars: int(d.levelUnlockStars, 'levelUnlockStars', 1, 3),
    areaUnlockStars: int(d.areaUnlockStars, 'areaUnlockStars', 0, 1000),
    skillHistory: int(d.skillHistory, 'skillHistory', 1, 100),
    strategyPick: parseStrategyPick(d.strategyPick),
    skill: parseSkillRules(d.skill),
  };
  const { size, minSize, maxSize, mix: m } = rules.round;
  if (size < minSize || size > maxSize) {
    throw new ContentError('rules.json round.size liegt außerhalb von minSize bis maxSize');
  }
  if (Math.abs(m.current + m.previous + m.next - 1) > 1e-9) {
    throw new ContentError('rules.json round.mix muss zusammen 1 ergeben');
  }
  if (rules.stars.two > rules.stars.three)
    throw new ContentError('rules.json stars.two > stars.three');
  return rules;
}

/** Gehege der Karte (ohne Zusatzbereiche wie „Wege im Zoo“). */
export function enclosures(content: { areas: readonly AreaConfig[] }): AreaConfig[] {
  return content.areas.filter((a) => !a.extra);
}

/** Alle Themen eines Bereichs: Gehege und Baustelle. */
export function areaFamilies(area: AreaConfig): string[] {
  return [...area.families, ...(area.site ?? [])];
}

export function parseAreas(data: unknown): AreaConfig[] {
  const d = obj(data, 'areas.json');
  if (!Array.isArray(d.areas) || d.areas.length === 0)
    throw new ContentError('areas.json: Liste „areas“ fehlt');
  const areas = d.areas.map((a, i) => {
    const o = obj(a, `areas.json areas[${i}]`);
    if (o.families !== undefined && !Array.isArray(o.families)) {
      throw new ContentError(`areas.json areas[${i}].families: Liste erwartet`);
    }
    const families = ((o.families as unknown[] | undefined) ?? []).map((f, k) =>
      str(f, `areas[${i}].families[${k}]`),
    );
    const area: AreaConfig = {
      id: str(o.id, `areas[${i}].id`),
      animal: str(o.animal, `areas[${i}].animal`),
      families,
    };
    if (o.requires !== undefined) area.requires = str(o.requires, `areas[${i}].requires`);
    if (o.extra !== undefined) {
      if (typeof o.extra !== 'boolean')
        throw new ContentError(`areas.json areas[${i}].extra: ja/nein erwartet`);
      area.extra = o.extra;
    }
    if (o.free !== undefined) {
      if (o.free !== 'pattern')
        throw new ContentError(`areas.json areas[${i}].free: 'pattern' erwartet`);
      area.free = o.free;
    }
    if (o.backdrop !== undefined) area.backdrop = str(o.backdrop, `areas[${i}].backdrop`);
    if (o.site !== undefined) {
      if (!Array.isArray(o.site))
        throw new ContentError(`areas.json areas[${i}].site: Liste erwartet`);
      area.site = o.site.map((f, k) => str(f, `areas[${i}].site[${k}]`));
    }
    return area;
  });
  const ids = areas.map((a) => a.id);
  if (new Set(ids).size !== ids.length) throw new ContentError('areas.json: doppelte Bereichs-IDs');
  for (const a of areas) {
    if (a.requires && !ids.includes(a.requires)) {
      throw new ContentError(`areas.json: ${a.id} verweist auf unbekannten Bereich ${a.requires}`);
    }
  }
  return areas;
}

function parseLevel(v: unknown, where: string): LevelParams {
  const o = obj(v, where);
  for (const [k, value] of Object.entries(o)) {
    const ok =
      typeof value === 'string' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      (Array.isArray(value) && value.every((n) => typeof n === 'number'));
    if (!ok) throw new ContentError(`${where}.${k}: Zahl, Zahlenliste oder Text erwartet`);
  }
  return o as LevelParams;
}

export function parseFamilies(data: unknown, maxLevel: number): Record<string, FamilyConfig> {
  const d = obj(data, 'families.json');
  const families = obj(d.families, 'families.json families');
  const out: Record<string, FamilyConfig> = {};
  for (const [id, f] of Object.entries(families)) {
    const o = obj(f, `families.json ${id}`);
    const kinds = obj(o.kinds, `${id}.kinds`);
    for (const [k, v] of Object.entries(kinds)) frac(v, `${id}.kinds.${k}`);
    const levels = obj(o.levels, `${id}.levels`);
    for (let level = 1; level <= maxLevel; level++) {
      if (!(String(level) in levels))
        throw new ContentError(`families.json ${id}: Stufe ${level} fehlt`);
    }
    out[id] = {
      title: str(o.title, `${id}.title`),
      kinds: kinds as Record<string, number>,
      levels: Object.fromEntries(
        Object.entries(levels).map(([l, p]) => [l, parseLevel(p, `${id}.levels.${l}`)]),
      ),
    };
  }
  return out;
}

function point(v: unknown, where: string) {
  const o = obj(v, where);
  return { x: int(o.x, `${where}.x`, 0, 1024), y: int(o.y, `${where}.y`, 0, 768) };
}

export function parseAnimals(data: unknown): Record<string, AnimalConfig> {
  const d = obj(data, 'animals.json');
  const animals = obj(d.animals, 'animals.json animals');
  return Object.fromEntries(
    Object.entries(animals).map(([id, a]) => {
      const o = obj(a, `animals.json ${id}`);
      return [
        id,
        {
          prefix: str(o.prefix, `${id}.prefix`),
          icon: str(o.icon, `${id}.icon`),
          taskSpot: point(o.taskSpot, `${id}.taskSpot`),
          areaSpot: point(o.areaSpot, `${id}.areaSpot`),
          babyPrice: int(o.babyPrice, `${id}.babyPrice`, 0, 1000),
        },
      ];
    }),
  );
}

export function parsePraise(data: unknown): Praise {
  const d = obj(data, 'praise.de.json');
  return {
    firstTry: strings(d.firstTry, 'praise firstTry'),
    withHelp: strings(d.withHelp, 'praise withHelp'),
  };
}

export function parseLegal(data: unknown): Legal {
  const d = obj(data, 'legal.json');
  const imprint = obj(d.imprint, 'legal.json imprint');
  return {
    imprint: {
      provider: str(imprint.provider, 'imprint.provider', true),
      street: str(imprint.street, 'imprint.street', true),
      city: str(imprint.city, 'imprint.city', true),
      email: str(imprint.email, 'imprint.email', true),
    },
    privacy: strings(d.privacy, 'legal.json privacy'),
  };
}

const STORY_OPS: readonly StoryOp[] = ['add', 'sub', 'mult', 'share', 'measure'];

export function parseStories(data: unknown): StoryTemplate[] {
  const d = obj(data, 'stories.json');
  if (!Array.isArray(d.stories)) throw new ContentError('stories.json: Liste „stories“ fehlt');
  const stories = d.stories.map((s, i) => {
    const o = obj(s, `stories.json stories[${i}]`);
    const op = str(o.op, `stories[${i}].op`) as StoryOp;
    if (!STORY_OPS.includes(op))
      throw new ContentError(`stories[${i}].op: unbekannte Rechenart ${op}`);
    return {
      id: str(o.id, `stories[${i}].id`),
      op,
      icon: str(o.icon, `stories[${i}].icon`, true),
      family: str(o.family, `stories[${i}].family`),
    };
  });
  const ids = stories.map((s) => s.id);
  if (new Set(ids).size !== ids.length) throw new ContentError('stories.json: doppelte IDs');
  return stories;
}

export function parseSituations(data: unknown): SituationTemplate[] {
  const d = obj(data, 'situations.json');
  if (!Array.isArray(d.situations)) {
    throw new ContentError('situations.json: Liste „situations“ fehlt');
  }
  const list = d.situations.map((s, i) => {
    const where = `situations[${i}]`;
    const o = obj(s, `situations.json ${where}`);
    if (!Array.isArray(o.levels) || o.levels.length === 0) {
      throw new ContentError(`${where}.levels: Liste von Stufen erwartet`);
    }
    const params = Object.fromEntries(
      Object.entries(obj(o.params ?? {}, `${where}.params`)).map(([k, v]) => {
        if (!Array.isArray(v) || v.length !== 2) {
          throw new ContentError(`${where}.params.${k}: [von, bis] erwartet`);
        }
        const from = int(v[0], `${where}.params.${k}[0]`);
        const to = int(v[1], `${where}.params.${k}[1]`, from);
        return [k, [from, to] as const];
      }),
    );
    const template: SituationTemplate = {
      id: str(o.id, `${where}.id`),
      family: str(o.family, `${where}.family`),
      levels: o.levels.map((l, j) => int(l, `${where}.levels[${j}]`, 1, 3)),
      params,
    };
    return o.answer === undefined
      ? template
      : { ...template, answer: str(o.answer, `${where}.answer`) };
  });
  const ids = list.map((s) => s.id);
  if (new Set(ids).size !== ids.length) throw new ContentError('situations.json: doppelte IDs');
  return list;
}

export function parseDecor(data: unknown): DecorConfig[] {
  const d = obj(data, 'decor.json');
  if (!Array.isArray(d.decor)) throw new ContentError('decor.json: Liste „decor“ fehlt');
  const list = d.decor.map((v, i) => {
    const o = obj(v, `decor[${i}]`);
    return {
      id: str(o.id, `decor[${i}].id`),
      price: int(o.price, `decor[${i}].price`, 1, 100),
      x: int(o.x, `decor[${i}].x`, 0, 1024),
      y: int(o.y, `decor[${i}].y`, 0, 768),
      size: int(o.size, `decor[${i}].size`, 32, 256),
    };
  });
  if (new Set(list.map((x) => x.id)).size !== list.length) {
    throw new ContentError('decor.json: doppelte IDs');
  }
  return list;
}

const SIMPLE_CONDITIONS = [
  'rounds',
  'streak',
  'roundStars',
  'totalStars',
  'level',
  'areasDone',
  'withHelp',
  'babies',
] as const;

function parseCondition(v: unknown, where: string): AchievementCondition {
  const o = obj(v, where);
  const type = str(o.type, `${where}.type`);
  if (type === 'familyBest') {
    return {
      type,
      families: strings(o.families, `${where}.families`),
      level: int(o.level, `${where}.level`, 1, 3),
      stars: int(o.stars, `${where}.stars`, 1, 3),
    };
  }
  if (!(SIMPLE_CONDITIONS as readonly string[]).includes(type)) {
    throw new ContentError(`${where}.type: unbekannte Bedingung ${type}`);
  }
  return { type: type as (typeof SIMPLE_CONDITIONS)[number], min: int(o.min, `${where}.min`, 1) };
}

export function parseAchievements(data: unknown): Achievement[] {
  const d = obj(data, 'achievements.json');
  if (!Array.isArray(d.achievements)) {
    throw new ContentError('achievements.json: Liste „achievements“ fehlt');
  }
  const list = d.achievements.map((v, i) => {
    const o = obj(v, `achievements[${i}]`);
    return {
      id: str(o.id, `achievements[${i}].id`),
      condition: parseCondition(o.condition, `achievements[${i}].condition`),
    };
  });
  if (new Set(list.map((x) => x.id)).size !== list.length) {
    throw new ContentError('achievements.json: doppelte IDs');
  }
  return list;
}

export type RawContent = {
  rules: unknown;
  areas: unknown;
  families: unknown;
  animals: unknown;
  praise: unknown;
  legal: unknown;
  stories: unknown;
  situations: unknown;
  decor: unknown;
  achievements: unknown;
};

/**
 * Prüft alle Dateien zusammen, auch die Verweise untereinander: jeder Bereich hat
 * ein Tier, jede genannte Familie existiert und hat einen Generator.
 */
export function parseContent(raw: RawContent, generatorIds: readonly string[]): GameContent {
  const rules = parseRules(raw.rules);
  const content: GameContent = {
    rules,
    areas: parseAreas(raw.areas),
    families: parseFamilies(raw.families, rules.maxLevel),
    animals: parseAnimals(raw.animals),
    praise: parsePraise(raw.praise),
    legal: parseLegal(raw.legal),
    stories: parseStories(raw.stories),
    situations: parseSituations(raw.situations),
    decor: parseDecor(raw.decor),
    achievements: parseAchievements(raw.achievements),
  };
  for (const a of content.achievements) {
    if (a.condition.type !== 'familyBest') continue;
    for (const f of a.condition.families) {
      if (!content.families[f]) {
        throw new ContentError(`achievements.json: ${a.id} nennt unbekannte Familie ${f}`);
      }
    }
  }
  for (const s of content.situations) {
    if (!content.families[s.family]) {
      throw new ContentError(`situations.json: ${s.id} nennt unbekannte Familie ${s.family}`);
    }
  }
  for (const story of content.stories) {
    if (!content.families[story.family]) {
      throw new ContentError(`stories.json: ${story.id} nennt unbekannte Familie ${story.family}`);
    }
  }
  for (const area of content.areas) {
    if (!content.animals[area.animal]) {
      throw new ContentError(`areas.json: ${area.id} nennt unbekanntes Tier ${area.animal}`);
    }
    for (const family of [...area.families, ...(area.site ?? [])]) {
      if (!content.families[family]) {
        throw new ContentError(`areas.json: ${area.id} nennt unbekannte Familie ${family}`);
      }
      if (!generatorIds.includes(family)) {
        throw new ContentError(`Für die Familie ${family} gibt es keinen Generator`);
      }
    }
  }
  return content;
}

export function findArea(content: GameContent, id: string): AreaConfig | undefined {
  return content.areas.find((a) => a.id === id);
}

/** Parameter einer Familie für eine Stufe (Stufe 0 nutzt die Werte von Stufe 1). */
export function familyParams(content: GameContent, family: string, level: number) {
  const f = content.families[family];
  if (!f) throw new ContentError(`Unbekannte Familie ${family}`);
  const lvl = f.levels[String(Math.max(1, level))];
  if (!lvl) throw new ContentError(`Familie ${family}: Stufe ${level} fehlt`);
  const stories = content.stories.filter((s) => s.family === family);
  const situations = content.situations.filter((s) => s.family === family);
  return {
    kinds: f.kinds,
    level: lvl,
    ...(stories.length > 0 ? { stories } : {}),
    ...(situations.length > 0 ? { situations } : {}),
  };
}

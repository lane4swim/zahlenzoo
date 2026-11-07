import type { RoundSummary } from './round';

/** Schlüssel aller Szenen. */
export const SceneKey = {
  Boot: 'Boot',
  Menu: 'Menu',
  Map: 'Map',
  Area: 'Area',
  Task: 'Task',
  RoundEnd: 'RoundEnd',
  Parent: 'Parent',
  Settings: 'Settings',
} as const;

export type AreaSceneData = { areaId: string };
export type TaskSceneData = { areaId: string };
export type RoundEndSceneData = { areaId: string; summary: RoundSummary };

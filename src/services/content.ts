import { parseContent, type RawContent } from '../logic/content';
import { GENERATOR_IDS } from '../logic/generators';
import type { GameContent } from '../types/content';

/** Hält die geprüften Inhalte aus public/assets/data (geladen in der BootScene). */
export class ContentStore {
  private data?: GameContent;

  load(raw: RawContent): void {
    this.data = parseContent(raw, GENERATOR_IDS);
  }

  get(): GameContent {
    if (!this.data) throw new Error('Inhalte sind noch nicht geladen');
    return this.data;
  }
}

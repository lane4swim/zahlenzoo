import type { AnimalConfig } from '../types/content';

/** Texturschlüssel der Belohnungen (Bilder in public/assets/img/decor, badges, animals). */
export const decorTexture = (id: string) => `deko_${id}`;
export const badgeTexture = (id: string) => `abzeichen_${id}`;
export const babyTexture = (art: Pick<AnimalConfig, 'prefix'>) => `${art.prefix}_baby`;

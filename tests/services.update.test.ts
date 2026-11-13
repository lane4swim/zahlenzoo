import { describe, expect, it, vi } from 'vitest';
import { updates } from '../src/services/update';

describe('Neue Version und Offline-Bereitschaft', () => {
  it('meldet eine neue Version erst, wenn der Service Worker sie ankündigt, und lädt sie nur auf Wunsch', async () => {
    expect(updates.available).toBe(false);
    const seen = vi.fn();
    const off = updates.subscribe(seen);
    const apply = vi.fn(async () => {});
    updates.setNeedRefresh(apply);
    expect(updates.available).toBe(true);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(apply).not.toHaveBeenCalled();
    await updates.apply();
    expect(apply).toHaveBeenCalledTimes(1);
    off();
    updates.setOfflineReady();
    expect(updates.offlineReady).toBe(true);
    expect(seen).toHaveBeenCalledTimes(1);
  });
});

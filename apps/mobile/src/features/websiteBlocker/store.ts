// apps/mobile/src/features/websiteBlocker/store.ts
// Zustand slice for website blocking (NSFW + custom blacklist).

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { WebsiteBlockerState } from '@aegis/schemas';
import { addWebsiteToBlacklist, removeWebsiteFromBlacklist, setNsfwFilter } from '@aegis/domain';
import type { Result, DomainError } from '@aegis/domain';
import { readWebsiteBlocker, writeWebsiteBlocker } from '../../core/storage/settingsRepo.js';
import { enforcementBus } from '../../core/enforcement/enforcementBus.js';

type WebsiteBlockerStore = {
  state: WebsiteBlockerState;
  hydrated: boolean;
  hydrate(trustedEpochMs: number): Promise<void>;
  toggleNsfw(enabled: boolean, locked: boolean): Promise<Result<void, DomainError>>;
  addHost(rawHost: string): Promise<Result<void, DomainError>>;
  removeHost(host: string, locked: boolean): Promise<Result<void, DomainError>>;
  setVpnActive(active: boolean): void;
};

const DEFAULT: WebsiteBlockerState = {
  nsfwFilterEnabled: false,
  customBlacklist: [],
  vpnActive: false,
};

async function persist(state: WebsiteBlockerState): Promise<Result<void, DomainError>> {
  const r = await writeWebsiteBlocker(state);
  if (!r.ok) return { ok: false, error: { code: 'E_INVALID_SCHEMA', message: r.error } };
  return { ok: true, value: undefined };
}

export const useWebsiteBlockerStore = create<WebsiteBlockerStore>()(
  immer((set, get) => ({
    state: DEFAULT,
    hydrated: false,

    async hydrate(trustedEpochMs) {
      const loaded = await readWebsiteBlocker(trustedEpochMs);
      set((s) => { s.state = loaded; s.hydrated = true; });
    },

    async toggleNsfw(enabled, locked) {
      const result = setNsfwFilter(get().state, enabled, locked);
      if (!result.ok) return result;
      set((s) => { s.state = result.value; });
      const r = await persist(result.value);
      if (r.ok) {
        enforcementBus.emit({
          type: 'RestrictionChanged',
          entityType: 'Website',
          entityId: 'nsfw',
          change: enabled ? 'Blocked' : 'Unblocked',
          trustedEpochMs: Date.now(),
        });
      }
      return r;
    },

    async addHost(rawHost) {
      const result = addWebsiteToBlacklist(get().state, rawHost);
      if (!result.ok) return result;
      set((s) => { s.state = result.value; });
      const r = await persist(result.value);
      if (r.ok) {
        enforcementBus.emit({
          type: 'RestrictionChanged',
          entityType: 'Website',
          entityId: rawHost.trim().toLowerCase(),
          change: 'Blocked',
          trustedEpochMs: Date.now(),
        });
      }
      return r;
    },

    async removeHost(host, locked) {
      const result = removeWebsiteFromBlacklist(get().state, host, locked);
      if (!result.ok) return result;
      set((s) => { s.state = result.value; });
      return persist(result.value);
    },

    setVpnActive(active) {
      set((s) => { s.state.vpnActive = active; });
    },
  })),
);

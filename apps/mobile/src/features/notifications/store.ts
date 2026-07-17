// apps/mobile/src/features/notifications/store.ts
// Zustand slice for notification silencing, history, and retention.

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { NotificationsState, NotificationRetention } from '@aegis/schemas';
import { setSilenced, setRetention, setHistoryFilter } from '@aegis/domain';
import type { Result, DomainError } from '@aegis/domain';
import { readNotifications, writeNotifications } from '../../core/storage/settingsRepo.js';

type NotificationsStore = {
  state: NotificationsState;
  hydrated: boolean;
  hydrate(trustedEpochMs: number): Promise<void>;
  silenceApp(appId: string, silenced: boolean): Promise<Result<void, DomainError>>;
  updateRetention(retention: NotificationRetention): Promise<Result<void, DomainError>>;
  updateHistoryFilter(filter: { from: string; to: string } | undefined): Promise<Result<void, DomainError>>;
};

async function persist(state: NotificationsState): Promise<Result<void, DomainError>> {
  const r = await writeNotifications(state);
  if (!r.ok) return { ok: false, error: { code: 'E_INVALID_SCHEMA', message: r.error } };
  return { ok: true, value: undefined };
}

export const useNotificationsStore = create<NotificationsStore>()(
  immer((set, get) => ({
    state: { silenced: {}, retention: 'P1M' },
    hydrated: false,

    async hydrate(trustedEpochMs) {
      const loaded = await readNotifications(trustedEpochMs);
      set((s) => { s.state = loaded; s.hydrated = true; });
    },

    async silenceApp(appId, silenced) {
      const result = setSilenced(get().state, appId, silenced);
      if (!result.ok) return result;
      set((s) => { s.state = result.value; });
      return persist(result.value);
    },

    async updateRetention(retention) {
      const result = setRetention(get().state, retention);
      if (!result.ok) return result;
      set((s) => { s.state = result.value; });
      return persist(result.value);
    },

    async updateHistoryFilter(filter) {
      const result = setHistoryFilter(get().state, filter);
      if (!result.ok) return result;
      set((s) => { s.state = result.value; });
      return persist(result.value);
    },
  })),
);

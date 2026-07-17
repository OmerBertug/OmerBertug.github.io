// apps/mobile/src/features/appBlocking/store.ts
// Zustand slice for app blocking, groups, and short-video config.

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppBlockingState, AppGroup, ShortVideoConfig, ShortVideoPlatform } from '@aegis/schemas';
import {
  setAppDailyLimit,
  setAppBlocked,
  setInternetBlocked,
  setShortVideoConfig,
  addAppGroup,
  removeAppGroup,
  recordShortVideoUsage,
  resetShortVideoUsage,
} from '@aegis/domain';
import type { Result, DomainError } from '@aegis/domain';
import { readAppBlocking, writeAppBlocking } from '../../core/storage/settingsRepo.js';
import { enforcementBus } from '../../core/enforcement/enforcementBus.js';

type AppBlockingStore = {
  state: AppBlockingState;
  hydrated: boolean;

  hydrate(trustedEpochMs: number): Promise<void>;
  setAppLimit(appId: string, limitMin: number, locked: boolean): Promise<Result<void, DomainError>>;
  blockApp(appId: string, blocked: boolean, locked: boolean): Promise<Result<void, DomainError>>;
  blockInternet(appId: string, blocked: boolean): Promise<Result<void, DomainError>>;
  updateShortVideoConfig(update: Partial<ShortVideoConfig>, locked: boolean): Promise<Result<void, DomainError>>;
  addGroup(group: AppGroup): Promise<Result<void, DomainError>>;
  removeGroup(groupId: string, locked: boolean): Promise<Result<void, DomainError>>;
  recordShortVideoUsage(platform: ShortVideoPlatform, minutes: number): void;
  resetDailyCounters(): void;
};

const DEFAULT_STATE: AppBlockingState = {
  apps: {},
  groups: [],
  shortVideo: {
    enabled: false,
    universalLimitMin: 30,
    checked: {
      INSTAGRAM_REELS: false,
      YOUTUBE_SHORTS: false,
      TIKTOK_EXPLORE: false,
      REDDIT_VIDEOS: false,
      SNAPCHAT_STORIES: false,
      FACEBOOK_REELS: false,
    },
  },
  todayUsageMin: {},
  shortVideoUsageToday: {
    INSTAGRAM_REELS: 0,
    YOUTUBE_SHORTS: 0,
    TIKTOK_EXPLORE: 0,
    REDDIT_VIDEOS: 0,
    SNAPCHAT_STORIES: 0,
    FACEBOOK_REELS: 0,
  },
};

async function persist(state: AppBlockingState): Promise<Result<void, DomainError>> {
  const r = await writeAppBlocking(state);
  if (!r.ok) return { ok: false, error: { code: 'E_INVALID_SCHEMA', message: r.error } };
  return { ok: true, value: undefined };
}

export const useAppBlockingStore = create<AppBlockingStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      state: DEFAULT_STATE,
      hydrated: false,

      async hydrate(trustedEpochMs) {
        const loaded = await readAppBlocking(trustedEpochMs);
        set((s) => { s.state = loaded; s.hydrated = true; });
      },

      async setAppLimit(appId, limitMin, locked) {
        const result = setAppDailyLimit(get().state, appId, limitMin, locked, { trustedEpochMs: Date.now() });
        if (!result.ok) return result;
        set((s) => { s.state = result.value; });
        const r = await persist(result.value);
        if (r.ok) {
          enforcementBus.emit({
            type: 'RestrictionChanged',
            entityType: 'App',
            entityId: appId,
            change: limitMin === 0 ? 'LimitRemoved' : 'LimitSet',
            trustedEpochMs: Date.now(),
          });
        }
        return r;
      },

      async blockApp(appId, blocked, locked) {
        const result = setAppBlocked(get().state, appId, blocked, locked, { trustedEpochMs: Date.now() });
        if (!result.ok) return result;
        set((s) => { s.state = result.value; });
        const r = await persist(result.value);
        if (r.ok) {
          enforcementBus.emit({
            type: 'RestrictionChanged',
            entityType: 'App',
            entityId: appId,
            change: blocked ? 'Blocked' : 'Unblocked',
            trustedEpochMs: Date.now(),
          });
        }
        return r;
      },

      async blockInternet(appId, blocked) {
        const result = setInternetBlocked(get().state, appId, blocked, { trustedEpochMs: Date.now() });
        if (!result.ok) return result;
        set((s) => { s.state = result.value; });
        return persist(result.value);
      },

      async updateShortVideoConfig(update, locked) {
        const result = setShortVideoConfig(get().state, update, locked, { trustedEpochMs: Date.now() });
        if (!result.ok) return result;
        set((s) => { s.state = result.value; });
        return persist(result.value);
      },

      async addGroup(group) {
        const result = addAppGroup(get().state, group, { trustedEpochMs: Date.now() });
        if (!result.ok) return result;
        set((s) => { s.state = result.value; });
        return persist(result.value);
      },

      async removeGroup(groupId, locked) {
        const result = removeAppGroup(get().state, groupId, locked, { trustedEpochMs: Date.now() });
        if (!result.ok) return result;
        set((s) => { s.state = result.value; });
        return persist(result.value);
      },

      recordShortVideoUsage(platform, minutes) {
        const newState = recordShortVideoUsage(get().state, platform, minutes);
        set((s) => { s.state = newState; });
        // Fire-and-forget persist for usage counters
        void writeAppBlocking(newState);
      },

      resetDailyCounters() {
        // T13: called at trusted midnight, not device midnight
        const newState = resetShortVideoUsage(get().state);
        set((s) => {
          s.state = newState;
          s.state.todayUsageMin = {};
        });
        void writeAppBlocking(newState);
      },
    })),
  ),
);

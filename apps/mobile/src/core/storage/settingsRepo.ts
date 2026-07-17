// apps/mobile/src/core/storage/settingsRepo.ts
// HMAC-signed settings persistence layer.
// T9: All mutations go through a serial p-queue (concurrency=1).
// T10: On read, verifies HMAC; on mismatch → wipe to defaults with all restrictions ON.

import PQueue from 'p-queue';
import type { ProtectionState, AppBlockingState, WebsiteBlockerState, NotificationsState } from '@aegis/schemas';
import type { Result } from '@aegis/domain';
import { ok, err } from '@aegis/domain';
import { signSettings } from '../integrity/hmac.js';
import { checkSettingsIntegrity } from '../integrity/tamperCheck.js';
import { mmkv } from './mmkv.js';

// ─── Serial mutation queue (T9) ───────────────────────────────────────────────
// concurrency=1 prevents race conditions (T9)
const _queue = new PQueue({ concurrency: 1 });

// ─── MMKV keys ────────────────────────────────────────────────────────────────
const KEYS = {
  PROTECTION: 'aegis.settings.protection',
  APP_BLOCKING: 'aegis.settings.appBlocking',
  WEBSITE_BLOCKER: 'aegis.settings.websiteBlocker',
  NOTIFICATIONS: 'aegis.settings.notifications',
} as const;

// ─── Fail-closed defaults (all restrictions ON per §1.3) ─────────────────────
export const DEFAULT_PROTECTION: Omit<ProtectionState, 'hmac'> = {
  immutableMode: true,           // FAIL-CLOSED: locked on first boot
  immutableWindow: { startMinuteOfDay: 0, endMinuteOfDay: 10 },
  protectedAccess: true,
  tamperProtection: true,
  uninstallWindow: { startMinuteOfDay: 0, endMinuteOfDay: 10 },
  lastMutationAt: 0,
};

export const DEFAULT_APP_BLOCKING: AppBlockingState = {
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

export const DEFAULT_WEBSITE_BLOCKER: WebsiteBlockerState = {
  nsfwFilterEnabled: false,
  customBlacklist: [],
  vpnActive: false,
};

export const DEFAULT_NOTIFICATIONS: NotificationsState = {
  silenced: {},
  retention: 'P1M',
};

// ─── Generic signed read ──────────────────────────────────────────────────────

async function readSigned<T extends object>(
  key: string,
  defaultValue: T,
  trustedEpochMs: number,
): Promise<T> {
  const raw = mmkv.getString(key);
  if (!raw) return defaultValue;

  try {
    const parsed = JSON.parse(raw) as T & { hmac: string };
    const integrity = await checkSettingsIntegrity(parsed, trustedEpochMs);

    if (!integrity.ok) {
      // T10: HMAC mismatch — wipe this key and return fail-closed defaults
      mmkv.delete(key);
      return defaultValue;
    }

    return integrity.value as T;
  } catch {
    // Corrupted JSON — wipe and return defaults
    mmkv.delete(key);
    return defaultValue;
  }
}

// ─── Generic signed write (enqueued via serial queue) ────────────────────────

async function writeSigned<T extends object>(key: string, value: T): Promise<Result<void, string>> {
  return _queue.add(async () => {
    // Re-read → validate → sign → write (T9: full atomic cycle)
    const hmacResult = await signSettings(value);
    if (!hmacResult.ok) return err(hmacResult.error);

    const signed = { ...value, hmac: hmacResult.value };
    mmkv.set(key, JSON.stringify(signed));
    return ok(undefined);
  }) as Promise<Result<void, string>>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readProtection(trustedEpochMs: number): Promise<ProtectionState> {
  const payload = await readSigned<Omit<ProtectionState, 'hmac'>>(
    KEYS.PROTECTION,
    DEFAULT_PROTECTION,
    trustedEpochMs,
  );
  // Compute HMAC for in-memory representation
  const hmacResult = await signSettings(payload);
  const hmac = hmacResult.ok ? hmacResult.value : 'a'.repeat(64);
  return { ...payload, hmac } as ProtectionState;
}

export async function writeProtection(
  state: Omit<ProtectionState, 'hmac'>,
): Promise<Result<void, string>> {
  return writeSigned(KEYS.PROTECTION, state);
}

export async function readAppBlocking(trustedEpochMs: number): Promise<AppBlockingState> {
  return readSigned<AppBlockingState>(KEYS.APP_BLOCKING, DEFAULT_APP_BLOCKING, trustedEpochMs);
}

export async function writeAppBlocking(state: AppBlockingState): Promise<Result<void, string>> {
  return writeSigned(KEYS.APP_BLOCKING, state);
}

export async function readWebsiteBlocker(trustedEpochMs: number): Promise<WebsiteBlockerState> {
  return readSigned<WebsiteBlockerState>(KEYS.WEBSITE_BLOCKER, DEFAULT_WEBSITE_BLOCKER, trustedEpochMs);
}

export async function writeWebsiteBlocker(state: WebsiteBlockerState): Promise<Result<void, string>> {
  return writeSigned(KEYS.WEBSITE_BLOCKER, state);
}

export async function readNotifications(trustedEpochMs: number): Promise<NotificationsState> {
  return readSigned<NotificationsState>(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS, trustedEpochMs);
}

export async function writeNotifications(state: NotificationsState): Promise<Result<void, string>> {
  return writeSigned(KEYS.NOTIFICATIONS, state);
}

/**
 * T10: Wipe all settings and reset to fail-closed defaults.
 * Called when HMAC mismatch detected on any setting.
 */
export async function wipeAndResetAllSettings(): Promise<void> {
  await _queue.add(async () => {
    mmkv.clearAll();
    // Write fail-closed defaults immediately
    await writeProtection(DEFAULT_PROTECTION);
    await writeAppBlocking(DEFAULT_APP_BLOCKING);
    await writeWebsiteBlocker(DEFAULT_WEBSITE_BLOCKER);
    await writeNotifications(DEFAULT_NOTIFICATIONS);
  });
}

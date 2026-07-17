// apps/mobile/src/core/enforcement/quotaEngine.ts
// Checks current usage against limits and emits enforcement events.
// Runs as a headless background task (WorkManager on Android, DeviceActivity on iOS).
// SIMULATION: Runs on a JS interval in Expo Go / web preview.

import type { AppBlockingState } from '@aegis/schemas';
import {
  appOverLimit,
  groupOverQuota,
  groupOutsideSchedule,
  shortVideoBlocked,
  epochToMonotonicDayIndex,
  epochToDayOfWeek,
} from '@aegis/domain';
import { enforcementBus } from './enforcementBus.js';
import type { TrustedTime } from '../time/trustedNow.js';

// ─── Quota evaluation ─────────────────────────────────────────────────────────

/**
 * Evaluate all active quotas against current usage.
 * Emits domain events for any limit reached or schedule violation.
 * Called by the background task every 15 minutes (Android WorkManager)
 * or triggered by DeviceActivityMonitor events (iOS).
 */
export function evaluateQuotas(
  state: AppBlockingState,
  trusted: TrustedTime,
  ianaTimezone: string,
): void {
  // T7: if confidence is low, emit nothing — fail-closed means existing locks stay active
  if (trusted.confidence === 'low') return;

  const dayOfWeek = epochToDayOfWeek(trusted.epochMs, ianaTimezone);

  // ─── Per-app limits ────────────────────────────────────────────────────────
  for (const [appId, app] of Object.entries(state.apps)) {
    const todayMinutes = state.todayUsageMin[appId] ?? 0;
    if (appOverLimit(app, todayMinutes)) {
      enforcementBus.emit({
        type: 'AppLimitReached',
        appId,
        usedMinutes: todayMinutes,
        limitMinutes: app.dailyLimitMin,
        trustedEpochMs: trusted.epochMs,
      });
    }
  }

  // ─── Group quotas & schedules ──────────────────────────────────────────────
  for (const group of state.groups) {
    if (!group.enabled) continue;

    // Sum usage for all apps in group
    const groupMinutes = group.appIds.reduce((acc, id) => acc + (state.todayUsageMin[id] ?? 0), 0);

    if (groupOverQuota(group, groupMinutes)) {
      enforcementBus.emit({
        type: 'GroupQuotaReached',
        groupId: group.id,
        usedMinutes: groupMinutes,
        quotaMinutes: group.dailyQuotaMin,
        trustedEpochMs: trusted.epochMs,
      });
    }

    // Schedule check
    const minuteOfDay = Math.floor((trusted.epochMs % 86_400_000) / 60_000);
    if (groupOutsideSchedule(group, minuteOfDay, dayOfWeek)) {
      enforcementBus.emit({
        type: 'ScheduleWindowClosed',
        groupId: group.id,
        trustedEpochMs: trusted.epochMs,
      });
    }
  }

  // ─── Short video collective limit ──────────────────────────────────────────
  if (state.shortVideo.enabled) {
    const blockedPlatforms = shortVideoBlocked(state.shortVideo, state.shortVideoUsageToday);
    if (blockedPlatforms.size > 0) {
      const totalUsed = Object.values(state.shortVideoUsageToday).reduce((a, b) => a + b, 0);
      enforcementBus.emit({
        type: 'ShortVideoCollectiveReached',
        blockedPlatforms: Array.from(blockedPlatforms) as readonly string[] as readonly import('@aegis/schemas').ShortVideoPlatform[],
        totalUsedMinutes: totalUsed,
        limitMinutes: state.shortVideo.universalLimitMin,
        trustedEpochMs: trusted.epochMs,
      });
    }
  }
}

// ─── Midnight reset scheduler (T13) ──────────────────────────────────────────

/**
 * T13: Counters reset at TRUSTED local midnight, not device midnight.
 * Returns the epoch ms of the next trusted midnight in the given timezone.
 */
export function nextTrustedMidnight(
  trustedEpochMs: number,
  ianaTimezone: string,
): number {
  // Get today's monotonic day index
  const todayIndex = epochToMonotonicDayIndex(trustedEpochMs);
  // Next midnight = start of next day in UTC (monotonic)
  const nextDayStartUtcMs = (todayIndex + 1) * 86_400_000;

  // Adjust for timezone offset so reset happens at local midnight
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(nextDayStartUtcMs));
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const s = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10);

  // If nextDayStartUtcMs is already at local midnight (offset 0), return it.
  // Otherwise adjust by removing the local time offset.
  const offsetMs = (h * 3600 + m * 60 + s) * 1000;
  return nextDayStartUtcMs - offsetMs;
}

// ─── SIMULATION: JS-based background polling ──────────────────────────────────
// SIMULATION: In Expo Go, we poll every 15 min via JS interval.
// TODO(native): On Android, use WorkManager PeriodicWorkRequest (15min interval).
// TODO(native): On iOS, use DeviceActivityMonitor extension events.

let _pollingHandle: ReturnType<typeof setInterval> | null = null;
type QuotaStateProvider = () => AppBlockingState;
type TrustedTimeProvider = () => Promise<TrustedTime>;

export function startQuotaPolling(
  getState: QuotaStateProvider,
  getTrustedTime: TrustedTimeProvider,
  ianaTimezone: string,
): void {
  if (_pollingHandle !== null) return;

  const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  _pollingHandle = setInterval(() => {
    void (async () => {
      const trusted = await getTrustedTime();
      evaluateQuotas(getState(), trusted, ianaTimezone);
    })();
  }, POLL_INTERVAL_MS);
}

export function stopQuotaPolling(): void {
  if (_pollingHandle !== null) {
    clearInterval(_pollingHandle);
    _pollingHandle = null;
  }
}

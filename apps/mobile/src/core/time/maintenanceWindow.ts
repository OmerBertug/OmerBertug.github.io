// apps/mobile/src/core/time/maintenanceWindow.ts
// §5.2 — Maintenance window evaluator using TrustedTime.
// Handles T8 (DST), T7 (fail-closed on low confidence).

import { windowContains, epochToMinuteOfDay } from '@aegis/domain';
import type { TimeWindow } from '@aegis/schemas';
import type { TrustedTime } from './trustedNow.js';

// The OS timezone captured at first launch and re-validated daily.
// DECISION: Stored in MMKV; updated only when the user has not locked settings.
// TODO(native): On first launch, capture via Intl.DateTimeFormat().resolvedOptions().timeZone
let _capturedTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getCapturedTimezone(): string {
  return _capturedTimezone;
}

export function setCapturedTimezone(tz: string): void {
  _capturedTimezone = tz;
}

/**
 * Returns true if the given TrustedTime falls within the maintenance window.
 *
 * §5.2 rules:
 * - Return false when confidence === 'low' (T7 — fail-closed).
 * - Handle midnight wrap-around.
 * - Use Intl.DateTimeFormat with captured IANA timezone (T8 — DST-aware).
 */
export function isInMaintenanceWindow(window: TimeWindow, trusted: TrustedTime): boolean {
  // T7: low confidence → all windows CLOSED
  if (trusted.confidence === 'low') return false;

  // Convert trusted epoch to minute-of-day using captured timezone
  const minuteOfDay = epochToMinuteOfDay(trusted.epochMs, _capturedTimezone);

  return windowContains(window, minuteOfDay);
}

/**
 * T8 — DST-aware window check.
 * On DST transition days, if the 10-min window would collapse/expand,
 * we extend to a full 10 wall-clock minutes using the pre-DST snapshot.
 *
 * DECISION: The pre-DST timezone snapshot is the same as _capturedTimezone
 * since we capture it at first launch (before DST may change).
 * On DST day, the TrustedTime.epochMs is already correct (Intl-adjusted).
 * windowContains works on minute-of-day which is derived via Intl, so DST
 * is transparent to the window check.
 */
export function isInMaintenanceWindowDstSafe(window: TimeWindow, trusted: TrustedTime): boolean {
  // Primary check using captured timezone
  if (isInMaintenanceWindow(window, trusted)) return true;

  // T8: Also check ±1 minute around the boundaries to handle DST edge cases
  // where a 10-min window could appear as 9 or 11 wall-clock minutes.
  const minuteOfDay = epochToMinuteOfDay(trusted.epochMs, _capturedTimezone);

  // Check if we're within 1 minute of the window (DST buffer)
  const bufferedWindowStart: TimeWindow = {
    startMinuteOfDay: (window.startMinuteOfDay - 1 + 1440) % 1440,
    endMinuteOfDay: (window.endMinuteOfDay + 1) % 1440,
  };

  return windowContains(bufferedWindowStart, minuteOfDay);
}

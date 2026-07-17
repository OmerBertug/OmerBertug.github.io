// packages/domain/src/invariants.ts
// Pure functions encoding all business invariants.
// NO side effects — safe to test exhaustively.

import type { TimeWindow } from '@aegis/schemas';
import type { ProtectionState, ShortVideoConfig, PlatformUsage, AppEntry, AppGroup } from '@aegis/schemas';
import type { DayOfWeek } from '@aegis/schemas';

// ─── Time utilities ───────────────────────────────────────────────────────────

/**
 * Convert an epoch-ms timestamp to minute-of-day in a given IANA timezone.
 * DECISION: We use Intl.DateTimeFormat (not Date methods) to be DST-aware.
 */
export function epochToMinuteOfDay(epochMs: number, ianaTimezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(epochMs));
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  // Handle hour=24 (midnight in some implementations)
  return (hour % 24) * 60 + minute;
}

/**
 * Determine the DayOfWeek for a given epoch in a timezone.
 */
export function epochToDayOfWeek(epochMs: number, ianaTimezone: string): DayOfWeek {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    weekday: 'short',
  });
  const weekday = fmt.format(new Date(epochMs));
  const map: Record<string, DayOfWeek> = {
    Mon: 'MON',
    Tue: 'TUE',
    Wed: 'WED',
    Thu: 'THU',
    Fri: 'FRI',
    Sat: 'SAT',
    Sun: 'SUN',
  };
  // Default to MON on unknown — fail-closed
  return map[weekday] ?? 'MON';
}

// ─── Window containment ───────────────────────────────────────────────────────

/**
 * Returns true if minuteOfDay falls within the TimeWindow.
 * Handles wrap-around midnight (e.g., start=1430, end=0 → 10-min window crossing midnight).
 *
 * Edge cases:
 * - Exactly on start boundary → IN window
 * - Exactly on end boundary → IN window (inclusive)
 * - T8 (DST): window is stored as minute-of-day; caller computes minuteOfDay
 *   via epochToMinuteOfDay which uses Intl (DST-aware).
 */
export function windowContains(window: TimeWindow, minuteOfDay: number): boolean {
  const { startMinuteOfDay: start, endMinuteOfDay: end } = window;

  if (start <= end) {
    // No midnight wrap
    return minuteOfDay >= start && minuteOfDay <= end;
  } else {
    // Wraps midnight
    return minuteOfDay >= start || minuteOfDay <= end;
  }
}

// ─── Protection invariants ────────────────────────────────────────────────────

/**
 * T1 guard: returns true iff the protection state CAN be mutated right now.
 *
 * Allowed when:
 *   (a) immutableMode is OFF, OR
 *   (b) immutableMode is ON and `now` falls inside the immutableWindow
 *
 * NEVER allowed when confidence is low (T7 — fail-closed).
 * confidence must be passed as a parameter to keep this function pure.
 */
export function canMutateProtection(
  state: Pick<ProtectionState, 'immutableMode' | 'immutableWindow'>,
  minuteOfDay: number,
  confidence: 'high' | 'medium' | 'low',
): boolean {
  // T7: low confidence → fail-closed (all locks active)
  if (confidence === 'low') return false;

  if (!state.immutableMode) return true;
  return windowContains(state.immutableWindow, minuteOfDay);
}

/**
 * Analogous to canMutateProtection but for the tamper/uninstall window.
 * T1/T7 rules apply identically.
 */
export function canDisableTamper(
  state: Pick<ProtectionState, 'tamperProtection' | 'uninstallWindow'>,
  minuteOfDay: number,
  confidence: 'high' | 'medium' | 'low',
): boolean {
  if (confidence === 'low') return false;
  if (!state.tamperProtection) return true;
  return windowContains(state.uninstallWindow, minuteOfDay);
}

// ─── Short-video invariants ───────────────────────────────────────────────────

/**
 * Given a ShortVideoConfig and today's usage per platform, returns the Set
 * of platforms that are currently blocked.
 *
 * Blocking logic (§4 spec):
 *   A checked platform P is blocked when EITHER:
 *     (a) P's own usage >= universalLimitMin, OR
 *     (b) Sum of ALL checked platforms' usage >= universalLimitMin
 *   Unchecked platforms are never blocked.
 *
 * DECISION: Uses >= semantics (block at limit, not over) as the safer interpretation.
 */
export function shortVideoBlocked(
  cfg: ShortVideoConfig,
  usage: PlatformUsage,
): Set<string> {
  if (!cfg.enabled) return new Set();

  // Compute sum of checked-platform usage
  let checkedSum = 0;
  for (const [platform, isChecked] of Object.entries(cfg.checked)) {
    if (isChecked) {
      checkedSum += usage[platform as keyof PlatformUsage] ?? 0;
    }
  }

  const collectiveLimitReached = checkedSum >= cfg.universalLimitMin;
  const blocked = new Set<string>();

  for (const [platform, isChecked] of Object.entries(cfg.checked)) {
    if (!isChecked) continue;
    const ownUsage = usage[platform as keyof PlatformUsage] ?? 0;
    if (ownUsage >= cfg.universalLimitMin || collectiveLimitReached) {
      blocked.add(platform);
    }
  }

  return blocked;
}

// ─── App limit invariants ─────────────────────────────────────────────────────

/**
 * Returns true if the app has exceeded its daily limit.
 * dailyLimitMin=0 means no limit.
 */
export function appOverLimit(app: AppEntry, todayMinutes: number): boolean {
  if (app.dailyLimitMin === 0) return false;
  return todayMinutes >= app.dailyLimitMin;
}

/**
 * Returns true if the group's collective usage has exceeded its daily quota.
 * dailyQuotaMin=0 means no quota.
 */
export function groupOverQuota(group: AppGroup, todayMinutes: number): boolean {
  if (group.dailyQuotaMin === 0) return false;
  return todayMinutes >= group.dailyQuotaMin;
}

/**
 * Returns true if the current time falls OUTSIDE the group's allowed schedule
 * for the current day.
 *
 * If no schedule is defined → always in-schedule (unrestricted).
 * If schedule exists for the day but allowedWindows is empty → blocked all day.
 * If schedule has windows → blocked unless current minute falls in one of them.
 */
export function groupOutsideSchedule(
  group: AppGroup,
  minuteOfDay: number,
  dayOfWeek: DayOfWeek,
): boolean {
  if (!group.schedule || group.schedule.length === 0) return false;

  const daySchedule = group.schedule.find((s) => s.day === dayOfWeek);
  if (!daySchedule) return false; // No restriction for this day
  if (!daySchedule.allowedWindows || daySchedule.allowedWindows.length === 0) return true; // Completely blocked

  // Check if current time falls in any allowed window
  for (const window of daySchedule.allowedWindows) {
    const pseudoWindow: TimeWindow = {
      startMinuteOfDay: window.startMinuteOfDay,
      endMinuteOfDay: window.endMinuteOfDay,
    };
    if (windowContains(pseudoWindow, minuteOfDay)) return false;
  }

  return true; // Outside all windows
}

// ─── Monotonic day index ──────────────────────────────────────────────────────

/**
 * T2 guard: compute a monotonic day-index from a trusted anchor.
 * Never uses wall clock directly. Uses NTP anchor + uptime delta.
 *
 * dayIndex = floor(trustedEpochMs / MS_PER_DAY)
 *
 * This ensures usage rows keyed by dayIndex cannot be "erased" by rolling
 * the clock back, because the anchor is persisted and monotonically increasing.
 */
export const MS_PER_DAY = 86_400_000;

export function epochToMonotonicDayIndex(trustedEpochMs: number): number {
  return Math.floor(trustedEpochMs / MS_PER_DAY);
}

/**
 * Given a monotonic day index, returns an ISO date string YYYY-MM-DD in UTC.
 * NOTE: stored as UTC date; display uses device timezone via Intl.
 */
export function monotonicDayIndexToIsoDate(dayIndex: number): string {
  const d = new Date(dayIndex * MS_PER_DAY);
  return d.toISOString().slice(0, 10);
}

// ─── T15 widening-lock guard ──────────────────────────────────────────────────

/**
 * Returns true if the proposed new limit is WIDER (more permissive) than the
 * existing one while the lock is active.
 *
 * A mutation is "widening" when:
 *   - Enabling an app that was blocked
 *   - Increasing a dailyLimitMin (0 = no limit → always wider if currently limited)
 *   - Decreasing universalLimitMin for short video
 *   - Removing from blacklist while NSFW is on
 *
 * Callers should pass the locked status from canMutateProtection; this function
 * purely checks direction of change.
 */
export function isWideningAppLimit(
  currentLimitMin: number,
  proposedLimitMin: number,
): boolean {
  if (currentLimitMin === 0) return false; // No limit now → can't widen
  if (proposedLimitMin === 0) return true; // Removing limit = widening
  return proposedLimitMin > currentLimitMin;
}

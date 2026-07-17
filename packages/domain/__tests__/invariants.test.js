// packages/domain/__tests__/invariants.test.ts
// 100% coverage of all domain invariants including all threat-model edge cases.
import { describe, expect, it } from 'vitest';
import { windowContains, canMutateProtection, canDisableTamper, shortVideoBlocked, appOverLimit, groupOverQuota, groupOutsideSchedule, epochToMinuteOfDay, epochToMonotonicDayIndex, monotonicDayIndexToIsoDate, isWideningAppLimit, MS_PER_DAY, } from '../src/invariants.js';
// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeWindow = (start, end) => ({
    startMinuteOfDay: start,
    endMinuteOfDay: end,
});
const baseProtection = {
    immutableMode: false,
    immutableWindow: makeWindow(1430, 0), // 23:50–00:00 (10 min wrap)
    protectedAccess: false,
    tamperProtection: false,
    uninstallWindow: makeWindow(1430, 0),
    lastMutationAt: 1000000,
    hmac: 'a'.repeat(64),
};
// ─── windowContains ───────────────────────────────────────────────────────────
describe('windowContains — no midnight wrap', () => {
    const w = makeWindow(600, 610); // 10:00–10:10
    it('returns true for start boundary', () => {
        expect(windowContains(w, 600)).toBe(true);
    });
    it('returns true for end boundary (inclusive)', () => {
        expect(windowContains(w, 610)).toBe(true);
    });
    it('returns true for mid-window', () => {
        expect(windowContains(w, 605)).toBe(true);
    });
    it('returns false just before window', () => {
        expect(windowContains(w, 599)).toBe(false);
    });
    it('returns false just after window', () => {
        expect(windowContains(w, 611)).toBe(false);
    });
});
describe('windowContains — midnight wrap (T8)', () => {
    // start=23:50 (1430), end=00:00 (0)
    const w = makeWindow(1430, 0);
    it('returns true at 23:50', () => {
        expect(windowContains(w, 1430)).toBe(true);
    });
    it('returns true at 23:59', () => {
        expect(windowContains(w, 1439)).toBe(true);
    });
    it('returns true at 00:00 (exactly end)', () => {
        expect(windowContains(w, 0)).toBe(true);
    });
    it('returns false at 00:01', () => {
        expect(windowContains(w, 1)).toBe(false);
    });
    it('returns false at 23:49', () => {
        expect(windowContains(w, 1429)).toBe(false);
    });
});
describe('windowContains — exact 10-min windows', () => {
    // start=00:00, end=00:10
    const wEarly = makeWindow(0, 10);
    it('handles window starting at midnight', () => {
        expect(windowContains(wEarly, 0)).toBe(true);
        expect(windowContains(wEarly, 10)).toBe(true);
        expect(windowContains(wEarly, 11)).toBe(false);
    });
});
// ─── canMutateProtection ──────────────────────────────────────────────────────
describe('canMutateProtection', () => {
    it('T7 — low confidence always returns false regardless of mode', () => {
        const state = { ...baseProtection, immutableMode: false };
        expect(canMutateProtection(state, 605, 'low')).toBe(false);
    });
    it('returns true when immutableMode is false (high confidence)', () => {
        const state = { ...baseProtection, immutableMode: false };
        expect(canMutateProtection(state, 605, 'high')).toBe(true);
    });
    it('returns true when immutableMode is false (medium confidence)', () => {
        const state = { ...baseProtection, immutableMode: false };
        expect(canMutateProtection(state, 605, 'medium')).toBe(true);
    });
    it('T1 — immutableMode ON, outside window → false', () => {
        const state = { ...baseProtection, immutableMode: true };
        // window 23:50–00:00; minute 600 = 10:00 → outside
        expect(canMutateProtection(state, 600, 'high')).toBe(false);
    });
    it('T1 — immutableMode ON, inside window → true', () => {
        const state = { ...baseProtection, immutableMode: true };
        // window 23:50(1430)–00:00(0); minute 1435 → inside
        expect(canMutateProtection(state, 1435, 'high')).toBe(true);
    });
    it('T1 — immutableMode ON, exactly at start → true', () => {
        const state = { ...baseProtection, immutableMode: true };
        expect(canMutateProtection(state, 1430, 'high')).toBe(true);
    });
    it('T1 — immutableMode ON, exactly at end → true', () => {
        const state = { ...baseProtection, immutableMode: true };
        expect(canMutateProtection(state, 0, 'high')).toBe(true);
    });
    it('T7 — low confidence + immutableMode OFF → still false', () => {
        const state = { ...baseProtection, immutableMode: false };
        expect(canMutateProtection(state, 1435, 'low')).toBe(false);
    });
});
// ─── canDisableTamper ─────────────────────────────────────────────────────────
describe('canDisableTamper', () => {
    it('returns true when tamperProtection is false', () => {
        const state = { ...baseProtection, tamperProtection: false };
        expect(canDisableTamper(state, 600, 'high')).toBe(true);
    });
    it('T7 — low confidence → false', () => {
        const state = { ...baseProtection, tamperProtection: false };
        expect(canDisableTamper(state, 600, 'low')).toBe(false);
    });
    it('tamperProtection ON, outside window → false', () => {
        const state = { ...baseProtection, tamperProtection: true };
        expect(canDisableTamper(state, 600, 'high')).toBe(false);
    });
    it('tamperProtection ON, inside window → true', () => {
        const state = { ...baseProtection, tamperProtection: true };
        expect(canDisableTamper(state, 1435, 'high')).toBe(true);
    });
});
// ─── shortVideoBlocked ────────────────────────────────────────────────────────
const makeCfg = (universalLimitMin, checkedPlatforms, enabled = true) => ({
    enabled,
    universalLimitMin,
    checked: {
        INSTAGRAM_REELS: checkedPlatforms.includes('INSTAGRAM_REELS'),
        YOUTUBE_SHORTS: checkedPlatforms.includes('YOUTUBE_SHORTS'),
        TIKTOK_EXPLORE: checkedPlatforms.includes('TIKTOK_EXPLORE'),
        REDDIT_VIDEOS: checkedPlatforms.includes('REDDIT_VIDEOS'),
        SNAPCHAT_STORIES: checkedPlatforms.includes('SNAPCHAT_STORIES'),
        FACEBOOK_REELS: checkedPlatforms.includes('FACEBOOK_REELS'),
    },
});
const makeUsage = (partial) => ({
    INSTAGRAM_REELS: 0,
    YOUTUBE_SHORTS: 0,
    TIKTOK_EXPLORE: 0,
    REDDIT_VIDEOS: 0,
    SNAPCHAT_STORIES: 0,
    FACEBOOK_REELS: 0,
    ...partial,
});
describe('shortVideoBlocked', () => {
    it('returns empty set when disabled', () => {
        const cfg = makeCfg(30, ['INSTAGRAM_REELS'], false);
        const usage = makeUsage({ INSTAGRAM_REELS: 40 });
        expect(shortVideoBlocked(cfg, usage)).toEqual(new Set());
    });
    it('blocks platform when own usage >= limit', () => {
        const cfg = makeCfg(30, ['INSTAGRAM_REELS']);
        const usage = makeUsage({ INSTAGRAM_REELS: 30 });
        expect(shortVideoBlocked(cfg, usage)).toContain('INSTAGRAM_REELS');
    });
    it('does not block when own usage < limit and collective < limit', () => {
        const cfg = makeCfg(30, ['INSTAGRAM_REELS']);
        const usage = makeUsage({ INSTAGRAM_REELS: 29 });
        expect(shortVideoBlocked(cfg, usage).size).toBe(0);
    });
    it('collective limit: blocks all checked platforms when sum >= limit', () => {
        const cfg = makeCfg(30, ['INSTAGRAM_REELS', 'YOUTUBE_SHORTS']);
        // Sum = 15+16 = 31 >= 30 → both blocked
        const usage = makeUsage({ INSTAGRAM_REELS: 15, YOUTUBE_SHORTS: 16 });
        const blocked = shortVideoBlocked(cfg, usage);
        expect(blocked).toContain('INSTAGRAM_REELS');
        expect(blocked).toContain('YOUTUBE_SHORTS');
    });
    it('does NOT block unchecked platforms even when collective over limit', () => {
        const cfg = makeCfg(30, ['INSTAGRAM_REELS']); // YOUTUBE_SHORTS not checked
        const usage = makeUsage({ INSTAGRAM_REELS: 31, YOUTUBE_SHORTS: 50 });
        const blocked = shortVideoBlocked(cfg, usage);
        expect(blocked).toContain('INSTAGRAM_REELS');
        expect(blocked).not.toContain('YOUTUBE_SHORTS');
    });
    it('exactly at limit (>=) is blocked', () => {
        const cfg = makeCfg(30, ['TIKTOK_EXPLORE']);
        const usage = makeUsage({ TIKTOK_EXPLORE: 30 });
        expect(shortVideoBlocked(cfg, usage)).toContain('TIKTOK_EXPLORE');
    });
    it('one under limit is not blocked', () => {
        const cfg = makeCfg(30, ['REDDIT_VIDEOS']);
        const usage = makeUsage({ REDDIT_VIDEOS: 29 });
        expect(shortVideoBlocked(cfg, usage).size).toBe(0);
    });
    it('all 6 platforms checked, collective triggers all', () => {
        const all = ['INSTAGRAM_REELS', 'YOUTUBE_SHORTS', 'TIKTOK_EXPLORE', 'REDDIT_VIDEOS', 'SNAPCHAT_STORIES', 'FACEBOOK_REELS'];
        const cfg = makeCfg(10, all);
        // 2 min each = 12 >= 10
        const usage = makeUsage({
            INSTAGRAM_REELS: 2, YOUTUBE_SHORTS: 2, TIKTOK_EXPLORE: 2,
            REDDIT_VIDEOS: 2, SNAPCHAT_STORIES: 2, FACEBOOK_REELS: 2,
        });
        const blocked = shortVideoBlocked(cfg, usage);
        for (const p of all) {
            expect(blocked).toContain(p);
        }
    });
});
// ─── appOverLimit ─────────────────────────────────────────────────────────────
describe('appOverLimit', () => {
    const baseApp = {
        id: 'com.example.app',
        name: 'Example',
        dailyLimitMin: 60,
        blocked: false,
        internetBlocked: false,
    };
    it('returns false when dailyLimitMin is 0 (no limit)', () => {
        expect(appOverLimit({ ...baseApp, dailyLimitMin: 0 }, 999)).toBe(false);
    });
    it('returns true when usage equals limit', () => {
        expect(appOverLimit(baseApp, 60)).toBe(true);
    });
    it('returns true when usage exceeds limit', () => {
        expect(appOverLimit(baseApp, 61)).toBe(true);
    });
    it('returns false when usage is under limit', () => {
        expect(appOverLimit(baseApp, 59)).toBe(false);
    });
});
// ─── groupOverQuota ───────────────────────────────────────────────────────────
describe('groupOverQuota', () => {
    const baseGroup = {
        id: 'g1',
        name: 'Gaming',
        appIds: [],
        dailyQuotaMin: 60,
        enabled: true,
    };
    it('no quota (0) → always false', () => {
        expect(groupOverQuota({ ...baseGroup, dailyQuotaMin: 0 }, 999)).toBe(false);
    });
    it('exactly at quota → true', () => {
        expect(groupOverQuota(baseGroup, 60)).toBe(true);
    });
    it('over quota → true', () => {
        expect(groupOverQuota(baseGroup, 61)).toBe(true);
    });
    it('under quota → false', () => {
        expect(groupOverQuota(baseGroup, 59)).toBe(false);
    });
});
// ─── groupOutsideSchedule ─────────────────────────────────────────────────────
describe('groupOutsideSchedule', () => {
    it('no schedule → never outside', () => {
        const group = {
            id: 'g1', name: 'G', appIds: [], dailyQuotaMin: 0, enabled: true,
        };
        expect(groupOutsideSchedule(group, 600, 'MON')).toBe(false);
    });
    it('schedule but no entry for day → not restricted', () => {
        const group = {
            id: 'g1', name: 'G', appIds: [], dailyQuotaMin: 0, enabled: true,
            schedule: [{ day: 'TUE', allowedWindows: [] }],
        };
        expect(groupOutsideSchedule(group, 600, 'MON')).toBe(false);
    });
    it('allowedWindows empty → completely blocked', () => {
        const group = {
            id: 'g1', name: 'G', appIds: [], dailyQuotaMin: 0, enabled: true,
            schedule: [{ day: 'MON', allowedWindows: [] }],
        };
        expect(groupOutsideSchedule(group, 600, 'MON')).toBe(true);
    });
    it('within allowed window → in schedule', () => {
        const group = {
            id: 'g1', name: 'G', appIds: [], dailyQuotaMin: 0, enabled: true,
            schedule: [{
                    day: 'MON',
                    allowedWindows: [{ startMinuteOfDay: 540, endMinuteOfDay: 720 }],
                }],
        };
        expect(groupOutsideSchedule(group, 600, 'MON')).toBe(false);
    });
    it('outside allowed window → blocked', () => {
        const group = {
            id: 'g1', name: 'G', appIds: [], dailyQuotaMin: 0, enabled: true,
            schedule: [{
                    day: 'MON',
                    allowedWindows: [{ startMinuteOfDay: 540, endMinuteOfDay: 720 }],
                }],
        };
        expect(groupOutsideSchedule(group, 800, 'MON')).toBe(true);
    });
});
// ─── epochToMinuteOfDay ───────────────────────────────────────────────────────
describe('epochToMinuteOfDay', () => {
    it('correctly extracts minute-of-day for a known timestamp in UTC', () => {
        // 2024-01-15T10:30:00Z = 10h30m = 630 min of day in UTC
        const epoch = Date.UTC(2024, 0, 15, 10, 30, 0);
        const minuteOfDay = epochToMinuteOfDay(epoch, 'UTC');
        expect(minuteOfDay).toBe(630);
    });
    it('handles midnight correctly', () => {
        const epoch = Date.UTC(2024, 0, 15, 0, 0, 0);
        expect(epochToMinuteOfDay(epoch, 'UTC')).toBe(0);
    });
    it('handles end of day', () => {
        const epoch = Date.UTC(2024, 0, 15, 23, 59, 0);
        expect(epochToMinuteOfDay(epoch, 'UTC')).toBe(1439);
    });
});
// ─── Monotonic day index (T2) ─────────────────────────────────────────────────
describe('epochToMonotonicDayIndex', () => {
    it('day 0 starts at epoch 0', () => {
        expect(epochToMonotonicDayIndex(0)).toBe(0);
    });
    it('rolls over at exactly 24h', () => {
        expect(epochToMonotonicDayIndex(MS_PER_DAY)).toBe(1);
    });
    it('T2 — rolling back clock by < 1 day gives same or higher day index', () => {
        const t = Date.UTC(2024, 5, 15, 12, 0, 0); // noon
        const idx = epochToMonotonicDayIndex(t);
        // "rolling back" 6 hours — still same day
        const rollback = epochToMonotonicDayIndex(t - 6 * 60 * 60 * 1000);
        expect(rollback).toBe(idx); // same day
    });
    it('T2 — rolling back by 24h gives lower index (attack detectable)', () => {
        const t = Date.UTC(2024, 5, 15, 12, 0, 0);
        const idx = epochToMonotonicDayIndex(t);
        const dayBefore = epochToMonotonicDayIndex(t - MS_PER_DAY);
        expect(dayBefore).toBe(idx - 1); // lower — attack detectable by monotonicity guard
    });
});
describe('monotonicDayIndexToIsoDate', () => {
    it('day 0 → 1970-01-01', () => {
        expect(monotonicDayIndexToIsoDate(0)).toBe('1970-01-01');
    });
    it('known date round-trip', () => {
        const epoch = Date.UTC(2024, 5, 15, 12, 0, 0);
        const idx = epochToMonotonicDayIndex(epoch);
        expect(monotonicDayIndexToIsoDate(idx)).toBe('2024-06-15');
    });
});
// ─── isWideningAppLimit (T15) ─────────────────────────────────────────────────
describe('isWideningAppLimit', () => {
    it('no current limit (0) → never widening', () => {
        expect(isWideningAppLimit(0, 100)).toBe(false);
    });
    it('removing limit (proposed=0) from existing → widening', () => {
        expect(isWideningAppLimit(60, 0)).toBe(true);
    });
    it('increasing limit → widening', () => {
        expect(isWideningAppLimit(60, 90)).toBe(true);
    });
    it('same limit → not widening', () => {
        expect(isWideningAppLimit(60, 60)).toBe(false);
    });
    it('reducing limit → not widening (stricter)', () => {
        expect(isWideningAppLimit(60, 30)).toBe(false);
    });
});
// ─── DST edge case (T8) ───────────────────────────────────────────────────────
describe('T8 — DST spring-forward inside a window', () => {
    // In Europe/Istanbul, clocks spring forward on last Sunday of March
    // 2024-03-31 at 03:00 → 04:00 (UTC+3 becomes UTC+3 — actually Turkey uses UTC+3 year-round now)
    // Using America/New_York for a real DST test: 2024-03-10 at 02:00 → 03:00
    it('epochToMinuteOfDay handles DST gap correctly via Intl', () => {
        // 2024-03-10T07:30:00Z = 02:30 EST → 03:30 EDT (spring-forward)
        const epoch = Date.UTC(2024, 2, 10, 7, 30, 0); // 07:30 UTC
        const minuteNYC = epochToMinuteOfDay(epoch, 'America/New_York');
        // After spring-forward, this should be 03:30 = 210 minutes
        expect(minuteNYC).toBe(210);
    });
});
// ─── Clock rollback attack (T1) ───────────────────────────────────────────────
describe('T1 — Clock rollback attack simulation', () => {
    it('low confidence blocks mutation even when within window', () => {
        const state = {
            immutableMode: true,
            immutableWindow: makeWindow(1430, 0), // 23:50 window
        };
        // Attacker set clock to 23:55 to enter window, but NTP says drift > 90s
        expect(canMutateProtection(state, 1435, 'low')).toBe(false);
    });
});
//# sourceMappingURL=invariants.test.js.map
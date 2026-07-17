// packages/domain/__tests__/reducers.test.ts
// Tests for all domain reducers verifying T15 (lock widening), E_LOCKED, etc.
import { describe, expect, it } from 'vitest';
import { setImmutableMode, setImmutableWindow, setTamperProtection, setAppDailyLimit, setAppBlocked, addWebsiteToBlacklist, removeWebsiteFromBlacklist, setNsfwFilter, setSilenced, setRetention, } from '../src/reducers.js';
import { isOk, isErr } from '../src/result.js';
// ─── Fixtures ─────────────────────────────────────────────────────────────────
const makeWindow = (start, end) => ({
    startMinuteOfDay: start,
    endMinuteOfDay: end,
});
const baseProtection = {
    immutableMode: false,
    immutableWindow: makeWindow(1430, 0),
    protectedAccess: false,
    tamperProtection: false,
    uninstallWindow: makeWindow(1430, 0),
    lastMutationAt: 1000000,
    hmac: 'a'.repeat(64),
};
const baseContext = { minuteOfDay: 600, confidence: 'high', trustedEpochMs: 1700000000000 };
const lockedContext = { minuteOfDay: 600, confidence: 'high', trustedEpochMs: 1700000000000 };
const lowConfContext = { minuteOfDay: 1435, confidence: 'low', trustedEpochMs: 1700000000000 };
const baseApp = {
    id: 'com.test.app',
    name: 'Test App',
    dailyLimitMin: 60,
    blocked: false,
    internetBlocked: false,
};
const baseAppBlockingState = {
    apps: { 'com.test.app': baseApp },
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
const baseWebState = {
    nsfwFilterEnabled: false,
    customBlacklist: [],
    vpnActive: false,
};
const baseNotifState = {
    silenced: {},
    retention: 'P1M',
};
// ─── setImmutableMode ─────────────────────────────────────────────────────────
describe('setImmutableMode', () => {
    it('succeeds when immutableMode is off', () => {
        const result = setImmutableMode(baseProtection, true, baseContext);
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.immutableMode).toBe(true);
    });
    it('T7 — low confidence → E_LOCKED', () => {
        const result = setImmutableMode(baseProtection, false, lowConfContext);
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('T1 — immutableMode ON, outside window → E_LOCKED', () => {
        const locked = { ...baseProtection, immutableMode: true };
        const result = setImmutableMode(locked, false, lockedContext);
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('T1 — immutableMode ON, inside window → success', () => {
        const locked = { ...baseProtection, immutableMode: true };
        const inWindowCtx = { ...lockedContext, minuteOfDay: 1435 };
        const result = setImmutableMode(locked, false, inWindowCtx);
        expect(isOk(result)).toBe(true);
    });
    it('updates lastMutationAt to trustedEpochMs', () => {
        const result = setImmutableMode(baseProtection, true, baseContext);
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.lastMutationAt).toBe(baseContext.trustedEpochMs);
    });
});
// ─── setImmutableWindow ───────────────────────────────────────────────────────
describe('setImmutableWindow', () => {
    it('rejects invalid window (not 10 min)', () => {
        const result = setImmutableWindow(baseProtection, { startMinuteOfDay: 600, endMinuteOfDay: 620 }, // 20 min = invalid
        baseContext);
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_INVALID_WINDOW');
    });
    it('accepts valid 10-min window', () => {
        const result = setImmutableWindow(baseProtection, makeWindow(600, 610), baseContext);
        expect(isOk(result)).toBe(true);
    });
    it('T14 — zero-minute window (same start/end) → invalid', () => {
        const result = setImmutableWindow(baseProtection, { startMinuteOfDay: 600, endMinuteOfDay: 600 }, baseContext);
        expect(isErr(result)).toBe(true);
    });
});
// ─── setTamperProtection ──────────────────────────────────────────────────────
describe('setTamperProtection', () => {
    it('disabling tamper outside window when ON → E_LOCKED', () => {
        const state = { ...baseProtection, tamperProtection: true };
        const result = setTamperProtection(state, false, lockedContext);
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('disabling tamper inside window when ON → success', () => {
        const state = { ...baseProtection, tamperProtection: true };
        const inWindowCtx = { ...lockedContext, minuteOfDay: 1435 };
        const result = setTamperProtection(state, false, inWindowCtx);
        expect(isOk(result)).toBe(true);
    });
    it('enabling tamper protection always succeeds', () => {
        const result = setTamperProtection(baseProtection, true, lockedContext);
        expect(isOk(result)).toBe(true);
    });
});
// ─── setAppDailyLimit (T15) ───────────────────────────────────────────────────
describe('setAppDailyLimit', () => {
    it('T15 — widening limit while locked → E_LOCKED', () => {
        const result = setAppDailyLimit(baseAppBlockingState, 'com.test.app', 90, true, { trustedEpochMs: 0 });
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('T15 — removing limit (0) while locked → E_LOCKED', () => {
        const result = setAppDailyLimit(baseAppBlockingState, 'com.test.app', 0, true, { trustedEpochMs: 0 });
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('T15 — reducing limit while locked → success (stricter)', () => {
        const result = setAppDailyLimit(baseAppBlockingState, 'com.test.app', 30, true, { trustedEpochMs: 0 });
        expect(isOk(result)).toBe(true);
    });
    it('unknown appId → E_INVALID_SCHEMA', () => {
        const result = setAppDailyLimit(baseAppBlockingState, 'com.unknown', 30, false, { trustedEpochMs: 0 });
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_INVALID_SCHEMA');
    });
    it('out-of-range limit → E_INVALID_SCHEMA', () => {
        const result = setAppDailyLimit(baseAppBlockingState, 'com.test.app', 1441, false, { trustedEpochMs: 0 });
        expect(isErr(result)).toBe(true);
    });
});
// ─── addWebsiteToBlacklist ────────────────────────────────────────────────────
describe('addWebsiteToBlacklist', () => {
    it('valid hostname succeeds', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'example.com');
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.customBlacklist).toContain('example.com');
    });
    it('subdomain with multiple dots is valid', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'sub.example.co.uk');
        expect(isOk(result)).toBe(true);
    });
    it('invalid hostname (no TLD) → E_INVALID_SCHEMA', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'notadomain');
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_INVALID_SCHEMA');
    });
    it('reserved TLD "localhost" → E_INVALID_SCHEMA', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'something.localhost');
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.message).toContain('ayrılmış TLD');
    });
    it('reserved TLD "local" → rejected', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'my.device.local');
        expect(isErr(result)).toBe(true);
    });
    it('reserved TLD "test" → rejected', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'example.test');
        expect(isErr(result)).toBe(true);
    });
    it('duplicate hostname → E_DUPLICATE_HOST', () => {
        const stateWithEntry = {
            ...baseWebState,
            customBlacklist: ['example.com'],
        };
        const result = addWebsiteToBlacklist(stateWithEntry, 'example.com');
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_DUPLICATE_HOST');
    });
    it('normalises to lowercase', () => {
        const result = addWebsiteToBlacklist(baseWebState, 'EXAMPLE.COM');
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.customBlacklist).toContain('example.com');
    });
    it('hostname over 253 chars → rejected', () => {
        const longHost = 'a'.repeat(250) + '.co';
        const result = addWebsiteToBlacklist(baseWebState, longHost);
        expect(isErr(result)).toBe(true);
    });
});
// ─── removeWebsiteFromBlacklist (T15) ────────────────────────────────────────
describe('removeWebsiteFromBlacklist', () => {
    const stateWithEntry = {
        ...baseWebState,
        customBlacklist: ['example.com'],
    };
    it('T15 — removing while locked → E_LOCKED', () => {
        const result = removeWebsiteFromBlacklist(stateWithEntry, 'example.com', true);
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('removing when unlocked → success', () => {
        const result = removeWebsiteFromBlacklist(stateWithEntry, 'example.com', false);
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.customBlacklist).toHaveLength(0);
    });
    it('removing non-existent entry → E_INVALID_SCHEMA', () => {
        const result = removeWebsiteFromBlacklist(stateWithEntry, 'notinlist.com', false);
        expect(isErr(result)).toBe(true);
    });
});
// ─── setNsfwFilter (T15) ─────────────────────────────────────────────────────
describe('setNsfwFilter', () => {
    it('T15 — disabling NSFW while locked → E_LOCKED', () => {
        const state = { ...baseWebState, nsfwFilterEnabled: true };
        const result = setNsfwFilter(state, false, true);
        expect(isErr(result)).toBe(true);
        if (isErr(result))
            expect(result.error.code).toBe('E_LOCKED');
    });
    it('enabling NSFW while locked → success (stricter)', () => {
        const result = setNsfwFilter(baseWebState, true, true);
        expect(isOk(result)).toBe(true);
    });
    it('disabling NSFW when unlocked → success', () => {
        const state = { ...baseWebState, nsfwFilterEnabled: true };
        const result = setNsfwFilter(state, false, false);
        expect(isOk(result)).toBe(true);
    });
});
// ─── setSilenced ──────────────────────────────────────────────────────────────
describe('setSilenced', () => {
    it('silences an app', () => {
        const result = setSilenced(baseNotifState, 'com.instagram.android', true);
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.silenced['com.instagram.android']).toBe(true);
    });
    it('unsilences an app', () => {
        const state = {
            ...baseNotifState,
            silenced: { 'com.instagram.android': true },
        };
        const result = setSilenced(state, 'com.instagram.android', false);
        expect(isOk(result)).toBe(true);
        if (isOk(result))
            expect(result.value.silenced['com.instagram.android']).toBe(false);
    });
});
// ─── setRetention ─────────────────────────────────────────────────────────────
describe('setRetention', () => {
    it('sets all valid retention values', () => {
        const retentions = ['P15D', 'P1M', 'P3M', 'P6M', 'P1Y'];
        for (const r of retentions) {
            const result = setRetention(baseNotifState, r);
            expect(isOk(result)).toBe(true);
            if (isOk(result))
                expect(result.value.retention).toBe(r);
        }
    });
});
//# sourceMappingURL=reducers.test.js.map
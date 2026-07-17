import { z } from 'zod';
// ─── Short Video Platforms ────────────────────────────────────────────────────
export const ShortVideoPlatform = z.enum([
    'INSTAGRAM_REELS',
    'YOUTUBE_SHORTS',
    'TIKTOK_EXPLORE',
    'REDDIT_VIDEOS',
    'SNAPCHAT_STORIES',
    'FACEBOOK_REELS',
]);
export const SHORT_VIDEO_PLATFORMS = ShortVideoPlatform.options;
// Per-platform usage record (minutes used today)
export const PlatformUsage = z.record(ShortVideoPlatform, z.number().int().nonnegative());
// Per-platform checked state (which platforms are enrolled in the limit)
export const PlatformChecked = z.record(ShortVideoPlatform, z.boolean());
// Short Video Blocker configuration
export const ShortVideoConfig = z.object({
    // Which platforms are enrolled
    checked: PlatformChecked,
    // Universal limit in minutes (1–240)
    universalLimitMin: z.number().int().min(1).max(240),
    // Enabled master switch
    enabled: z.boolean(),
});
// ─── App Entry ────────────────────────────────────────────────────────────────
export const AppEntry = z.object({
    id: z.string().min(1), // package name (Android) or bundle ID (iOS)
    name: z.string().min(1),
    iconUri: z.string().optional(), // cached local URI
    category: z.string().optional(),
    // Per-app limit in minutes/day (0 = no limit)
    dailyLimitMin: z.number().int().min(0).max(1440),
    blocked: z.boolean(), // manual full block
    internetBlocked: z.boolean(), // data firewall toggle
});
// ─── App Group ────────────────────────────────────────────────────────────────
export const AppGroupId = z.enum(['GAMING', 'SOCIAL', 'STREAMING', 'PRODUCTIVITY', 'CUSTOM']);
export const DayOfWeek = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
// Schedule: array of allowed {startMinuteOfDay, endMinuteOfDay} blocks per day
export const DaySchedule = z.object({
    day: DayOfWeek,
    // If undefined: unrestricted. If empty array: completely blocked that day.
    allowedWindows: z
        .array(z.object({
        startMinuteOfDay: z.number().int().min(0).max(1439),
        endMinuteOfDay: z.number().int().min(0).max(1439),
    }))
        .optional(),
});
export const AppGroup = z.object({
    id: z.string().min(1),
    predefinedType: AppGroupId.optional(),
    name: z.string().min(1),
    appIds: z.array(z.string().min(1)),
    // Group-level quota per day in minutes (0 = no group quota)
    dailyQuotaMin: z.number().int().min(0).max(1440),
    // Schedule restrictions
    schedule: z.array(DaySchedule).length(7).optional(),
    enabled: z.boolean(),
});
// ─── App Blocking State ───────────────────────────────────────────────────────
export const AppBlockingState = z.object({
    apps: z.record(z.string(), AppEntry),
    groups: z.array(AppGroup),
    shortVideo: ShortVideoConfig,
    // Daily usage: appId → minutes used today (monotonic day-index keyed — T2)
    todayUsageMin: z.record(z.string(), z.number().int().nonnegative()),
    // Short video usage per platform today
    shortVideoUsageToday: PlatformUsage,
});
//# sourceMappingURL=appBlocking.js.map
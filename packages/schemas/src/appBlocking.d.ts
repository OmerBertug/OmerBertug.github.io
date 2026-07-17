import { z } from 'zod';
export declare const ShortVideoPlatform: z.ZodEnum<["INSTAGRAM_REELS", "YOUTUBE_SHORTS", "TIKTOK_EXPLORE", "REDDIT_VIDEOS", "SNAPCHAT_STORIES", "FACEBOOK_REELS"]>;
export type ShortVideoPlatform = z.infer<typeof ShortVideoPlatform>;
export declare const SHORT_VIDEO_PLATFORMS: readonly ShortVideoPlatform[];
export declare const PlatformUsage: z.ZodRecord<z.ZodEnum<["INSTAGRAM_REELS", "YOUTUBE_SHORTS", "TIKTOK_EXPLORE", "REDDIT_VIDEOS", "SNAPCHAT_STORIES", "FACEBOOK_REELS"]>, z.ZodNumber>;
export type PlatformUsage = z.infer<typeof PlatformUsage>;
export declare const PlatformChecked: z.ZodRecord<z.ZodEnum<["INSTAGRAM_REELS", "YOUTUBE_SHORTS", "TIKTOK_EXPLORE", "REDDIT_VIDEOS", "SNAPCHAT_STORIES", "FACEBOOK_REELS"]>, z.ZodBoolean>;
export type PlatformChecked = z.infer<typeof PlatformChecked>;
export declare const ShortVideoConfig: z.ZodObject<{
    checked: z.ZodRecord<z.ZodEnum<["INSTAGRAM_REELS", "YOUTUBE_SHORTS", "TIKTOK_EXPLORE", "REDDIT_VIDEOS", "SNAPCHAT_STORIES", "FACEBOOK_REELS"]>, z.ZodBoolean>;
    universalLimitMin: z.ZodNumber;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    checked: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", boolean>>;
    universalLimitMin: number;
    enabled: boolean;
}, {
    checked: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", boolean>>;
    universalLimitMin: number;
    enabled: boolean;
}>;
export type ShortVideoConfig = z.infer<typeof ShortVideoConfig>;
export declare const AppEntry: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    iconUri: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    dailyLimitMin: z.ZodNumber;
    blocked: z.ZodBoolean;
    internetBlocked: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    dailyLimitMin: number;
    blocked: boolean;
    internetBlocked: boolean;
    iconUri?: string | undefined;
    category?: string | undefined;
}, {
    id: string;
    name: string;
    dailyLimitMin: number;
    blocked: boolean;
    internetBlocked: boolean;
    iconUri?: string | undefined;
    category?: string | undefined;
}>;
export type AppEntry = z.infer<typeof AppEntry>;
export declare const AppGroupId: z.ZodEnum<["GAMING", "SOCIAL", "STREAMING", "PRODUCTIVITY", "CUSTOM"]>;
export type AppGroupId = z.infer<typeof AppGroupId>;
export declare const DayOfWeek: z.ZodEnum<["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]>;
export type DayOfWeek = z.infer<typeof DayOfWeek>;
export declare const DaySchedule: z.ZodObject<{
    day: z.ZodEnum<["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]>;
    allowedWindows: z.ZodOptional<z.ZodArray<z.ZodObject<{
        startMinuteOfDay: z.ZodNumber;
        endMinuteOfDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
    allowedWindows?: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }[] | undefined;
}, {
    day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
    allowedWindows?: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }[] | undefined;
}>;
export type DaySchedule = z.infer<typeof DaySchedule>;
export declare const AppGroup: z.ZodObject<{
    id: z.ZodString;
    predefinedType: z.ZodOptional<z.ZodEnum<["GAMING", "SOCIAL", "STREAMING", "PRODUCTIVITY", "CUSTOM"]>>;
    name: z.ZodString;
    appIds: z.ZodArray<z.ZodString, "many">;
    dailyQuotaMin: z.ZodNumber;
    schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
        day: z.ZodEnum<["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]>;
        allowedWindows: z.ZodOptional<z.ZodArray<z.ZodObject<{
            startMinuteOfDay: z.ZodNumber;
            endMinuteOfDay: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            startMinuteOfDay: number;
            endMinuteOfDay: number;
        }, {
            startMinuteOfDay: number;
            endMinuteOfDay: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        allowedWindows?: {
            startMinuteOfDay: number;
            endMinuteOfDay: number;
        }[] | undefined;
    }, {
        day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        allowedWindows?: {
            startMinuteOfDay: number;
            endMinuteOfDay: number;
        }[] | undefined;
    }>, "many">>;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    id: string;
    name: string;
    appIds: string[];
    dailyQuotaMin: number;
    predefinedType?: "GAMING" | "SOCIAL" | "STREAMING" | "PRODUCTIVITY" | "CUSTOM" | undefined;
    schedule?: {
        day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        allowedWindows?: {
            startMinuteOfDay: number;
            endMinuteOfDay: number;
        }[] | undefined;
    }[] | undefined;
}, {
    enabled: boolean;
    id: string;
    name: string;
    appIds: string[];
    dailyQuotaMin: number;
    predefinedType?: "GAMING" | "SOCIAL" | "STREAMING" | "PRODUCTIVITY" | "CUSTOM" | undefined;
    schedule?: {
        day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        allowedWindows?: {
            startMinuteOfDay: number;
            endMinuteOfDay: number;
        }[] | undefined;
    }[] | undefined;
}>;
export type AppGroup = z.infer<typeof AppGroup>;
export declare const AppBlockingState: z.ZodObject<{
    apps: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        iconUri: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        dailyLimitMin: z.ZodNumber;
        blocked: z.ZodBoolean;
        internetBlocked: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        dailyLimitMin: number;
        blocked: boolean;
        internetBlocked: boolean;
        iconUri?: string | undefined;
        category?: string | undefined;
    }, {
        id: string;
        name: string;
        dailyLimitMin: number;
        blocked: boolean;
        internetBlocked: boolean;
        iconUri?: string | undefined;
        category?: string | undefined;
    }>>;
    groups: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        predefinedType: z.ZodOptional<z.ZodEnum<["GAMING", "SOCIAL", "STREAMING", "PRODUCTIVITY", "CUSTOM"]>>;
        name: z.ZodString;
        appIds: z.ZodArray<z.ZodString, "many">;
        dailyQuotaMin: z.ZodNumber;
        schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
            day: z.ZodEnum<["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]>;
            allowedWindows: z.ZodOptional<z.ZodArray<z.ZodObject<{
                startMinuteOfDay: z.ZodNumber;
                endMinuteOfDay: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }, {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
            allowedWindows?: {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }[] | undefined;
        }, {
            day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
            allowedWindows?: {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }[] | undefined;
        }>, "many">>;
        enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        id: string;
        name: string;
        appIds: string[];
        dailyQuotaMin: number;
        predefinedType?: "GAMING" | "SOCIAL" | "STREAMING" | "PRODUCTIVITY" | "CUSTOM" | undefined;
        schedule?: {
            day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
            allowedWindows?: {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }[] | undefined;
        }[] | undefined;
    }, {
        enabled: boolean;
        id: string;
        name: string;
        appIds: string[];
        dailyQuotaMin: number;
        predefinedType?: "GAMING" | "SOCIAL" | "STREAMING" | "PRODUCTIVITY" | "CUSTOM" | undefined;
        schedule?: {
            day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
            allowedWindows?: {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }[] | undefined;
        }[] | undefined;
    }>, "many">;
    shortVideo: z.ZodObject<{
        checked: z.ZodRecord<z.ZodEnum<["INSTAGRAM_REELS", "YOUTUBE_SHORTS", "TIKTOK_EXPLORE", "REDDIT_VIDEOS", "SNAPCHAT_STORIES", "FACEBOOK_REELS"]>, z.ZodBoolean>;
        universalLimitMin: z.ZodNumber;
        enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        checked: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", boolean>>;
        universalLimitMin: number;
        enabled: boolean;
    }, {
        checked: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", boolean>>;
        universalLimitMin: number;
        enabled: boolean;
    }>;
    todayUsageMin: z.ZodRecord<z.ZodString, z.ZodNumber>;
    shortVideoUsageToday: z.ZodRecord<z.ZodEnum<["INSTAGRAM_REELS", "YOUTUBE_SHORTS", "TIKTOK_EXPLORE", "REDDIT_VIDEOS", "SNAPCHAT_STORIES", "FACEBOOK_REELS"]>, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    apps: Record<string, {
        id: string;
        name: string;
        dailyLimitMin: number;
        blocked: boolean;
        internetBlocked: boolean;
        iconUri?: string | undefined;
        category?: string | undefined;
    }>;
    groups: {
        enabled: boolean;
        id: string;
        name: string;
        appIds: string[];
        dailyQuotaMin: number;
        predefinedType?: "GAMING" | "SOCIAL" | "STREAMING" | "PRODUCTIVITY" | "CUSTOM" | undefined;
        schedule?: {
            day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
            allowedWindows?: {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }[] | undefined;
        }[] | undefined;
    }[];
    shortVideo: {
        checked: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", boolean>>;
        universalLimitMin: number;
        enabled: boolean;
    };
    todayUsageMin: Record<string, number>;
    shortVideoUsageToday: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", number>>;
}, {
    apps: Record<string, {
        id: string;
        name: string;
        dailyLimitMin: number;
        blocked: boolean;
        internetBlocked: boolean;
        iconUri?: string | undefined;
        category?: string | undefined;
    }>;
    groups: {
        enabled: boolean;
        id: string;
        name: string;
        appIds: string[];
        dailyQuotaMin: number;
        predefinedType?: "GAMING" | "SOCIAL" | "STREAMING" | "PRODUCTIVITY" | "CUSTOM" | undefined;
        schedule?: {
            day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
            allowedWindows?: {
                startMinuteOfDay: number;
                endMinuteOfDay: number;
            }[] | undefined;
        }[] | undefined;
    }[];
    shortVideo: {
        checked: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", boolean>>;
        universalLimitMin: number;
        enabled: boolean;
    };
    todayUsageMin: Record<string, number>;
    shortVideoUsageToday: Partial<Record<"INSTAGRAM_REELS" | "YOUTUBE_SHORTS" | "TIKTOK_EXPLORE" | "REDDIT_VIDEOS" | "SNAPCHAT_STORIES" | "FACEBOOK_REELS", number>>;
}>;
export type AppBlockingState = z.infer<typeof AppBlockingState>;
//# sourceMappingURL=appBlocking.d.ts.map
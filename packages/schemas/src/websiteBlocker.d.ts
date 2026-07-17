import { z } from 'zod';
export declare const BlockedHostname: z.ZodEffects<z.ZodString, string, string>;
export type BlockedHostname = z.infer<typeof BlockedHostname>;
export declare const WebsiteBlockerState: z.ZodObject<{
    nsfwFilterEnabled: z.ZodBoolean;
    customBlacklist: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
    vpnActive: z.ZodBoolean;
    simulatedOnIos: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    nsfwFilterEnabled: boolean;
    customBlacklist: string[];
    vpnActive: boolean;
    simulatedOnIos?: boolean | undefined;
}, {
    nsfwFilterEnabled: boolean;
    customBlacklist: string[];
    vpnActive: boolean;
    simulatedOnIos?: boolean | undefined;
}>;
export type WebsiteBlockerState = z.infer<typeof WebsiteBlockerState>;
//# sourceMappingURL=websiteBlocker.d.ts.map
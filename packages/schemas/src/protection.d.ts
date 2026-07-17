import { z } from 'zod';
export declare const TimeWindow: z.ZodEffects<z.ZodObject<{
    startMinuteOfDay: z.ZodNumber;
    endMinuteOfDay: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    startMinuteOfDay: number;
    endMinuteOfDay: number;
}, {
    startMinuteOfDay: number;
    endMinuteOfDay: number;
}>, {
    startMinuteOfDay: number;
    endMinuteOfDay: number;
}, {
    startMinuteOfDay: number;
    endMinuteOfDay: number;
}>;
export type TimeWindow = z.infer<typeof TimeWindow>;
export declare const ProtectionState: z.ZodObject<{
    immutableMode: z.ZodBoolean;
    immutableWindow: z.ZodEffects<z.ZodObject<{
        startMinuteOfDay: z.ZodNumber;
        endMinuteOfDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>;
    protectedAccess: z.ZodBoolean;
    tamperProtection: z.ZodBoolean;
    uninstallWindow: z.ZodEffects<z.ZodObject<{
        startMinuteOfDay: z.ZodNumber;
        endMinuteOfDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>;
    lastMutationAt: z.ZodNumber;
    hmac: z.ZodString;
}, "strip", z.ZodTypeAny, {
    immutableMode: boolean;
    immutableWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    protectedAccess: boolean;
    tamperProtection: boolean;
    uninstallWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    lastMutationAt: number;
    hmac: string;
}, {
    immutableMode: boolean;
    immutableWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    protectedAccess: boolean;
    tamperProtection: boolean;
    uninstallWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    lastMutationAt: number;
    hmac: string;
}>;
export type ProtectionState = z.infer<typeof ProtectionState>;
export declare const ProtectionStatePayload: z.ZodObject<Omit<{
    immutableMode: z.ZodBoolean;
    immutableWindow: z.ZodEffects<z.ZodObject<{
        startMinuteOfDay: z.ZodNumber;
        endMinuteOfDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>;
    protectedAccess: z.ZodBoolean;
    tamperProtection: z.ZodBoolean;
    uninstallWindow: z.ZodEffects<z.ZodObject<{
        startMinuteOfDay: z.ZodNumber;
        endMinuteOfDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }, {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    }>;
    lastMutationAt: z.ZodNumber;
    hmac: z.ZodString;
}, "hmac">, "strip", z.ZodTypeAny, {
    immutableMode: boolean;
    immutableWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    protectedAccess: boolean;
    tamperProtection: boolean;
    uninstallWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    lastMutationAt: number;
}, {
    immutableMode: boolean;
    immutableWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    protectedAccess: boolean;
    tamperProtection: boolean;
    uninstallWindow: {
        startMinuteOfDay: number;
        endMinuteOfDay: number;
    };
    lastMutationAt: number;
}>;
export type ProtectionStatePayload = z.infer<typeof ProtectionStatePayload>;
//# sourceMappingURL=protection.d.ts.map
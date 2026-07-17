import { z } from 'zod';
export declare const NotificationRetention: z.ZodEnum<["P15D", "P1M", "P3M", "P6M", "P1Y"]>;
export type NotificationRetention = z.infer<typeof NotificationRetention>;
export declare const RETENTION_MS: Record<NotificationRetention, number>;
export declare const NotificationEvent: z.ZodObject<{
    id: z.ZodString;
    appId: z.ZodString;
    appName: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    receivedAt: z.ZodNumber;
    hidden: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    appId: string;
    appName: string;
    receivedAt: number;
    hidden: boolean;
    title?: string | undefined;
}, {
    id: string;
    appId: string;
    appName: string;
    receivedAt: number;
    hidden: boolean;
    title?: string | undefined;
}>;
export type NotificationEvent = z.infer<typeof NotificationEvent>;
export declare const NotificationRestriction: z.ZodObject<{
    appId: z.ZodString;
    silenced: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    appId: string;
    silenced: boolean;
}, {
    appId: string;
    silenced: boolean;
}>;
export type NotificationRestriction = z.infer<typeof NotificationRestriction>;
export declare const NotificationsState: z.ZodObject<{
    silenced: z.ZodRecord<z.ZodString, z.ZodBoolean>;
    retention: z.ZodEnum<["P15D", "P1M", "P3M", "P6M", "P1Y"]>;
    historyFilter: z.ZodOptional<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
    }, {
        from: string;
        to: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    silenced: Record<string, boolean>;
    retention: "P15D" | "P1M" | "P3M" | "P6M" | "P1Y";
    historyFilter?: {
        from: string;
        to: string;
    } | undefined;
}, {
    silenced: Record<string, boolean>;
    retention: "P15D" | "P1M" | "P3M" | "P6M" | "P1Y";
    historyFilter?: {
        from: string;
        to: string;
    } | undefined;
}>;
export type NotificationsState = z.infer<typeof NotificationsState>;
//# sourceMappingURL=notifications.d.ts.map
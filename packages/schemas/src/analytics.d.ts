import { z } from 'zod';
export declare const ScreenTimeSample: z.ZodObject<{
    appId: z.ZodString;
    date: z.ZodString;
    monotonicDayIndex: z.ZodNumber;
    usageMinutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    appId: string;
    monotonicDayIndex: number;
    usageMinutes: number;
}, {
    date: string;
    appId: string;
    monotonicDayIndex: number;
    usageMinutes: number;
}>;
export type ScreenTimeSample = z.infer<typeof ScreenTimeSample>;
export declare const DataUsageSample: z.ZodObject<{
    appId: z.ZodString;
    date: z.ZodString;
    monotonicDayIndex: z.ZodNumber;
    wifiMb: z.ZodNumber;
    cellularMb: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    appId: string;
    monotonicDayIndex: number;
    wifiMb: number;
    cellularMb: number;
}, {
    date: string;
    appId: string;
    monotonicDayIndex: number;
    wifiMb: number;
    cellularMb: number;
}>;
export type DataUsageSample = z.infer<typeof DataUsageSample>;
export declare const AnalyticsView: z.ZodEnum<["SCREEN", "DATA"]>;
export type AnalyticsView = z.infer<typeof AnalyticsView>;
export declare const AnalyticsState: z.ZodObject<{
    selectedView: z.ZodEnum<["SCREEN", "DATA"]>;
    selectedWeekdayIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    selectedView: "SCREEN" | "DATA";
    selectedWeekdayIndex: number;
}, {
    selectedView: "SCREEN" | "DATA";
    selectedWeekdayIndex: number;
}>;
export type AnalyticsState = z.infer<typeof AnalyticsState>;
//# sourceMappingURL=analytics.d.ts.map
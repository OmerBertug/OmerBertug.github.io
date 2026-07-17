import { z } from 'zod';
// ─── Screen Time Sample ───────────────────────────────────────────────────────
// One data point per app per day
export const ScreenTimeSample = z.object({
    appId: z.string().min(1),
    // ISO date string 'YYYY-MM-DD' — trusted local date derived from monotonic anchor
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı'),
    // Monotonic day index (T2: append-only, rollback-resistant)
    monotonicDayIndex: z.number().int().nonnegative(),
    usageMinutes: z.number().int().nonnegative(),
});
// ─── Data Usage Sample ────────────────────────────────────────────────────────
export const DataUsageSample = z.object({
    appId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    monotonicDayIndex: z.number().int().nonnegative(),
    wifiMb: z.number().nonnegative(),
    cellularMb: z.number().nonnegative(),
});
// ─── Analytics State ──────────────────────────────────────────────────────────
export const AnalyticsView = z.enum(['SCREEN', 'DATA']);
export const AnalyticsState = z.object({
    selectedView: AnalyticsView,
    // 0=Mon…6=Sun in locale week order
    selectedWeekdayIndex: z.number().int().min(0).max(6),
});
//# sourceMappingURL=analytics.js.map
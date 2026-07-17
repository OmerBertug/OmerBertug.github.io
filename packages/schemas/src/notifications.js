import { z } from 'zod';
// ─── Notification Retention ───────────────────────────────────────────────────
// ISO-8601 durations supported as retention periods
export const NotificationRetention = z.enum([
    'P15D', // 15 days
    'P1M', // 1 month
    'P3M', // 3 months
    'P6M', // 6 months
    'P1Y', // 1 year
]);
// Map retention enum → milliseconds for query computation
export const RETENTION_MS = {
    P15D: 15 * 24 * 60 * 60 * 1000,
    P1M: 30 * 24 * 60 * 60 * 1000,
    P3M: 90 * 24 * 60 * 60 * 1000,
    P6M: 180 * 24 * 60 * 60 * 1000,
    P1Y: 365 * 24 * 60 * 60 * 1000,
};
// ─── Notification Event ───────────────────────────────────────────────────────
// Stored in SQLite notification_events table
export const NotificationEvent = z.object({
    id: z.string().min(1), // UUID v4
    appId: z.string().min(1),
    appName: z.string().min(1),
    // Title/body are metadata only — content may be redacted for privacy
    title: z.string().optional(),
    // Trusted epoch ms at which notification was received
    receivedAt: z.number().int().nonnegative(),
    // Whether this notification is hidden due to silencing (audit trail)
    hidden: z.boolean(),
});
// ─── Notification Restriction ─────────────────────────────────────────────────
// Per-app silencing setting
export const NotificationRestriction = z.object({
    appId: z.string().min(1),
    silenced: z.boolean(),
});
// ─── Notifications State ──────────────────────────────────────────────────────
export const NotificationsState = z.object({
    // Map of appId → silenced
    silenced: z.record(z.string(), z.boolean()),
    retention: NotificationRetention,
    // Date range filter for history view (ISO date strings)
    historyFilter: z
        .object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
        .optional(),
});
//# sourceMappingURL=notifications.js.map
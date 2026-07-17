import { z } from 'zod';
// ─── Time Window ─────────────────────────────────────────────────────────────
// Window is exactly 10 minutes, wraps across midnight.
// DECISION: minuteOfDay is stored in local time (captured at first launch via
// Intl.DateTimeFormat) so DST adjustments (T8) are applied at display time only.
export const TimeWindow = z
    .object({
    startMinuteOfDay: z.number().int().min(0).max(1439),
    endMinuteOfDay: z.number().int().min(0).max(1439),
})
    .refine((w) => {
    // Exactly 10 minutes including midnight wrap
    const diff = (w.endMinuteOfDay - w.startMinuteOfDay + 1440) % 1440;
    return diff === 10;
}, { message: 'Pencere tam olarak 10 dakika olmalıdır' });
// ─── Protection State ─────────────────────────────────────────────────────────
export const ProtectionState = z.object({
    immutableMode: z.boolean(),
    immutableWindow: TimeWindow,
    protectedAccess: z.boolean(), // biometric gate on settings
    tamperProtection: z.boolean(),
    uninstallWindow: TimeWindow,
    // Integrity fields
    lastMutationAt: z.number().int().nonnegative(), // trusted epoch ms
    hmac: z.string().length(64), // hex sha256 hmac of the record (excluding itself)
});
// ─── Protection State (without HMAC — used before signing) ───────────────────
export const ProtectionStatePayload = ProtectionState.omit({ hmac: true });
//# sourceMappingURL=protection.js.map
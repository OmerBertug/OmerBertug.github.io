import { z } from 'zod';

// ─── Hostname validation ──────────────────────────────────────────────────────
// Valid hostname: labels separated by dots, ASCII only.
// Rejects reserved TLDs per §9 spec.
const RESERVED_TLDS = new Set(['localhost', 'local', 'test']);

export const BlockedHostname = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    'Geçerli bir alan adı giriniz (örn: example.com)',
  )
  .max(253, 'Alan adı en fazla 253 karakter olabilir')
  .refine(
    (host) => {
      const tld = host.split('.').pop();
      return tld !== undefined && !RESERVED_TLDS.has(tld);
    },
    { message: 'Bu alan adı engellenemez (ayrılmış TLD)' },
  );

export type BlockedHostname = z.infer<typeof BlockedHostname>;

// ─── Website Blocker State ────────────────────────────────────────────────────
export const WebsiteBlockerState = z.object({
  nsfwFilterEnabled: z.boolean(),
  // Custom blacklist: set of exact hostnames (subdomain wildcard applied at enforcement)
  customBlacklist: z.array(BlockedHostname),
  // VPN / DNS proxy currently active (runtime status, not persisted intent)
  vpnActive: z.boolean(),
  // iOS simulated: if true the toggle is known to be simulated (T5/§6.3)
  // SIMULATION: on iOS NEDNSProxyProvider may be unavailable without proper entitlement
  simulatedOnIos: z.boolean().optional(),
});
export type WebsiteBlockerState = z.infer<typeof WebsiteBlockerState>;

// apps/mobile/src/core/time/monotonicAnchor.ts
// Persists NTP anchors to MMKV with HMAC signing.
// Enforces monotonicity: never accept an anchor older than the stored one.

import type { Result } from '@aegis/domain';
import { ok, err } from '@aegis/domain';

// SIMULATION: In full implementation, this imports from 'react-native-mmkv'
// and 'react-native-device-info' for device uptime. The interfaces are correct.
// TODO(native): import { MMKV } from 'react-native-mmkv';
// TODO(native): import DeviceInfo from 'react-native-device-info';

export type NtpAnchor = {
  readonly ntpEpochMs: number;
  readonly wallAtAnchorMs: number;
  readonly uptimeDeltaMs: number; // accumulated since last NTP sync
};

const ANCHOR_STORAGE_KEY = 'aegis.ntp.anchor';

// ─── In-memory fallback for non-native environments ───────────────────────────
// SIMULATION: Replaced by encrypted MMKV in native builds.
let _memoryAnchor: NtpAnchor | null = null;

/**
 * Load the current NTP anchor from storage.
 * Returns null if no anchor has been saved yet.
 */
export async function loadAnchor(): Promise<NtpAnchor | null> {
  // SIMULATION: In native, reads from encrypted MMKV and verifies HMAC.
  // TODO(native): const raw = mmkv.getString(ANCHOR_STORAGE_KEY);
  // TODO(native): if (!raw) return null;
  // TODO(native): const { anchor, hmac } = JSON.parse(raw) as StoredAnchor;
  // TODO(native): const valid = await verifyHmac(JSON.stringify(anchor), hmac);
  // TODO(native): if (!valid) { await wipeAndReset(); return null; }
  // TODO(native): return anchor;
  void ANCHOR_STORAGE_KEY; // suppress lint
  return _memoryAnchor;
}

/**
 * Save an NTP anchor to storage.
 * HMAC-signs the blob before writing.
 * Enforces monotonicity: rejects anchors older than stored.
 */
export async function saveAnchor(anchor: NtpAnchor): Promise<Result<void, { reason: string }>> {
  const existing = await loadAnchor();

  // Monotonicity guard (T1, T2): refuse to go backward in time
  if (existing && anchor.ntpEpochMs < existing.ntpEpochMs) {
    return err({ reason: `Monotonicity violation: new=${anchor.ntpEpochMs} < stored=${existing.ntpEpochMs}` });
  }

  // SIMULATION: In native, signs with HMAC and writes to encrypted MMKV.
  // TODO(native): const hmac = await signHmac(JSON.stringify(anchor));
  // TODO(native): mmkv.set(ANCHOR_STORAGE_KEY, JSON.stringify({ anchor, hmac }));
  _memoryAnchor = anchor;
  return ok(undefined);
}

/**
 * Returns estimated current epoch based on stored anchor + elapsed uptime.
 * Returns null if no anchor available.
 */
export function estimateFromAnchor(anchor: NtpAnchor): number {
  // SIMULATION: In native, reads real device uptime via DeviceInfo.getUptime().
  // TODO(native): const currentUptime = await DeviceInfo.getUptime();
  // TODO(native): const elapsed = currentUptime - anchorUptime;
  // For simulation, uses wall clock difference:
  const elapsed = Date.now() - anchor.wallAtAnchorMs;
  return anchor.ntpEpochMs + elapsed;
}

// apps/mobile/src/core/integrity/tamperCheck.ts
// T10: Detects tampered settings and enforces fail-closed response.
// T6: Detects revoked permissions and triggers re-grant flow.

import type { Result } from '@aegis/domain';
import { ok, err } from '@aegis/domain';
import { verifySettings } from './hmac.js';
import type { TamperEvent } from '@aegis/domain';

// ─── Tamper event log (in-memory + SQLite persistence via storage layer) ──────
type TamperEventHandler = (event: TamperEvent) => void;
const _handlers: TamperEventHandler[] = [];

export function onTamperDetected(handler: TamperEventHandler): () => void {
  _handlers.push(handler);
  return () => {
    const idx = _handlers.indexOf(handler);
    if (idx !== -1) _handlers.splice(idx, 1);
  };
}

function emitTamperEvent(event: TamperEvent): void {
  for (const h of _handlers) {
    h(event);
  }
}

// ─── T10: HMAC mismatch → wipe + fail-closed ─────────────────────────────────

/**
 * Verify the integrity of a settings blob.
 * On mismatch: emits TamperEvent, returns Err (caller must wipe + re-setup).
 */
export async function checkSettingsIntegrity<T extends { hmac: string }>(
  blob: T,
  trustedEpochMs: number,
): Promise<Result<Omit<T, 'hmac'>, { code: 'TAMPER'; detail: string }>> {
  const { hmac, ...payload } = blob;

  const verifyResult = await verifySettings(payload, hmac);
  if (!verifyResult.ok) {
    const event: TamperEvent = {
      type: 'TamperEvent',
      reason: 'HmacMismatch',
      detail: `HMAC verification failed: ${verifyResult.error}`,
      trustedEpochMs,
    };
    emitTamperEvent(event);
    return err({ code: 'TAMPER', detail: event.detail });
  }

  if (!verifyResult.value) {
    const event: TamperEvent = {
      type: 'TamperEvent',
      reason: 'HmacMismatch',
      detail: 'HMAC digest mismatch — settings may have been tampered with externally',
      trustedEpochMs,
    };
    emitTamperEvent(event);
    return err({ code: 'TAMPER', detail: event.detail });
  }

  return ok(payload as Omit<T, 'hmac'>);
}

// ─── T6: Permission revocation detection ─────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'unavailable';

export type RequiredPermission =
  | 'ACCESSIBILITY_SERVICE'
  | 'USAGE_STATS'
  | 'NOTIFICATION_LISTENER'
  | 'VPN';

/**
 * Check if a required permission is still granted.
 * If revoked while Tamper Protection is ON → emits TamperEvent.
 *
 * SIMULATION: In native builds, these check the actual Android/iOS APIs.
 * TODO(native): Android — check AccessibilityManager.isEnabled(), UsageStatsManager, etc.
 * TODO(native): iOS — check FamilyControls.authorizationStatus, NEVPNManager.isEnabled()
 */
export async function checkPermission(
  permission: RequiredPermission,
  tamperProtectionOn: boolean,
  trustedEpochMs: number,
): Promise<Result<PermissionStatus, string>> {
  // SIMULATION: All permissions assumed granted in Expo Go / web preview.
  // TODO(native): Implement real permission checks per platform.
  const simulatedStatus: PermissionStatus = 'granted';
  void permission;
  void tamperProtectionOn;

  if (simulatedStatus === 'denied' && tamperProtectionOn) {
    const event: TamperEvent = {
      type: 'TamperEvent',
      reason: 'PermissionRevoked',
      detail: `Permission ${permission} was revoked while Tamper Protection is ON`,
      trustedEpochMs,
    };
    emitTamperEvent(event);
  }

  return ok(simulatedStatus);
}

// ─── T11: VPN profile revocation ─────────────────────────────────────────────

/**
 * Called when VpnService.onRevoke() fires (Android) or VPN config removed (iOS).
 * Emits TamperEvent if NSFW or custom blacklist is non-empty.
 */
export function handleVpnRevoked(
  hasActiveBlocklist: boolean,
  trustedEpochMs: number,
): void {
  if (!hasActiveBlocklist) return;

  const event: TamperEvent = {
    type: 'TamperEvent',
    reason: 'VpnRevoked',
    detail: 'VPN profile was removed while active blocklist exists — DNS protection disabled',
    trustedEpochMs,
  };
  emitTamperEvent(event);
}

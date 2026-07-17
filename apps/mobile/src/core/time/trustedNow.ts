// apps/mobile/src/core/time/trustedNow.ts
// Implements §5.1 — TrustedTime with NTP + monotonic cross-check.
// T1: rejects wall-clock jumps >5 min without NTP confirmation.
// T7: returns confidence='low' when drift >90s and NTP unavailable.

import type { Result } from '@aegis/domain';
import { ok, err } from '@aegis/domain';
import { loadAnchor, saveAnchor } from './monotonicAnchor.js';
import { queryNtp } from './ntpClient.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrustedTimeSource = 'ntp' | 'monotonic' | 'wall';
export type TrustedTimeConfidence = 'high' | 'medium' | 'low';

export type TrustedTime = {
  readonly epochMs: number;
  readonly source: TrustedTimeSource;
  readonly confidence: TrustedTimeConfidence;
  readonly driftMs: number; // |ntp - wall| or |anchor+delta - wall|
};

export type TrustedTimeError = {
  readonly reason: 'NtpFailed' | 'DriftTooHigh' | 'MonotonicViolation';
  readonly driftMs: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Max wall-clock jump without NTP confirmation before we reject it (T1) */
const MAX_UNCONFIRMED_JUMP_MS = 5 * 60 * 1000; // 5 minutes

/** Max drift before we declare confidence=low and fail-closed (T7) */
const MAX_ACCEPTABLE_DRIFT_MS = 90 * 1000; // 90 seconds

/** NTP anchor validity window */
const NTP_ANCHOR_VALIDITY_MS = 6 * 60 * 60 * 1000; // 6 hours

/** NTP timeout per server */
const NTP_TIMEOUT_MS = 5_000;

// ─── trustedNow ───────────────────────────────────────────────────────────────

/**
 * Returns a TrustedTime with confidence rating and drift measurement.
 * NEVER returns a time with confidence='low' as "OK" — callers must check.
 *
 * Algorithm (§5.1):
 * 1. Read wall clock and monotonic anchor.
 * 2. If last NTP sync < 6h → use ntpAnchor + Δuptime.
 * 3. Else try NTP (5s timeout, 3 servers, take median).
 * 4. If NTP fails and drift > 90s → confidence='low', all locks active.
 * 5. Enforce monotonicity guard: reject anchor older than stored one.
 */
export async function trustedNow(): Promise<Result<TrustedTime, TrustedTimeError>> {
  const wallMs = Date.now();
  const anchor = await loadAnchor();

  // ─── Step 2: Use cached anchor if fresh enough ─────────────────────────────
  if (anchor && wallMs - anchor.ntpEpochMs < NTP_ANCHOR_VALIDITY_MS) {
    // Compute drift between wall clock and anchor-derived estimate
    const estimated = anchor.ntpEpochMs + anchor.uptimeDeltaMs;
    const driftMs = Math.abs(wallMs - estimated);

    // T1: detect clock-jump forward without NTP
    if (wallMs - estimated > MAX_UNCONFIRMED_JUMP_MS) {
      // Possible T1 attack: clock jumped forward by more than 5 min without NTP
      // Fall through to NTP verification
    } else {
      // Wall clock and monotonic estimate agree → use monotonic
      return ok({
        epochMs: estimated,
        source: 'monotonic',
        confidence: driftMs < MAX_ACCEPTABLE_DRIFT_MS ? 'high' : 'medium',
        driftMs,
      });
    }
  }

  // ─── Step 3: Attempt NTP ───────────────────────────────────────────────────
  const ntpResult = await queryNtp({ timeoutMs: NTP_TIMEOUT_MS });

  if (ntpResult.ok) {
    const ntpMs = ntpResult.value;
    const driftMs = Math.abs(ntpMs - wallMs);

    // T5.1 §monotonicity guard: refuse anchor older than stored one
    if (anchor && ntpMs < anchor.ntpEpochMs) {
      // NTP returned an earlier time than our last anchor — monotonicity violated
      return err({
        reason: 'MonotonicViolation',
        driftMs,
      });
    }

    // Persist new anchor
    await saveAnchor({
      ntpEpochMs: ntpMs,
      wallAtAnchorMs: wallMs,
      uptimeDeltaMs: 0, // fresh anchor; delta accumulates on subsequent calls
    });

    return ok({
      epochMs: ntpMs,
      source: 'ntp',
      confidence: 'high',
      driftMs,
    });
  }

  // ─── Step 4: NTP failed — evaluate drift for fail-closed ──────────────────
  if (anchor) {
    const estimated = anchor.ntpEpochMs + anchor.uptimeDeltaMs;
    const driftMs = Math.abs(wallMs - estimated);

    if (driftMs > MAX_ACCEPTABLE_DRIFT_MS) {
      // T7: drift too large, NTP unavailable → confidence='low', all locks active
      return ok({
        epochMs: estimated, // best guess, but callers must treat locks as active
        source: 'monotonic',
        confidence: 'low',
        driftMs,
      });
    }

    return ok({
      epochMs: estimated,
      source: 'monotonic',
      confidence: 'medium',
      driftMs,
    });
  }

  // No anchor, no NTP — absolute worst case
  // T7: treat as low confidence
  return ok({
    epochMs: wallMs,
    source: 'wall',
    confidence: 'low',
    driftMs: 0,
  });
}

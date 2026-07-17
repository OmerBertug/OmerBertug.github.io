// apps/mobile/src/core/integrity/hmac.ts
// §5.3 — HMAC-SHA256 signing of settings blobs using libsodium.
// Key stored in Keychain/Keystore: accessible WHEN_UNLOCKED_THIS_DEVICE_ONLY.

import type { Result } from '@aegis/domain';
import { ok, err } from '@aegis/domain';

// SIMULATION: In native builds, these imports are from react-native-libsodium.
// TODO(native): import { crypto_auth, crypto_auth_verify, from_hex, to_hex } from 'react-native-libsodium';
// TODO(native): import * as Keychain from 'react-native-keychain';

/** Storage service name used for Keychain HMAC key lookup */
const KEYCHAIN_SERVICE = 'com.aegis.detox.hmac';
const KEY_ACCOUNT = 'hmac-key-v1';

// ─── In-memory simulation ─────────────────────────────────────────────────────
// SIMULATION: Real key is 32-byte random, stored in Keychain/Keystore,
// non-exportable, accessible only when device is unlocked.
const _simulatedKey = 'aegis-simulated-hmac-key-32bytes!!';

async function getHmacKey(): Promise<Result<string, string>> {
  // SIMULATION: In native, reads from Keychain with biometric/device lock requirement.
  // TODO(native):
  // const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  // if (!creds) {
  //   const key = toHex(sodium.randombytes_buf(32));
  //   await Keychain.setGenericPassword(KEY_ACCOUNT, key, {
  //     service: KEYCHAIN_SERVICE,
  //     accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  //   });
  //   return ok(key);
  // }
  // return ok(creds.password);
  void KEYCHAIN_SERVICE;
  void KEY_ACCOUNT;
  return ok(_simulatedKey);
}

/**
 * Compute HMAC-SHA256 over a JSON-serialisable payload.
 * Returns 64-char lowercase hex string.
 *
 * SIMULATION: Uses SubtleCrypto (WebCrypto) as fallback.
 * TODO(native): Replace with libsodium crypto_auth for 20x perf + no async key import.
 */
export async function signSettings(payload: unknown): Promise<Result<string, string>> {
  const keyResult = await getHmacKey();
  if (!keyResult.ok) return keyResult;

  const payloadStr = JSON.stringify(payload);

  // SIMULATION: WebCrypto HMAC-SHA256
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyResult.value);
    const messageData = encoder.encode(payloadStr);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hexArray = Array.from(new Uint8Array(signature));
    const hex = hexArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return ok(hex);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'HMAC sign failed');
  }
}

/**
 * Verify HMAC-SHA256 over a payload against a stored hex digest.
 * T10: On mismatch, the caller MUST wipe settings and re-enter setup.
 */
export async function verifySettings(payload: unknown, storedHmac: string): Promise<Result<boolean, string>> {
  const computed = await signSettings(payload);
  if (!computed.ok) return computed;

  // Constant-time comparison to prevent timing attacks
  const isValid = constantTimeEqual(computed.value, storedHmac);
  return ok(isValid);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    // Non-null assertion safe: string access within bounds
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

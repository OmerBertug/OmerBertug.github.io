// apps/mobile/src/core/storage/mmkv.ts
// Encrypted MMKV store — iOS Keychain-backed key.
// SIMULATION: Falls back to AsyncStorage-like in-memory map in non-native envs.
// TODO(native): import { MMKV } from 'react-native-mmkv';

// ─── SIMULATION: In-memory store ─────────────────────────────────────────────
// SIMULATION: In native builds, this is encrypted MMKV with Keychain-backed key.
// TODO(native):
// const mmkv = new MMKV({
//   id: 'aegis-settings',
//   encryptionKey: await getKeychainKey(), // 256-bit AES key from Keychain
// });

const _store = new Map<string, string>();

export const mmkv = {
  getString(key: string): string | undefined {
    // SIMULATION
    return _store.get(key);
  },

  set(key: string, value: string): void {
    // SIMULATION
    _store.set(key, value);
  },

  delete(key: string): void {
    // SIMULATION
    _store.delete(key);
  },

  getAllKeys(): readonly string[] {
    // SIMULATION
    return Array.from(_store.keys());
  },

  clearAll(): void {
    // SIMULATION
    _store.clear();
  },
} as const;

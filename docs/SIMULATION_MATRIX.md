# Simulation Matrix

In non-native environments (Expo Go, Web, unit tests), native APIs are mocked to allow UI and domain logic testing.

| Feature | Native API | Simulation Strategy |
|---------|------------|----------------------|
| **NTP Time** | SNTP UDP Client | HTTP `Date` header fallback from a reliable endpoint. |
| **Monotonic Uptime** | `elapsedRealtime()` / `mach_absolute_time()` | `performance.now()` in JS engine. |
| **Secure Storage** | Keystore + Encrypted MMKV | In-memory Map fallback. |
| **HMAC Signing** | `libsodium` (`crypto_auth`) | WebCrypto (`crypto.subtle.sign`). |
| **SQLite Audit** | `op-sqlite` (WAL mode) | In-memory arrays. |
| **App Blocking** | Accessibility Overlay / ManagedSettings | Console warnings. |
| **DNS VPN** | `VpnService` / `NEDNSProxyProvider` | Console warnings. |

# Threat Model & Defenses

## T1: Device Time Manipulation
**Threat**: User changes system time to enter a Maintenance Window or reset daily limits.
**Defense**: We maintain an NTP-anchored monotonic epoch. The system time is ignored for enforcement. `epochToMonotonicDayIndex` ensures append-only day counters.

## T2: Clear App Data
**Threat**: User goes to Settings -> Storage -> Clear Data to wipe usage stats.
**Defense**: Limits are enforced via `UsageStatsManager` on Android (which survives data clear). Persistent settings are stored in iOS Keychain or Android Keystore backed by Secure Enclave.

## T3: Short Video Feed Bypasses
**Threat**: User uninstalls TikTok but watches YouTube Shorts endlessly.
**Defense**: We use `AccessibilityService` (Android) and `DeviceActivity` (iOS) to detect specific UI View hierarchies representing infinite scrolling feeds.

## T4: App Force Stop
**Threat**: User force stops the Aegis background service.
**Defense**: Device Administrator (Android) prevents force stopping. If the admin is revoked, the `DeviceAdminReceiver` emits a TamperEvent which wipes settings and activates maximum lockdown on next boot.

## T5: Local Proxy / VPN Bypass
**Threat**: User installs a VPN to bypass DNS filtering.
**Defense**: `VpnService` on Android explicitly tracks revocation. If revoked while the blocklist is active, a TamperEvent is triggered.

# Aegis Detox Architecture

## Overview
Aegis Detox is a cross-platform Digital Wellbeing suite. It enforces strict device usage limits, DNS filtering, and app blocking with tamper-resistant mechanisms.

## Core Tenets
1. **Immutable Invariants**: The `packages/domain` contains 100% of the business logic as pure functions (Zod schemas, reducers, pure time checks). This allows identical rule enforcement on mobile and web.
2. **Fail-Closed Design**: If time synchronization (NTP) fails, or if HMAC signature mismatch is detected, the app locks down entirely until the user reinstalls or verifies integrity.
3. **Monotonic Time Anchoring**: To prevent users from changing system time to bypass blocks, Aegis uses an NTP server (e.g., `pool.ntp.org`) and anchors it to `SystemClock.elapsedRealtime()` on Android or `mach_absolute_time()` on iOS.

## Modules
- `packages/schemas`: Zod type definitions for persistence blobs.
- `packages/domain`: Pure TypeScript logic for limits, time windows, and reductions.
- `apps/mobile`: React Native (bare) UI and native module bridges. Zustand state management for React bindings.
- `apps/web`: TanStack Start + React 19 companion dashboard for viewing settings remotely.

## Persistence
- Settings are JSON blobs signed with HMAC-SHA256.
- Encrypted MMKV provides fast synchronous reads for UI.
- Background tasks operate strictly on the trusted settings state.

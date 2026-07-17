# iOS MDM & Family Controls Strategy

Because iOS severely limits background processes and system-level interceptions, Aegis Detox leverages the **Screen Time API (Family Controls)**.

## 1. Entitlement Requirement
The app must be granted the `com.apple.developer.family-controls` entitlement by Apple. This requires submitting a request explaining the parental control/digital wellbeing use case.

## 2. Authorization
On first launch, `AuthorizationCenter.shared.requestAuthorization` is called. The user must approve Screen Time access via Face ID / Touch ID.

## 3. Device Activity Schedules
Instead of polling usage constantly, we register a `DeviceActivitySchedule`. When a configured limit is reached (e.g., 30 mins of Instagram), iOS wakes our `DeviceActivityMonitorExtension`.

## 4. Shielding (Blocking)
Inside the extension's `eventDidReachThreshold` callback, we apply a shield using `ManagedSettingsStore.shield.applications = tokens`. The system instantly blocks the app with an opaque overlay.

## Limitations
- We cannot inspect the internal UI of apps on iOS (like we do with Android AccessibilityService for Short Videos). Instead, we block the entire app domain using `NEDNSProxyProvider` or limit the whole app.

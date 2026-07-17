// apps/mobile/src/core/native/ios/DeviceActivityMonitorExtension.swift
import DeviceActivity
import ManagedSettings

/**
 * §3.1: Device Activity Monitor.
 * Runs in the background when usage thresholds are reached.
 */
class AegisDeviceActivityMonitor: DeviceActivityMonitor {
    let store = ManagedSettingsStore()

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        // Reset daily counters or init monitoring
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        // End of tracking schedule
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        
        // T7: A quota has been reached. Shield the specific applications.
        // We look up the tokens from our AppGroup or App limit settings
        // store.shield.applications = targetTokens
    }

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
    }

    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        // Warn user 5 minutes before limit
    }
}

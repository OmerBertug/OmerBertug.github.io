// apps/mobile/src/core/native/ios/UNNotificationServiceExtension.swift
import UserNotifications

/**
 * §3.3: Notification interception on iOS.
 * This extension allows modifying or suppressing notifications before they are displayed.
 */
class AegisNotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            let bundleId = request.identifier // Assuming we derive app bundle from request/payload
            
            // 1. Check if this app is silenced in MMKV
            // let isSilenced = checkIsSilenced(bundleId)
            let isSilenced = false
            
            if isSilenced {
                // To suppress the notification completely on iOS, we can return an empty content
                // or use UNNotificationPresentationOptions to hide it in the main app.
                // However, App Extensions cannot strictly "cancel" it silently unless specific payload tricks are used.
                // Modern iOS allows clearing badges or mutating body.
                bestAttemptContent.title = "Silenced Notification"
                bestAttemptContent.body = "Aegis suppressed this notification."
            }
            
            // 2. Log to SQLite audit trail (hidden = isSilenced)
            
            contentHandler(bestAttemptContent)
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}

package com.aegis.detox

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * §3.3: Notification interception and silencing.
 * Captures incoming notifications, hides them if the app is silenced,
 * and saves them to SQLite audit log.
 */
class AegisNotificationListener : NotificationListenerService() {
    
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        val title = sbn.notification.extras.getString("android.title")
        
        // 1. Check if app is silenced in MMKV state
        val isSilenced = checkIsSilenced(packageName)
        
        // 2. If silenced, cancel it immediately so it doesn't ring/vibrate
        if (isSilenced) {
            cancelNotification(sbn.key)
            Log.i("AegisNotif", "Silenced notification from $packageName")
        }

        // 3. Write to SQLite audit log (hidden = isSilenced)
        // AegisModule.logNotification(packageName, title, isSilenced)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Notification dismissed by user
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w("AegisNotif", "Notification Listener Disconnected")
    }

    private fun checkIsSilenced(packageName: String): Boolean {
        // Fetch from shared MMKV store synchronously
        // return mmkv.getBoolean("silenced_$packageName", false)
        return false
    }
}

package com.aegis.detox

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * §4.3 T7: Tamper Protection via Device Administrator.
 * Prevents force-stops and uninstalls.
 * If the user attempts to remove the admin privilege, we can block it
 * or wipe the settings if it succeeds while Tamper Protection is ON.
 */
class AegisDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i("AegisDeviceAdmin", "Device Admin Enabled")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // T10: Returning a string here prompts the user with a warning dialog.
        // We can't strictly prevent disable on modern Android, but we can warn.
        return "Disabling this will trigger a Tamper Event and may wipe your settings if not in a Maintenance Window."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.w("AegisDeviceAdmin", "Device Admin Disabled - Tamper Event!")
        // Notify React Native bridge of tamper event
        // AegisModule.emitTamperEvent("DeviceAdminRevoked")
    }
}

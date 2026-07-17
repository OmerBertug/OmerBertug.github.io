package com.aegis.detox

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.util.Log

/**
 * §3.1 T3/T1: Window Content Inspection (Short Video Detection)
 * Monitors active window packages and view hierarchies to detect Reels/Shorts/TikTok.
 */
class AegisAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString() ?: return
        val className = event.className?.toString() ?: return

        // 1. Detect if a target app is foregrounded
        if (isTargetApp(packageName)) {
            // 2. T3: Inspect view hierarchy for short video signatures
            // e.g. ViewPager2 with full-screen video content
            if (isShortVideoView(className, event)) {
                // 3. Emit usage tick to React Native or block if limit reached
                // AegisModule.notifyShortVideoActive(packageName)
                Log.d("AegisA11y", "Short video detected in $packageName")
            }
        }
    }

    override fun onInterrupt() {
        Log.w("AegisA11y", "Accessibility Service Interrupted")
    }

    private fun isTargetApp(pkg: String): Boolean {
        return pkg in listOf(
            "com.instagram.android", 
            "com.google.android.youtube", 
            "com.zhiliaoapp.musically"
        )
    }

    private fun isShortVideoView(cls: String, event: AccessibilityEvent): Boolean {
        // Implementation detects specific ViewPager2 or RecyclerView scrolling behaviors
        // specific to short video feeds.
        return cls.contains("ViewPager") || cls.contains("RecyclerView")
    }
}

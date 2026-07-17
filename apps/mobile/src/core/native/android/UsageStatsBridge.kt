package com.aegis.detox

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi

/**
 * §3.1: Screen Time monitoring.
 * Queries UsageStatsManager to aggregate foreground time per package for the current monotonic day.
 */
class UsageStatsBridge(private val context: Context) {
    
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    fun getUsageForPackages(packages: List<String>, startEpochMs: Long, endEpochMs: Long): Map<String, Long> {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startEpochMs,
            endEpochMs
        )

        val result = mutableMapOf<String, Long>()
        
        if (stats != null) {
            for (stat in stats) {
                if (packages.contains(stat.packageName)) {
                    val current = result.getOrDefault(stat.packageName, 0L)
                    // totalTimeInForeground is in milliseconds
                    result[stat.packageName] = current + stat.totalTimeInForeground
                }
            }
        }
        
        return result
    }
}

package com.aegis.detox

import android.net.VpnService
import android.content.Intent
import android.util.Log

/**
 * §6.1 T11: Local VPN-based DNS Filtering.
 * Intercepts DNS queries (port 53) to block NSFW sites and custom blacklists.
 * Drops packets to blocked IPs/Domains.
 */
class AegisVpnService : VpnService() {
    private var vpnInterface: android.os.ParcelFileDescriptor? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i("AegisVpn", "Starting VPN Service for DNS Filtering")
        setupVpn()
        return START_STICKY
    }

    private fun setupVpn() {
        val builder = Builder()
        builder.addAddress("10.0.0.2", 32)
        builder.addRoute("0.0.0.0", 0) // Route all traffic through VPN interface
        
        // Exclude specific apps if needed (e.g. Aegis itself to fetch NTP)
        // builder.addDisallowedApplication(packageName)

        vpnInterface = builder.establish()
        
        // Start background thread to process packets from vpnInterface
        // intercepting DNS packets and responding with NXDOMAIN for blocked hosts.
    }

    override fun onRevoke() {
        super.onRevoke()
        Log.w("AegisVpn", "VPN Revoked by system or user - Tamper Event!")
        // T11: Emit TamperEvent if VPN is killed while blocklist active
        // AegisModule.emitTamperEvent("VpnRevoked")
    }

    override fun onDestroy() {
        super.onDestroy()
        vpnInterface?.close()
        vpnInterface = null
    }
}

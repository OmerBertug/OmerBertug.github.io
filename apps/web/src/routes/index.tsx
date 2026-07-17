import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { PROTECTION_INVARIANTS } from '@aegis/domain' // Proves domain package works

export const Route = createFileRoute('/')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">App Protection & Blocking</h2>
      
      <div className="bg-surface p-6 rounded-xl flex flex-col gap-4">
        <h3 className="text-lg font-bold">Immutable Mode</h3>
        <p className="text-muted text-sm">Settings cannot be changed outside the maintenance window. Web dashboard is view-only.</p>
        
        <div className="flex justify-between items-center bg-surface2 p-4 rounded-lg">
          <div>
            <span className="font-semibold block">Status</span>
            <span className="text-warning text-sm">🔒 Locked</span>
          </div>
          <div>
            <span className="font-semibold block">Maintenance Window</span>
            <span className="text-text text-sm">00:00 → 00:10</span>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl flex flex-col gap-4">
        <h3 className="text-lg font-bold">Short Video Blocker</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Instagram Reels', 'YouTube Shorts', 'TikTok Explore'].map(platform => (
            <div key={platform} className="bg-surface2 p-4 rounded-lg flex justify-between items-center">
              <span>{platform}</span>
              <span className="bg-danger/20 text-danger px-2 py-1 rounded-full text-xs font-bold">Blocked</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

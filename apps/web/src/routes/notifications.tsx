import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/notifications')({
  component: NotificationsComponent,
})

function NotificationsComponent() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Notification History</h2>
      
      <div className="bg-surface p-6 rounded-xl flex flex-col gap-4">
        <h3 className="text-lg font-bold">Silenced Notifications (Audit Trail)</h3>
        
        <div className="flex flex-col gap-2">
          {[
            { app: 'Instagram', title: 'New message', time: '10 min ago' },
            { app: 'Twitter', title: 'Mentions', time: '2 hours ago' },
          ].map((notif, i) => (
            <div key={i} className="flex justify-between items-center bg-surface2 p-4 rounded-lg">
              <div>
                <span className="font-semibold block">{notif.app}</span>
                <span className="text-muted text-sm">{notif.title}</span>
              </div>
              <span className="text-muted text-xs">{notif.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

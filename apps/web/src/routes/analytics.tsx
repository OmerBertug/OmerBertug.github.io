import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/analytics')({
  component: AnalyticsComponent,
})

function AnalyticsComponent() {
  const [activeTab, setActiveTab] = React.useState<'screen' | 'data'>('screen')

  const dataMap = React.useMemo(() => {
    return {
      screen: [
        { day: 'Mon', value: 3.5, label: '3.5h' },
        { day: 'Tue', value: 4.2, label: '4.2h' },
        { day: 'Wed', value: 2.8, label: '2.8h' },
        { day: 'Thu', value: 5.1, label: '5.1h' },
        { day: 'Fri', value: 3.9, label: '3.9h' },
        { day: 'Sat', value: 1.5, label: '1.5h' },
        { day: 'Sun', value: 2.1, label: '2.1h' },
      ],
      data: [
        { day: 'Mon', value: 1.2, label: '1.2 GB' },
        { day: 'Tue', value: 0.8, label: '800 MB' },
        { day: 'Wed', value: 2.4, label: '2.4 GB' },
        { day: 'Thu', value: 1.5, label: '1.5 GB' },
        { day: 'Fri', value: 3.1, label: '3.1 GB' },
        { day: 'Sat', value: 0.5, label: '500 MB' },
        { day: 'Sun', value: 0.9, label: '900 MB' },
      ],
    }
  }, [])

  const currentData = dataMap[activeTab]
  const maxValue = Math.max(...currentData.map((d) => d.value))

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Analytics & Screen Time</h2>
      
      <div className="bg-surface p-6 rounded-xl flex flex-col gap-4">
        <div className="flex gap-2 p-1 bg-surface2 rounded-lg max-w-sm">
          <button 
            onClick={() => setActiveTab('screen')}
            className={`flex-1 py-1 px-4 rounded font-bold cursor-pointer transition-all ${
              activeTab === 'screen' 
                ? 'bg-surface text-primary shadow-sm' 
                : 'text-muted hover:text-text'
            }`}
          >
            Screen
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-1 px-4 rounded font-semibold cursor-pointer transition-all ${
              activeTab === 'data' 
                ? 'bg-surface text-primary shadow-sm font-bold' 
                : 'text-muted hover:text-text'
            }`}
          >
            Data
          </button>
        </div>

        <div className="h-48 flex items-end justify-between px-4 mt-8">
          {currentData.map((item) => {
            const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
            const heightPx = (percent / 100) * 120 + 20 // scale between 20px and 140px

            return (
              <div key={item.day} className="flex flex-col items-center gap-2 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-surface2 text-text text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                  {item.label}
                </div>
                <div className="w-8 bg-primary/20 rounded-t-sm transition-all duration-300" style={{ height: `${heightPx}px` }}>
                  <div className="w-full bg-primary rounded-t-sm" style={{ height: '85%' }} />
                </div>
                <span className="text-xs font-semibold uppercase text-muted">{item.day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

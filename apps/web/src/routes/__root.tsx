import { createRootRoute, Outlet, Link, HeadContent, Scripts } from '@tanstack/react-router'
import * as React from 'react'
import '../style.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <HeadContent />
        <title>Aegis Detox Web</title>
      </head>
      <body>
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="bg-surface border-b border-surface2 p-4 flex gap-4">
            <h1 className="text-primary font-bold text-xl mr-4">Aegis Web</h1>
            <nav className="flex gap-4 items-center">
              <Link to="/" className="text-muted hover:text-text [&.active]:text-primary [&.active]:font-bold">Dashboard</Link>
              <Link to="/analytics" className="text-muted hover:text-text [&.active]:text-primary [&.active]:font-bold">Analytics</Link>
              <Link to="/notifications" className="text-muted hover:text-text [&.active]:text-primary [&.active]:font-bold">Notifications</Link>
            </nav>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
        <Scripts />
      </body>
    </html>
  )
}

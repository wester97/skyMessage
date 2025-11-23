'use client'

import { useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './globals.css'
import { ClientProviders } from '../components/ClientProviders'
import { ClientRouter } from '../components/ClientRouter'

export default function RootLayout({
  children,
}: {
  children?: React.ReactNode
}) {
  useEffect(() => {
    // Set document title
    if (typeof document !== 'undefined') {
      document.title = 'SkyMessage - Chat with Catholic Saints'
      
      // Set favicon
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (link) {
        link.href = '/icon.png'
      } else {
        const newLink = document.createElement('link')
        newLink.rel = 'icon'
        newLink.href = '/icon.png'
        document.head.appendChild(newLink)
      }

      // Hide iOS status bar - make it black to match AppHeader
      const existingStatusBar = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']")
      if (!existingStatusBar) {
        const statusBarMeta = document.createElement('meta')
        statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
        statusBarMeta.content = 'black-translucent'
        document.head.appendChild(statusBarMeta)
      }

      // Add viewport meta for full screen
      const existingViewport = document.querySelector("meta[name='viewport']")
      if (existingViewport) {
        const viewport = existingViewport as HTMLMetaElement
        if (!viewport.content.includes('viewport-fit=cover')) {
          viewport.content = viewport.content + ', viewport-fit=cover'
        }
      } else {
        const viewportMeta = document.createElement('meta')
        viewportMeta.name = 'viewport'
        viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        document.head.appendChild(viewportMeta)
      }
    }
  }, [])

  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <ClientRouter>
            {children}
          </ClientRouter>
        </ClientProviders>
      </body>
    </html>
  )
}


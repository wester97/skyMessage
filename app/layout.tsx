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

      // Apple Touch Icon for iOS home screen (required for home screen icon)
      const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
      if (!existingAppleIcon) {
        const appleIconLink = document.createElement('link')
        appleIconLink.rel = 'apple-touch-icon'
        appleIconLink.href = '/icon.png'
        document.head.appendChild(appleIconLink)
      }

      // Apple mobile web app capable (enables full-screen mode when added to home screen)
      const existingAppCapable = document.querySelector("meta[name='apple-mobile-web-app-capable']")
      if (!existingAppCapable) {
        const appCapableMeta = document.createElement('meta')
        appCapableMeta.name = 'apple-mobile-web-app-capable'
        appCapableMeta.content = 'yes'
        document.head.appendChild(appCapableMeta)
      }

      // Apple mobile web app title (name shown on home screen)
      const existingAppTitle = document.querySelector("meta[name='apple-mobile-web-app-title']")
      if (!existingAppTitle) {
        const appTitleMeta = document.createElement('meta')
        appTitleMeta.name = 'apple-mobile-web-app-title'
        appTitleMeta.content = 'SkyMessage'
        document.head.appendChild(appTitleMeta)
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


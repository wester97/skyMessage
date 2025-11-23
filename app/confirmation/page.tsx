'use client'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import ConfirmationFinder from '@/components/ConfirmationFinder'

export default function ConfirmationPage() {
  const location = useLocation()
  const pathname = location.pathname
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    // Use multiple methods to ensure logs appear
    console.log('📄 [ConfirmationPage] Component mounted')
    console.warn('📄 [ConfirmationPage] WARN: Component mounted')
    console.error('📄 [ConfirmationPage] ERROR: Component mounted (debug)')
    
    // Also log to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__CONFIRMATION_PAGE_LOADED__ = true
      console.log('📄 [ConfirmationPage] Pathname:', pathname)
      console.log('📄 [ConfirmationPage] Window location:', window.location.href)
    }
    
    setMounted(true)
    
    // Check if elements are actually in the DOM
    setTimeout(() => {
      const header = document.querySelector('[data-confirmation-header]')
      const finder = document.querySelector('[data-confirmation-finder]')
      console.log('📄 [ConfirmationPage] DOM check - Header:', !!header, 'Finder:', !!finder)
      if (!header || !finder) {
        console.error('📄 [ConfirmationPage] ERROR: Components not found in DOM!')
        // Add visible error indicator
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 10px; z-index: 9999;'
        errorDiv.textContent = 'ERROR: ConfirmationPage components not found in DOM'
        document.body.appendChild(errorDiv)
      }
    }, 100)
  }, [pathname])

  // Always log, even if component doesn't render
  if (typeof window !== 'undefined') {
    console.log('📄 [ConfirmationPage] Rendering component, mounted:', mounted)
    console.warn('📄 [ConfirmationPage] WARN: Rendering, mounted:', mounted)
  }

  if (!mounted) {
    console.log('📄 [ConfirmationPage] Not mounted yet, returning null')
    // Show loading indicator
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading Confirmation Page...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Check console for logs
        </div>
      </div>
    )
  }

  try {
    return (
      <>
        <div data-confirmation-header>
          <AppHeader />
        </div>
        <div data-confirmation-finder>
          <ConfirmationFinder />
        </div>
      </>
    )
  } catch (error) {
    console.error('📄 [ConfirmationPage] Render error:', error)
    return <div>Error loading page: {String(error)}</div>
  }
}


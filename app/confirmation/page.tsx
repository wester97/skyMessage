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
    setMounted(true)
  }, [pathname])

  if (!mounted) {
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


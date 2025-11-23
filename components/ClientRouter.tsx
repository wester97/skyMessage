'use client'

import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes'

export function ClientRouter({ children }: { children?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <BrowserRouter>
      {children || <AppRoutes />}
    </BrowserRouter>
  )
}


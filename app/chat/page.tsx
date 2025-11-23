'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import ChatInterface from '@/components/ChatInterface'

function ChatPageContent() {
  const searchParams = useSearchParams()
  const saintSlug = searchParams.get('saint')
  const shouldGreet = searchParams.get('greeting') === 'true'

  return <ChatInterface preSelectedSaint={saintSlug} autoGreeting={shouldGreet} />
}

export default function ChatPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
          <ChatPageContent />
        </Suspense>
      </div>
    </div>
  )
}


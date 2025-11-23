'use client'

import { useRouter } from 'next/navigation'
import SaintSelector from '@/components/SaintSelector'
import AppHeader from '@/components/AppHeader'
import type { Saint } from '@/lib/types'

export default function ContactsPage() {
  const router = useRouter()

  const handleSelectSaint = (saint: Saint | null) => {
    if (saint) {
      // Navigate to chat with the selected saint
      router.push(`/chat?saint=${saint.slug}`)
    }
  }

  const handleClose = () => {
    // Go back to home
    router.push('/')
  }

  return (
    <>
      <AppHeader />
      <SaintSelector
        selectedSaint={null}
        onSelectSaint={handleSelectSaint}
        fullPage={true}
        onClose={handleClose}
        showBackToChat={false}
      />
    </>
  )
}


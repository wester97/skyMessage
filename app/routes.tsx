'use client'

import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom'
import HomeScreen from '@/components/HomeScreen'
import ChatInterface from '@/components/ChatInterface'
import SaintSelector from '@/components/SaintSelector'
// Chorus uses ChatInterface with mode='general'
import CalendarListView from '@/components/CalendarListView'
import PatronagesApp from '@/components/PatronagesApp'
import GeographyApp from '@/components/GeographyApp'
import ConfirmationFinder from '@/components/ConfirmationFinder'
import SaintsWithBeardsApp from '@/components/SaintsWithBeardsApp'
import AppHeader from '@/components/AppHeader'

import type { Saint } from '@/lib/types'

function ChatInterfaceWithParams() {
  const [searchParams] = useSearchParams()
  const saintSlug = searchParams.get('saint')
  const shouldGreet = searchParams.get('greeting') === 'true'
  
  return <ChatInterface preSelectedSaint={saintSlug} autoGreeting={shouldGreet} />
}

function ContactsPageContent() {
  const navigate = useNavigate()
  
  const handleSelectSaint = (saint: Saint | null) => {
    if (saint) {
      navigate(`/chat?saint=${saint.slug}`)
    }
  }

  const handleClose = () => {
    navigate('/')
  }

  return (
    <SaintSelector
      selectedSaint={null}
      onSelectSaint={handleSelectSaint}
      fullPage={true}
      onClose={handleClose}
      showBackToChat={false}
    />
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <HomeScreen />
      } />
      <Route path="/chat" element={
        <>
          <AppHeader />
          <ChatInterfaceWithParams />
        </>
      } />
      <Route path="/contacts" element={
        <>
          <AppHeader />
          <ContactsPageContent />
        </>
      } />
      <Route path="/chorus" element={
        <>
          <AppHeader />
          <ChatInterface
            mode="general"
            title="Chorus"
            subtitle="General Saints Knowledge"
            apiEndpoint="/api/chorus/ask"
            initialGreeting="🕊️ Welcome to Chorus! Ask me anything about Catholic saints, feast days, and patronages."
            placeholder="Ask about saints..."
            quickQuestions={[
              'Who is the patron saint of travelers?',
              'What feast day is today?',
              'Who is the patron saint of lost causes?',
            ]}
            randomQuestions={[
              'Who is the patron saint of animals?',
              'When is the feast of St. Francis?',
              'Who is the patron saint of students?',
              'Tell me about St. Teresa of Calcutta',
              'Who is the patron saint of musicians?',
              'When is the feast of St. Patrick?',
            ]}
          />
        </>
      } />
      <Route path="/calendar" element={
        <>
          <AppHeader />
          <CalendarListView />
        </>
      } />
      <Route path="/patronages" element={
        <>
          <AppHeader />
          <PatronagesApp />
        </>
      } />
      <Route path="/geography" element={
        <>
          <AppHeader />
          <GeographyApp />
        </>
      } />
      <Route path="/confirmation" element={
        <>
          <AppHeader />
          <ConfirmationFinder />
        </>
      } />
      <Route path="/saints-with-beards" element={
        <>
          <AppHeader />
          <SaintsWithBeardsApp />
        </>
      } />
    </Routes>
  )
}


'use client'

import AppHeader from '@/components/AppHeader'
import ChatInterface from '@/components/ChatInterface'

export default function ChorusPage() {
  return (
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
  )
}


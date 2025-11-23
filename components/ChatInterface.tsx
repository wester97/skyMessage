'use client'

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SaintSelector from './SaintSelector'
import { askSaint } from '@/lib/api'
import { SEED_SAINTS } from '@/lib/seed'
import type { Saint, Message } from '@/lib/types'
import '../app/chat.css'

interface ChatInterfaceProps {
  mode?: 'saint' | 'general'
  title?: string
  subtitle?: string
  apiEndpoint?: string
  initialGreeting?: string
  placeholder?: string
  quickQuestions?: string[]
  randomQuestions?: string[]
  preSelectedSaint?: string | null
  autoGreeting?: boolean
}

// Helper function to format feast day (MM-DD to readable format)
function formatFeastDay(feastDay: string): string {
  const [month, day] = feastDay.split('-')
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[parseInt(month) - 1]
  
  // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const dayNum = parseInt(day)
  let suffix = 'th'
  if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st'
  else if (dayNum === 2 || dayNum === 22) suffix = 'nd'
  else if (dayNum === 3 || dayNum === 23) suffix = 'rd'
  
  return `${monthName} ${dayNum}${suffix}`
}

export default function ChatInterface({
  mode = 'saint',
  title = 'SkyMessage',
  subtitle,
  apiEndpoint,
  initialGreeting,
  placeholder = 'Message...',
  quickQuestions: customQuickQuestions,
  randomQuestions: customRandomQuestions,
  preSelectedSaint = null,
  autoGreeting = false,
}: ChatInterfaceProps = {}) {
  const navigate = useNavigate()
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWaitingForAPI, setIsWaitingForAPI] = useState(false) // For typing indicator
  const [showContactsList, setShowContactsList] = useState(false) // Don't auto-show contacts - show empty state instead
  const [showQuickQuestions, setShowQuickQuestions] = useState(false) // Quick questions menu
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const greetingSentRef = useRef(false)
  const previousSaintRef = useRef<string | null>(null)

  // Reset greeting flag when saint changes
  useEffect(() => {
    if (selectedSaint && selectedSaint.slug !== previousSaintRef.current) {
      previousSaintRef.current = selectedSaint.slug
      greetingSentRef.current = false
    }
  }, [selectedSaint])

  // Simple scroll to bottom when messages change (like ChatJP2)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }, [inputText])

  // Removed auto-focus - let user manually focus if needed

  // Initial greeting for general mode
  useEffect(() => {
    if (mode === 'general' && initialGreeting && messages.length === 0) {
      const greetingMessage: Message = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: initialGreeting,
        timestamp: new Date(),
      }
      setMessages([greetingMessage])
    }
  }, [mode, initialGreeting]) // Only run on mount

  // Handle pre-selected saint from URL
  useEffect(() => {
    if (preSelectedSaint && !selectedSaint) {
      const saint = SEED_SAINTS.find((s) => s.slug === preSelectedSaint)
      if (saint) {
        handleSelectSaint(saint)
      }
    }
  }, [preSelectedSaint]) // Only run when preSelectedSaint changes

  // Auto-send greeting message
  useEffect(() => {
    if (autoGreeting && selectedSaint && messages.length > 0 && !greetingSentRef.current) {
      // Check if today is the saint's feast day
      const today = new Date()
      const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      const isToday = selectedSaint.feastDay === todayMMDD
      
      if (!isToday) {
        // Not their feast day, skip auto-greeting
        return
      }
      
      greetingSentRef.current = true
      // Wait for initial greeting to render, then send feast day message
      setTimeout(() => {
        setInputText('Happy feast day!')
        // Trigger send after a short delay
        setTimeout(() => {
          const greetingText = 'Happy feast day!'
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: greetingText,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, userMessage])
          setInputText('')
          setIsLoading(true)
          setIsWaitingForAPI(true)

          // Send the message
          askSaint({
            text: greetingText,
            saintSlug: selectedSaint.slug,
            style: 'saint',
          })
            .then((response) => {
              setIsWaitingForAPI(false)
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.text,
                timestamp: new Date(),
                saint: response.saint,
                sources: response.sources,
              }
              setMessages((prev) => [...prev, assistantMessage])
            })
            .catch((error) => {
              console.error('Error sending greeting:', error)
              setIsWaitingForAPI(false)
              const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error.message || 'Failed to get response'}`,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, errorMessage])
            })
            .finally(() => {
              setIsLoading(false)
            })
        }, 500)
      }, 800)
    }
  }, [autoGreeting, selectedSaint, messages.length]) // Run when conditions change

  const handleSendMessage = async () => {
    // For general mode, no saint selection required
    if (!inputText.trim() || (mode === 'saint' && !selectedSaint)) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setIsWaitingForAPI(true)
    
    console.log('🔒 Input disabled - processing message')

    try {
      let response
      let useEmojiStory = false

      if (mode === 'general' && apiEndpoint) {
        // General mode - use custom API endpoint
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: inputText }),
        })
        if (!res.ok) throw new Error('Failed to get response')
        response = await res.json()
      } else {
        // Saint mode - use askSaint API
        // Check if user is asking for story - always use emoji story for saint stories
        useEmojiStory = isAskingForStory(inputText, messages)
        response = await askSaint({
          text: inputText,
          saintSlug: selectedSaint!.slug,
          style: useEmojiStory ? 'emoji-story' : 'saint',
        })
      }
      
      setIsWaitingForAPI(false)
      console.log('✅ API response received')

      // Calculate reading time based on content length
      // Below-average reading speed: ~150 words per minute = ~2.5 words per second
      // Minimum 2.5s, maximum 8s, plus base pause between messages
      const calculateReadingTime = (text: string): number => {
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
        const characterCount = text.length
        
        // Base reading time: 2.5 words per second
        const baseReadingTime = (wordCount / 2.5) * 1000 // ms
        
        // Add extra time for punctuation (pauses for periods, commas, etc.)
        const punctuationPauses = (text.match(/[.!?]/g) || []).length * 400
        
        const totalTime = baseReadingTime + punctuationPauses
        const clampedTime = Math.max(2500, Math.min(8000, totalTime))
        
        console.log(`📖 Reading time calculation:`, {
          text: text.substring(0, 60) + '...',
          wordCount,
          characterCount,
          baseReadingTime: `${baseReadingTime.toFixed(0)}ms`,
          punctuationPauses: `${punctuationPauses}ms`,
          totalTime: `${totalTime.toFixed(0)}ms`,
          clampedTime: `${clampedTime.toFixed(0)}ms (${(clampedTime/1000).toFixed(1)}s)`
        })
        
        return clampedTime
      }

      // If emoji story, animate it line by line
      if (useEmojiStory) {
        console.log('🎭 Starting emoji story mode')
        console.log('⚙️  Timing settings:', {
          readingSpeed: '2.5 words/second (150 wpm - below average)',
          minPause: '2.5s',
          maxPause: '8s',
          betweenMessages: '1.5s',
          punctuationBonus: '400ms per period/exclamation/question'
        })
        
        // Split story into paragraphs (separated by double newlines)
        const storyParts = response.text.split('\n\n').filter((part: string) => part.trim())
        console.log(`📚 Story has ${storyParts.length} parts`)
        
        // Add each part with a delay for storytelling effect
        for (let i = 0; i < storyParts.length; i++) {
          if (i > 0) {
            // Base pause between messages (independent of reading time)
            const betweenMessagePause = 1500
            console.log(`⏸️  Pause between messages: ${betweenMessagePause}ms`)
            await new Promise(resolve => setTimeout(resolve, betweenMessagePause))
          }
          
          const part = storyParts[i]
          console.log(`\n📝 Processing part ${i + 1}/${storyParts.length}:`, part.substring(0, 80))
          
          // Check if this part contains quoted dialogue (e.g., "Build my church")
          // Only match actual quote marks, not apostrophes
          const quoteMatch = part.match(/["""]([^"""]+)["""]/)
          
          if (quoteMatch) {
            console.log('💬 Part contains quoted dialogue')
            
            // Split into narrative and quote
            const beforeQuote = part.substring(0, quoteMatch.index).trim()
            const quotedText = quoteMatch[1]
            const afterQuote = part.substring((quoteMatch.index || 0) + quoteMatch[0].length).trim()
            
            // Send narrative part first (if exists)
            if (beforeQuote) {
              console.log('📤 Sending narrative before quote:', beforeQuote.substring(0, 50))
              const narrativeMessage: Message = {
                id: `${Date.now()}-part-${i}-narrative`,
                role: 'assistant',
                content: beforeQuote,
                timestamp: new Date(),
                saint: response.saint,
              }
              setMessages((prev) => [...prev, narrativeMessage])
              
              const readTime = calculateReadingTime(beforeQuote)
              console.log(`⏱️  Pausing for reading: ${(readTime/1000).toFixed(1)}s`)
              await new Promise(resolve => setTimeout(resolve, readTime))
            }
            
            // Send quoted dialogue as a "speaker" message (from right)
            console.log('💭 Sending quote from right:', quotedText)
            const quoteMessage: Message = {
              id: `${Date.now()}-part-${i}-quote`,
              role: 'speaker',
              content: quotedText,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, quoteMessage])
            
            const quoteReadTime = calculateReadingTime(quotedText)
            console.log(`⏱️  Pausing after quote: ${(quoteReadTime/1000).toFixed(1)}s`)
            
            // Send after-quote narrative (if exists)
            if (afterQuote) {
              await new Promise(resolve => setTimeout(resolve, quoteReadTime))
              console.log('📤 Sending narrative after quote:', afterQuote.substring(0, 50))
              const afterMessage: Message = {
                id: `${Date.now()}-part-${i}-after`,
                role: 'assistant',
                content: afterQuote,
                timestamp: new Date(),
                saint: response.saint,
                // Only show sources on the last part
                sources: i === storyParts.length - 1 ? response.sources : undefined,
              }
              setMessages((prev) => [...prev, afterMessage])
              
              // Wait for reading time of after-quote text
              const afterReadTime = calculateReadingTime(afterQuote)
              console.log(`⏱️  Pausing for reading after-quote: ${(afterReadTime/1000).toFixed(1)}s`)
              await new Promise(resolve => setTimeout(resolve, afterReadTime))
            } else {
              // No after-quote, just wait for quote reading time
              if (i === storyParts.length - 1) {
                // Last part, add sources to quote message
                quoteMessage.sources = response.sources
              }
              await new Promise(resolve => setTimeout(resolve, quoteReadTime))
            }
          } else {
            // No quote, send as regular narrative (emoji + text combined)
            console.log('📤 Sending regular narrative (emoji + text)')
            const partMessage: Message = {
              id: `${Date.now()}-part-${i}`,
              role: 'assistant',
              content: part,
              timestamp: new Date(),
              saint: response.saint,
              // Only show sources on the last part
              sources: i === storyParts.length - 1 ? response.sources : undefined,
            }
            
            setMessages((prev) => [...prev, partMessage])
            
            // Calculate and wait for reading time before showing next message
            const readTime = calculateReadingTime(part)
            console.log(`⏱️  Pausing for reading: ${(readTime/1000).toFixed(1)}s`)
            await new Promise(resolve => setTimeout(resolve, readTime))
          }
        }
        
        console.log('✅ Story complete!')
        
        // Add feast day message from the saint
        if (selectedSaint?.feastDay) {
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const feastDayDate = formatFeastDay(selectedSaint.feastDay)
          const feastDayMessage: Message = {
            id: `${Date.now()}-feastday`,
            role: 'assistant',
            content: `My feast day is ${feastDayDate}. 🕊️`,
            timestamp: new Date(),
            saint: response.saint,
          }
          setMessages((prev) => [...prev, feastDayMessage])
          
          // Add prayer response from "the people" (as user)
          await new Promise(resolve => setTimeout(resolve, 2000))
          const prayerMessage: Message = {
            id: `${Date.now()}-prayer`,
            role: 'user', // Show as user message
            content: `${selectedSaint.displayName}, pray for us!`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, prayerMessage])
        }
      } else {
        // Regular message - check for dialogue and split if needed
        const dialoguePattern = /(?:God|Jesus|Christ|the Lord|Mary|the Virgin|an angel|a voice)\s+(?:said|told|commanded|spoke|replied|answered)[^:]*:\s*[""]([^""]+)[""]/gi
        const matches = [...response.text.matchAll(dialoguePattern)]
        
        if (matches.length > 0) {
          // Has dialogue - split into parts
          let lastIndex = 0
          
          for (const match of matches) {
            const fullMatch = match[0]
            const quote = match[1]
            const matchIndex = match.index || 0
            
            // Send narrative before the quote
            const beforeText = response.text.substring(lastIndex, matchIndex).trim()
            if (beforeText) {
              const narrativeMessage: Message = {
                id: `${Date.now()}-narrative-${matchIndex}`,
                role: 'assistant',
                content: beforeText,
                timestamp: new Date(),
                saint: response.saint,
              }
              setMessages((prev) => [...prev, narrativeMessage])
              await new Promise(resolve => setTimeout(resolve, 800))
            }
            
            // Extract speaker name
            const speakerMatch = fullMatch.match(/(?:God|Jesus|Christ|the Lord|Mary|the Virgin|an angel|a voice)/i)
            const speaker = speakerMatch ? speakerMatch[0] : 'Speaker'
            const initial = speaker.charAt(0).toUpperCase()
            
            // Send the dialogue from the right
            const dialogueMessage: Message = {
              id: `${Date.now()}-dialogue-${matchIndex}`,
              role: 'speaker',
              content: quote,
              timestamp: new Date(),
              speaker: initial,
            }
            setMessages((prev) => [...prev, dialogueMessage])
            await new Promise(resolve => setTimeout(resolve, 1200))
            
            lastIndex = matchIndex + fullMatch.length
          }
          
          // Send any remaining text after the last quote
          const afterText = response.text.substring(lastIndex).trim()
          if (afterText) {
            const finalMessage: Message = {
              id: `${Date.now()}-final`,
              role: 'assistant',
              content: afterText,
              timestamp: new Date(),
              saint: response.saint,
              sources: response.sources,
            }
            setMessages((prev) => [...prev, finalMessage])
          }
        } else {
          // No dialogue - send as single message
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.text,
            timestamp: new Date(),
            saint: response.saint,
            sources: response.sources,
          }

          setMessages((prev) => [...prev, assistantMessage])
        }
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error)
      setIsWaitingForAPI(false)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      console.log('🔓 Input re-enabled - ready for next message')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectSaint = (saint: Saint | null) => {
    // Clear messages when switching saints
    setMessages([])
    setSelectedSaint(saint)
    setShowContactsList(false)
    if (saint) {
      // Add initial greeting from the saint
      const greetingMessage: Message = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: getGreeting(saint),
        timestamp: new Date(),
        saint: saint.displayName,
      }
      setMessages([greetingMessage])
    }
  }

  // Generate personalized greeting for each saint
  function getGreeting(saint: Saint): string {
    const greetings: Record<string, string> = {
      'francis-of-assisi': 'Peace and all good, my friend! 🕊️\n\nI am Francis of Assisi. It brings me great joy to meet you here.\n\nWould you like to hear my story?',
      'therese-of-lisieux': 'Hello, dear soul! 🌹\n\nI am Thérèse of Lisieux, the Little Flower. I am so happy to be with you today.\n\nWould you like to hear my story?',
      'augustine-of-hippo': 'Greetings, seeker of truth! ✨\n\nI am Augustine of Hippo. Our hearts are restless until they rest in God.\n\nWould you like to hear my story?',
      'teresa-of-calcutta': 'God bless you, my child! 🙏\n\nI am Mother Teresa. Do small things with great love—this is what I lived by.\n\nWould you like to hear my story?',
      'thomas-aquinas': 'Peace be with you, friend of wisdom. 📚\n\nI am Thomas Aquinas. Faith and reason are two wings that lift us to God.\n\nWould you like to hear my story?',
      'padre-pio': 'Blessings, my child! ✝️\n\nI am Padre Pio. Pray, hope, and don\'t worry!\n\nWould you like to hear my story?',
    }
    
    return greetings[saint.slug] || `Peace be with you! ✨\n\nI am ${saint.displayName}. It is a blessing to meet you.\n\nWould you like to hear my story?`
  }

  // Detect if user is asking for the saint's story
  function isAskingForStory(message: string, messageHistory: Message[]): boolean {
    const storyKeywords = [
      'your story',
      'your saint story',
      'tell me your story',
      'hear your story',
      'tell your story',
      'tell me about your life',
      'about your life',
      'your life story',
      'about yourself',
      'your journey',
    ]
    const lowerMessage = message.toLowerCase().trim()
    
    // Check for explicit story keywords
    if (storyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true
    }
    
    // Check if the last assistant message was asking about their story
    const lastAssistantMessage = [...messageHistory]
      .reverse()
      .find(msg => msg.role === 'assistant')
    
    if (lastAssistantMessage) {
      const lastMessageContent = lastAssistantMessage.content.toLowerCase()
      // Check if the last message was asking about their story/journey/life
      const isStoryPrompt = 
        lastMessageContent.includes('hear my story') ||
        lastMessageContent.includes('hear about my') ||
        lastMessageContent.includes('tell you my story') ||
        lastMessageContent.includes('tell you about my') ||
        lastMessageContent.includes('would you like to hear') ||
        lastMessageContent.includes('like to hear my story') ||
        lastMessageContent.includes('my story') ||
        lastMessageContent.includes('my journey') ||
        lastMessageContent.includes('my life') ||
        (lastMessageContent.includes('would you like') && lastMessageContent.includes('my'))
      
      if (isStoryPrompt) {
        // Check if user's response is a positive affirmation
        const positiveResponses = [
          'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 
          'please', 'tell me', 'i would', 'i\'d like', 'i want',
          'absolutely', 'definitely', 'of course', 'go ahead',
          'i do', 'i\'d love to', 'love to', 'that would be'
        ]
        const isPositiveResponse = positiveResponses.some(response => 
          lowerMessage === response || 
          lowerMessage.startsWith(response + ' ') ||
          lowerMessage.includes(' ' + response + ' ') ||
          lowerMessage.endsWith(' ' + response)
        )
        
        if (isPositiveResponse) {
          return true
        }
      }
    }
    
    return false
  }

  // Handle quick question selection
  const handleQuickQuestion = (question: string) => {
    setInputText(question)
    setShowQuickQuestions(false)
    // Removed auto-focus
  }

  // Handle random question selection
  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * randomQuestions.length)
    const randomQuestion = randomQuestions[randomIndex]
    setInputText(randomQuestion)
    setShowQuickQuestions(false)
    // Removed auto-focus
  }

  // Quick question templates (use custom or defaults)
  const quickQuestions = customQuickQuestions || [
    'Please tell me your saint story',
    'When is your feast day?',
    'What are you the patron saint of?'
  ]

  // Random questions pool (use custom or defaults)
  const randomQuestions = customRandomQuestions || [
    'How did you find your calling?',
    'What helped you in difficult times?',
    'What was the biggest challenge in your life?',
    'How did you grow closer to God?',
    'What advice would you give to someone seeking holiness?',
    'What brought you the most joy in your life?'
  ]

  // Show contacts list as full page (only in saint mode when explicitly requested)
  if (mode === 'saint' && showContactsList) {
    const hasActiveChat = messages.length > 0
    
    return (
      <SaintSelector
        selectedSaint={selectedSaint}
        onSelectSaint={handleSelectSaint}
        disabled={isLoading}
        fullPage={true}
        showBackToChat={hasActiveChat}
        onClose={() => {
          if (hasActiveChat) {
            // If there's an active chat, go back to it
            setShowContactsList(false)
          } else {
            // If no active chat, go home
            navigate('/')
          }
        }}
      />
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        {mode === 'saint' && selectedSaint ? (
          <div className="d-flex align-items-center justify-content-between">
            <button
              className="btn btn-link text-decoration-none p-0"
              onClick={() => setShowContactsList(true)}
              disabled={isLoading}
              style={{ fontSize: '17px', color: '#007aff' }}
            >
              <i className="fas fa-chevron-left me-2"></i>
              All Saints
            </button>
            <h6 className="mb-0" style={{ fontWeight: 600, fontSize: '17px' }}>
              {selectedSaint.displayName}
            </h6>
            <div style={{ width: '100px' }}></div> {/* Spacer for centering */}
          </div>
        ) : (
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>{title}</h3>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8e8e93' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && mode === 'saint' && !selectedSaint ? (
          // Empty state: No saint selected and no messages
          <div className="text-center" style={{ marginTop: '120px', padding: '0 20px' }}>
            <i className="fas fa-dove" style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.3, color: '#667eea' }}></i>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
              Welcome to SkyMessage
            </h3>
            <p style={{ fontSize: '1rem', color: '#8e8e93', marginBottom: '2rem' }}>
              Chat with Catholic saints and learn about their lives
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px', margin: '0 auto' }}>
              <button
                className="btn"
                onClick={() => setShowContactsList(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                <i className="fas fa-address-book me-2"></i>
                Browse All Saints
              </button>
              <button
                className="btn"
                onClick={() => {
                  // Select a random saint
                  const randomIndex = Math.floor(Math.random() * SEED_SAINTS.length)
                  const randomSaint = SEED_SAINTS[randomIndex]
                  handleSelectSaint(randomSaint)
                }}
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                <i className="fas fa-random me-2"></i>
                Random Saint
              </button>
            </div>
          </div>
        ) : messages.length === 0 && mode === 'saint' && selectedSaint ? (
          // Saint selected but no messages yet
          <div className="text-center text-muted" style={{ marginTop: '100px' }}>
            <i className="fas fa-dove" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
            <p style={{ fontSize: '1.1rem', color: '#8e8e93' }}>
              Ask {selectedSaint.displayName} a question
            </p>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.role === 'user' 
                    ? 'user-message' 
                    : message.role === 'speaker'
                    ? 'speaker-message'
                    : 'saint-message'
                }`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <i className="fas fa-user"></i>
                  ) : message.role === 'speaker' ? (
                    message.speaker || 'G'
                  ) : (
                    <i className="fas fa-dove"></i>
                  )}
                </div>
                <div className="message-content">
                  <div className={`message-text ${/^[\p{Emoji}\s]+$/u.test(message.content) ? 'emoji-only' : ''}`}>
                    {(() => {
                      // Check if content starts with emojis
                      const emojiMatch = message.content.match(/^([\p{Emoji}\s]+)/u)
                      if (emojiMatch && message.role === 'assistant') {
                        const emoji = emojiMatch[1].trim()
                        const text = message.content.substring(emojiMatch[0].length).trim()
                        return (
                          <div style={{ whiteSpace: 'pre-wrap' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', lineHeight: '1.2', marginBottom: '8px' }}>
                              {emoji}
                            </span>
                            {text}
                          </div>
                        )
                      }
                      return <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    })()}
                    {message.sources && message.sources.length > 0 && (
                      <div className="source-badges">
                        {message.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-badge"
                          >
                            <i className="fas fa-link" style={{ fontSize: '9px' }}></i>
                            {source.publisher || 'Source'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isWaitingForAPI && (
              <div className="message saint-message">
                <div className="message-avatar">
                  <i className="fas fa-dove"></i>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : null}
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <button
            className="quick-questions-btn"
            onClick={() => setShowQuickQuestions(!showQuickQuestions)}
            disabled={isLoading}
            title="Quick questions"
          >
            <i className="fas fa-plus"></i>
          </button>
          
          {showQuickQuestions && (
            <div className="quick-questions-menu">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-item"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
              <button
                className="quick-question-item random-question-item"
                onClick={handleRandomQuestion}
              >
                <i className="fas fa-bolt" style={{ marginRight: '8px', color: '#FFD700' }}></i>
                Ask a random question
              </button>
            </div>
          )}
          
          <div className="input-group">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={isLoading ? "Please wait..." : placeholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              rows={1}
              style={isLoading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            />
          </div>
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            title={isLoading ? "Story in progress..." : "Send"}
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
  )
}


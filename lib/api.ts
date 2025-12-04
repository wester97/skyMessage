import type { AskSaintRequest, AskSaintResponse } from './types'

// Firebase Functions v2 uses Cloud Run URLs
const ASK_SKY_URL = process.env.NEXT_PUBLIC_ASK_SKY_URL || 'https://asksky-url7abqc5a-uc.a.run.app'
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-ask-sky-message.cloudfunctions.net'
const USE_MOCK = false // Backend is now live!

// Mock responses for testing
function getMockResponse(request: AskSaintRequest): AskSaintResponse {
  const { text, saintSlug, style } = request
  
  const saintNames: Record<string, string> = {
    'francis-of-assisi': 'St. Francis of Assisi',
    'therese-of-lisieux': 'St. Thérèse of Lisieux',
    'augustine-of-hippo': 'St. Augustine of Hippo',
    'teresa-of-calcutta': 'St. Teresa of Calcutta',
  }
  
  const saintName = saintNames[saintSlug || ''] || 'The Saint'
  
  if (style === 'emoji-story') {
    const stories: Record<string, string> = {
      'francis-of-assisi': `🏰 I was born in 1181 in Assisi, Italy, to a wealthy merchant family\n\n💰 As a young man, I loved parties, fancy clothes, and dreams of becoming a knight ⚔️\n\n🤒 But war and illness changed everything. I was captured, imprisoned, and came home very sick\n\n⛪ One day, praying in a ruined chapel, I heard Christ say: "Francis, rebuild my church" 🙏\n\n👕 I gave up everything! Literally took off my fine clothes in the town square and gave them back to my father 😮\n\n🐦 I began living with the poor, caring for lepers, and preaching God's love to all creatures\n\n👥 Others joined me! We became the Franciscan Order, living in poverty but rich in joy 🎉\n\n✨ In 1224, I received the stigmata - the wounds of Christ on my body\n\n🕊️ I died in 1226, but my love for all of God's creation lives on!\n\nRemember what I always said: "Preach the Gospel at all times. When necessary, use words!" ❤️`,
      
      'therese-of-lisieux': `🏡 Born in 1873 in France, I was the youngest of five sisters\n\n😢 My mother died when I was only 4 years old. My childhood was marked by sensitivity and tears\n\n🌹 But I had a deep desire to love Jesus! At 15, I entered the Carmelite convent\n\n✨ I discovered my "Little Way" - doing small things with GREAT love 💕\n\n🌸 I didn't perform miracles or grand deeds. I simply loved Jesus in the ordinary moments\n\n📝 I wrote my autobiography "Story of a Soul" - it became one of the most beloved spiritual books!\n\n💐 I called myself a "little flower" in God's garden. Every flower is beautiful to Him!\n\n😷 At 24, I became very ill with tuberculosis\n\n🙏 Before I died, I promised: "I will spend my heaven doing good on earth. I will let fall a shower of roses!"\n\n☁️ I died in 1897, but my Little Way has touched millions of hearts!\n\nConfidence and love - this is my way! 💖`,
      
      'augustine-of-hippo': `📚 Born in 354 AD in North Africa, I was intellectually brilliant but spiritually lost\n\n🎭 My youth? Wine, women, and philosophy! I lived for pleasure and pride\n\n😭 But my mother Monica prayed for me CONSTANTLY. She never gave up! 🙏\n\n🤔 I searched for truth in every philosophy, but nothing satisfied my restless heart\n\n🌳 Then, in a Milan garden in 386, I heard a child's voice: "Take and read! Take and read!"\n\n📖 I opened Paul's letters randomly and read: "Put on the Lord Jesus Christ..."\n\n💥 BOOM! My heart broke open. Everything changed in that moment!\n\n✝️ I was baptized at age 32 and became a priest, then Bishop of Hippo\n\n✍️ I wrote "Confessions" and "City of God" - they're still read 1600 years later!\n\n💭 My famous prayer: "Our hearts are restless until they rest in You, O Lord"\n\n⚡ I died in 430 AD as invaders besieged my city, but I had found my rest in God\n\nTruth is truth, wherever it is found! 🌟`,
    }
    
    return {
      text: stories[saintSlug || ''] || `This is where ${saintName} would tell their life story with emojis! 📖✨`,
      sources: [
        { publisher: 'Demo Mode', url: '#' }
      ],
      saint: saintName,
    }
  }
  
  // Regular saint mode
  const responses: Record<string, string> = {
    'prayer': `My dear friend, prayer is simply conversation with God. Speak to Him as you would to a loving parent. Share your joys, your sorrows, your hopes, and your fears. He listens with infinite love.`,
    'help': `I understand that you're seeking guidance. Remember that God works through the ordinary moments of life. Look for His presence in the small things, in acts of kindness, and in the love of those around you.`,
    'default': `Thank you for your question. While I don't have specific historical context loaded right now (the backend is in demo mode), I can tell you that my life was devoted to serving God and following Christ's example. What specifically would you like to know?`
  }
  
  const lowerText = text.toLowerCase()
  let responseText = responses.default
  
  if (lowerText.includes('pray') || lowerText.includes('prayer')) {
    responseText = responses.prayer
  } else if (lowerText.includes('help') || lowerText.includes('how')) {
    responseText = responses.help
  }
  
  return {
    text: `[DEMO MODE] ${responseText}`,
    sources: [
      { publisher: 'Demo Mode - Deploy backend for real responses', url: '#' }
    ],
    saint: saintName,
  }
}

export async function askSaint(request: AskSaintRequest): Promise<AskSaintResponse> {
  // Use mock data if backend not deployed
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    return getMockResponse(request)
  }
  
  // Real API call - use v2 Cloud Run URL
  const response = await fetch(ASK_SKY_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: request.text,
      saintSlug: request.saintSlug,
      style: request.style,
      audience: request.audience,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return await response.json()
}

export async function ingestSaintContent(saintSlug: string) {
  const response = await fetch(`${FUNCTIONS_URL}/ingestSaint?saintSlug=${encodeURIComponent(saintSlug)}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return await response.json()
}

export async function matchSaints(request: import('./types').MatchSaintsRequest): Promise<import('./types').MatchSaintsResponse> {
  // Firebase Functions v2 uses Cloud Run URLs
  const cloudRunUrl = 'https://matchsaints-url7abqc5a-uc.a.run.app'
  
  console.log('[API] Calling matchSaints with:', { traits: request.traits, gender: request.gender })
  console.log('[API] Using Cloud Run URL:', cloudRunUrl)
  
  const response = await fetch(cloudRunUrl, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      traits: request.traits,
      gender: request.gender,
    }),
  })

  console.log('[API] Response status:', response.status)
  console.log('[API] Response ok:', response.ok)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[API] Error response:', errorText)
    let error
    try {
      error = JSON.parse(errorText)
    } catch {
      error = { error: errorText || 'Unknown error' }
    }
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  const data = await response.json()
  console.log('[API] Success response:', data)
  return data
}


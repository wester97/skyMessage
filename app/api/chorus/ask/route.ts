import { NextRequest, NextResponse } from 'next/server'
import type { Saint } from '@/lib/types'
import { SEED_SAINTS } from '@/lib/seed'

const USE_MOCK = false
const FUNCTIONS_URL = 'https://us-central1-st-ann-ai.cloudfunctions.net/askChorus'
const SAINTS_API_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL 
  ? `${process.env.NEXT_PUBLIC_FUNCTIONS_URL}/api/saints`
  : 'https://us-central1-ask-sky-message.cloudfunctions.net/api/saints'

// Helper function to detect saint mentions in text
function detectSaintInText(text: string, saints: Saint[]): Saint | null {
  const lowerText = text.toLowerCase()
  
  // Check each saint
  for (const saint of saints) {
    // Check display name (e.g., "St. Francis of Assisi")
    const displayNameLower = saint.displayName.toLowerCase()
    const nameWithoutPrefix = displayNameLower.replace(/^(st\.?\s+|saint\s+)/i, '')
    
    // Check if text contains the saint's name
    if (lowerText.includes(displayNameLower) || lowerText.includes(nameWithoutPrefix)) {
      return saint
    }
    
    // Check slug (e.g., "francis-of-assisi")
    if (saint.slug && lowerText.includes(saint.slug.replace(/-/g, ' '))) {
      return saint
    }
    
    // Check aliases
    if (saint.aliases) {
      for (const alias of saint.aliases) {
        const aliasLower = alias.toLowerCase()
        if (lowerText.includes(aliasLower)) {
          return saint
        }
      }
    }
  }
  
  return null
}

// Helper function to detect saint by patronage (e.g., "patron saint of travel")
function detectSaintByPatronage(query: string, responseText: string, saints: Saint[]): Saint | null {
  const lowerQuery = query.toLowerCase()
  const lowerResponse = responseText.toLowerCase()
  const combinedText = `${lowerQuery} ${lowerResponse}`.toLowerCase()
  
  // Check each saint's patronages against the query/response
  for (const saint of saints) {
    if (saint.patronages && saint.patronages.length > 0) {
      // Check if any patronage keyword appears in the query or response
      const matchingPatronage = saint.patronages.find(patronage => {
        const patronageLower = patronage.toLowerCase()
        // Check if the patronage word appears in the text
        return combinedText.includes(patronageLower) || 
               combinedText.includes(patronageLower.replace(/s$/, '')) // Handle plural/singular
      })
      
      if (matchingPatronage) {
        console.log(`[Chorus API] Found ${saint.displayName} by patronage: ${matchingPatronage}`)
        return saint
      }
    }
  }
  
  // Fallback: Check for common keywords
  const travelKeywords = ['travel', 'traveler', 'travelers', 'journey', 'journeys', 'trip', 'trips', 'motorist', 'motorists', 'sailor', 'sailors']
  const isTravelQuery = travelKeywords.some(kw => combinedText.includes(kw))
  
  if (isTravelQuery) {
    // Look for St. Christopher (patron of travelers)
    const christopher = saints.find(s => 
      s.slug === 'christopher' || 
      s.displayName.toLowerCase().includes('christopher')
    )
    if (christopher) {
      console.log(`[Chorus API] Found St. Christopher by travel keyword`)
      return christopher
    }
  }
  
  // Try to find saint mentioned in response text
  // Look for patterns like "St. [Name] is the patron saint" or "St. [Name]" or "Saint [Name]"
  const patronPatterns = [
    /(?:st\.?|saint)\s+([a-z]+(?:\s+(?:of\s+)?[a-z]+)*)/gi,
    /([A-Z][a-z]+(?:\s+(?:of\s+)?[A-Z][a-z]+)*)\s+is\s+(?:the\s+)?patron/gi,
  ]
  
  for (const pattern of patronPatterns) {
    const matches = [...responseText.matchAll(pattern)]
    for (const match of matches) {
      const saintName = match[1].toLowerCase()
      const found = saints.find(s => {
        const displayLower = s.displayName.toLowerCase()
        const nameParts = saintName.split(/\s+/)
        // Check if any part of the name matches
        return nameParts.some(part => 
          displayLower.includes(part) && part.length > 2
        ) || s.slug === saintName.replace(/\s+/g, '-')
      })
      if (found) {
        console.log(`[Chorus API] Found saint by pattern match: ${found.displayName}`)
        return found
      }
    }
  }
  
  // Also check if response mentions a saint by checking all saints' names
  for (const saint of saints) {
    const displayLower = saint.displayName.toLowerCase()
    const nameWithoutPrefix = displayLower.replace(/^(st\.?\s+|saint\s+)/i, '')
    
    // Check if response contains the saint's name
    if (lowerResponse.includes(displayLower) || lowerResponse.includes(nameWithoutPrefix)) {
      console.log(`[Chorus API] Found saint in response: ${saint.displayName}`)
      return saint
    }
  }
  
  return null
}

// Fetch all saints for detection
async function fetchSaints(): Promise<Saint[]> {
  try {
    // Try to fetch from API first
    const response = await fetch(`${SAINTS_API_URL}?limit=500`, {
      cache: 'no-store'
    })
    
    // Check if response is JSON (not HTML error page)
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      
      if (data.success && data.data) {
        // Convert API format to Saint type
        const apiSaints = data.data.map((s: any) => ({
          slug: s.slug || s.id,
          displayName: s.display_name || s.displayName,
          aliases: s.aliases || [],
          era: s.era || undefined,
          feastDay: s.feast_day || s.feastDay || undefined,
          patronages: s.patronages || [],
          birthDate: s.birth_date || s.birthDate || undefined,
          deathDate: s.death_date || s.deathDate || undefined,
          birthPlace: s.birth_place || s.birthPlace || undefined,
          imageUrl: s.image_url || s.imageUrl || undefined,
          hasBeard: s.has_beard || s.hasBeard || undefined,
        }))
        console.log(`[Chorus API] Fetched ${apiSaints.length} saints from API`)
        return apiSaints
      }
    }
    
    // If API fails, fall back to seed data
    console.log('[Chorus API] API unavailable, using seed data')
    return SEED_SAINTS
  } catch (error) {
    console.error('[Chorus API] Error fetching saints from API, using seed data:', error)
    // Fall back to seed data
    return SEED_SAINTS
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query = body.query || body.text || ''
    
    // Validate query is a non-empty string
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }
    
    console.log('[Chorus API] Received query:', query.substring(0, 100))

    if (USE_MOCK) {
      // Mock response for development
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      return NextResponse.json({
        text: "St. Christopher is traditionally known as the patron saint of travelers. According to legend, he carried a child across a river who revealed himself to be Christ. His feast day is July 25th.",
        sources: [
          { publisher: 'New Advent', url: 'https://www.newadvent.org' },
        ],
      })
    }

    // Prepare request body - ensure query is a clean string
    // Some backends may validate string patterns (e.g., no control characters)
    // Remove control characters and normalize whitespace
    const cleanQuery = query.trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim()
    
    const requestBody = {
      query: cleanQuery,
      // Include original body fields in case backend expects them
      ...(body.text && { text: body.text }),
      ...(body.saintSlug && { saintSlug: body.saintSlug }),
    }
    
    console.log('[Chorus API] Sending request body:', { query: cleanQuery.substring(0, 50) + '...' })

    const response = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `Backend error: ${response.status}`
      let errorDetails: any = {}
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
        errorDetails = errorData
        console.error('[Chorus API] Backend error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestBody: { query: cleanQuery.substring(0, 100) }
        })
      } catch (e) {
        const errorText = await response.text()
        console.error('[Chorus API] Backend error text:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          requestBody: { query: cleanQuery.substring(0, 100) }
        })
        errorMessage = errorText || errorMessage
      }
      
      // If the error is "string did not match input format", provide more context
      if (errorMessage.includes('string did not match input format') || 
          errorMessage.includes('did not match input format')) {
        console.error('[Chorus API] Format validation error detected. Query that failed:', cleanQuery)
        console.error('[Chorus API] Query length:', cleanQuery.length)
        console.error('[Chorus API] Query contains special chars:', /[^\x20-\x7E]/.test(cleanQuery))
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Remove any [Publisher] source appendages from anywhere in the text
    // Sources should only appear in the sources array, not in the text
    if (data.text) {
      // Remove [Publisher] patterns anywhere in the text (not just at the end)
      // This handles cases like: "text [New Advent] more text" or "text [New Advent]"
      data.text = data.text.replace(/\s*\[[^\]]+\]\s*/g, ' ').trim()
      // Clean up any double spaces or multiple spaces
      data.text = data.text.replace(/\s+/g, ' ')
      // Remove any trailing spaces or punctuation issues
      data.text = data.text.replace(/\s+([.,!?])/g, '$1')
    }
    
    // Detect if the question or response is about a specific saint
    const saints = await fetchSaints()
    console.log(`[Chorus API] Detecting saint for query: "${query}"`)
    console.log(`[Chorus API] Response text preview: "${(data.text || '').substring(0, 100)}..."`)
    
    // First, try to detect from the response text (the answer might mention the saint)
    let detectedSaint = detectSaintInText(data.text || '', saints)
    console.log(`[Chorus API] Detection from response text:`, detectedSaint?.displayName || 'none')
    
    // If not found in response, try the query
    if (!detectedSaint) {
      detectedSaint = detectSaintInText(query, saints)
      console.log(`[Chorus API] Detection from query:`, detectedSaint?.displayName || 'none')
    }
    
    // If still not found and question is about patronages, try matching by patronage
    if (!detectedSaint && (query.toLowerCase().includes('patron') || query.toLowerCase().includes('patronage'))) {
      detectedSaint = detectSaintByPatronage(query, data.text || '', saints)
      console.log(`[Chorus API] Detection by patronage:`, detectedSaint?.displayName || 'none')
    }
    
    // If a saint was detected, add contact info to the response
    if (detectedSaint) {
      console.log(`[Chorus API] ✅ Saint detected: ${detectedSaint.displayName} (${detectedSaint.slug})`)
      data.contactCard = {
        slug: detectedSaint.slug,
        displayName: detectedSaint.displayName,
        aliases: detectedSaint.aliases,
        era: detectedSaint.era,
        feastDay: detectedSaint.feastDay,
        patronages: detectedSaint.patronages,
        birthDate: detectedSaint.birthDate,
        deathDate: detectedSaint.deathDate,
        birthPlace: detectedSaint.birthPlace,
        imageUrl: detectedSaint.imageUrl,
        hasBeard: detectedSaint.hasBeard,
      }
    } else {
      console.log(`[Chorus API] ❌ No saint detected`)
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Chorus API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}


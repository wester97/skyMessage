import { NextRequest, NextResponse } from 'next/server'

const USE_MOCK = false
const FUNCTIONS_URL = 'https://us-central1-st-ann-ai.cloudfunctions.net/askChorus'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (USE_MOCK) {
      // Mock response for development
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      return NextResponse.json({
        text: "St. Christopher is traditionally known as the patron saint of travelers. According to legend, he carried a child across a river who revealed himself to be Christ. His feast day is July 25th. [New Advent]",
        sources: [
          { publisher: 'New Advent', url: 'https://www.newadvent.org', saint: 'St. Christopher' },
        ],
      })
    }

    const response = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Chorus API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}


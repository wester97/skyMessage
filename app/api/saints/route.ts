import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

// Initialize Firebase if not already initialized
let app
if (getApps().length === 0) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ask-sky-message',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Convert Firestore document to Saint format
function docToSaint(doc: any): any {
  const data = doc.data()
  return {
    slug: doc.id,
    display_name: data.display_name || data.displayName || '',
    aliases: data.aliases || [],
    era: data.era || undefined,
    feast_day: data.feast_day || data.feastDay || undefined,
    patronages: data.patronages || [],
    birth_date: data.birth_date || data.birthDate || undefined,
    death_date: data.death_date || data.deathDate || undefined,
    birth_place: data.birth_place || data.birthPlace || undefined,
    image_url: data.image_url || data.imageUrl || undefined,
    has_beard: data.has_beard || data.hasBeard || undefined,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '500')
    const search = searchParams.get('search') || ''

    console.log('[Saints API] Fetching saints from Firestore...')
    const db = getFirestore(app)
    const saintsRef = collection(db, 'saints')
    
    // Get all saints
    const q = query(saintsRef, orderBy('display_name', 'asc'))
    const snapshot = await getDocs(q)
    let allSaints = snapshot.docs.map(doc => docToSaint(doc))
    
    console.log(`[Saints API] Fetched ${allSaints.length} saints from Firestore`)
    
    // Log December saints for debugging
    const decSaints = allSaints.filter(s => s.feast_day && s.feast_day.startsWith('12-'))
    console.log(`[Saints API] December saints:`, decSaints.map(s => `${s.feast_day} - ${s.display_name}`))
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      allSaints = allSaints.filter(saint => 
        (saint.display_name && saint.display_name.toLowerCase().includes(searchLower)) ||
        (saint.slug && saint.slug.toLowerCase().includes(searchLower))
      )
    }
    
    const total = allSaints.length
    
    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedSaints = allSaints.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      data: paginatedSaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Saints API] Error fetching saints:', error)
    console.error('[Saints API] Error stack:', error.stack)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch saints',
        message: error.message
      },
      { status: 500 }
    )
  }
}


/**
 * Custom hook to fetch saints from Firestore
 * Replaces SEED_SAINTS usage throughout the app
 */

import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import type { Saint } from './types'
import { SEED_SAINTS } from './seed' // Fallback only

export function useSaints() {
  const [saints, setSaints] = useState<Saint[]>(SEED_SAINTS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchSaints = async () => {
      try {
        setIsLoading(true)
        console.log('[useSaints] Fetching saints from Firestore...')
        
        const saintsRef = collection(db, 'saints')
        const q = query(saintsRef, orderBy('display_name', 'asc'))
        const snapshot = await getDocs(q)
        
        const firestoreSaints: Saint[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            slug: doc.id,
            displayName: data.display_name || data.displayName || '',
            aliases: data.aliases || [],
            era: data.era || undefined,
            feastDay: data.feast_day || data.feastDay || undefined,
            patronages: data.patronages || [],
            birthDate: data.birth_date || data.birthDate || undefined,
            deathDate: data.death_date || data.deathDate || undefined,
            birthPlace: data.birth_place || data.birthPlace || undefined,
            imageUrl: data.image_url || data.imageUrl || undefined,
            hasBeard: data.has_beard || data.hasBeard || undefined,
          }
        })
        
        console.log(`[useSaints] Loaded ${firestoreSaints.length} saints from Firestore`)
        const decSaints = firestoreSaints.filter(s => s.feastDay && s.feastDay.startsWith('12-'))
        console.log(`[useSaints] December saints loaded:`, decSaints.map(s => `${s.feastDay} - ${s.displayName}`))
        
        setSaints(firestoreSaints)
        setIsLoading(false)
      } catch (err) {
        console.error('[useSaints] Error fetching saints from Firestore, using seed data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch saints'))
        // Fall back to seed data
        console.log('[useSaints] Using seed data as fallback')
        setSaints(SEED_SAINTS)
        setIsLoading(false)
      }
    }

    fetchSaints()
  }, [])

  return { saints, isLoading, error }
}


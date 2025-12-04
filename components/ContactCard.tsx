'use client'

import { useState } from 'react'
import type { Saint } from '@/lib/types'
import styles from './ContactCard.module.css'

interface ContactCardProps {
  saint: Saint
  onOpenCard?: (saint: Saint) => void
}

// Get initials from display name (e.g., "St. Francis of Assisi" -> "FA")
function getInitials(displayName: string): string {
  // Remove "St.", "St", and common prefixes
  const cleaned = displayName
    .replace(/^St\.?\s+/i, '')
    .replace(/^Saint\s+/i, '')
    .trim()
  
  // Split by spaces and get first letter of each word
  const words = cleaned.split(/\s+/)
  if (words.length === 0) return '?'
  
  // If only one word, take first two letters
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  
  // Take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase()
}

export default function ContactCard({ saint, onOpenCard }: ContactCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const initials = getInitials(saint.displayName)
  
  const handleClick = () => {
    if (onOpenCard) {
      onOpenCard(saint)
    } else {
      // Fallback: navigate to chat if no handler provided
      window.location.href = `/chat?saint=${saint.slug}`
    }
  }
  
  return (
    <div className={styles.contactCard} onClick={handleClick}>
      <div className={styles.avatar}>
        {saint.imageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className={styles.initialsPlaceholder}>
                {initials}
              </div>
            )}
            <img
              src={saint.imageUrl}
              alt={saint.displayName}
              className={styles.avatarImage}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          </>
        ) : (
          <div className={styles.initialsPlaceholder}>
            {initials}
          </div>
        )}
      </div>
      <div className={styles.name}>{saint.displayName}</div>
    </div>
  )
}


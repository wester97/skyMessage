'use client'

import { useState } from 'react'
import { SEED_SAINTS } from '@/lib/seed'
import { Link } from 'react-router-dom'
import styles from './SaintsWithBeardsApp.module.css'
import type { Saint } from '@/lib/types'

export default function SaintsWithBeardsApp() {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter saints with beards
  const saintsWithBeards = SEED_SAINTS.filter(saint => saint.hasBeard === true)

  // Filter by search term
  const filteredSaints = saintsWithBeards.filter((saint) => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      saint.displayName.toLowerCase().includes(searchLower) ||
      saint.era?.toLowerCase().includes(searchLower) ||
      saint.patronages?.some(p => p.toLowerCase().includes(searchLower))
    )
  })

  // Group by first letter
  const groupedSaints: Record<string, Saint[]> = {}
  filteredSaints.forEach(saint => {
    const firstLetter = saint.displayName.replace('St. ', '')[0].toUpperCase()
    if (!groupedSaints[firstLetter]) {
      groupedSaints[firstLetter] = []
    }
    groupedSaints[firstLetter].push(saint)
  })

  // Sort within each group
  Object.keys(groupedSaints).forEach(letter => {
    groupedSaints[letter].sort((a, b) => a.displayName.localeCompare(b.displayName))
  })

  const sortedLetters = Object.keys(groupedSaints).sort()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <i className="fas fa-user-circle"></i> Bearded Brothers
        </h1>
        <p className={styles.subtitle}>
          {saintsWithBeards.length} {saintsWithBeards.length === 1 ? 'saint' : 'saints'} with beards
        </p>
      </div>

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search saints with beards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Saints List */}
      <div className={styles.saintsList}>
        {filteredSaints.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-search fa-2x"></i>
            <p>No saints found matching "{searchTerm}"</p>
          </div>
        ) : (
          sortedLetters.map((letter) => (
            <div key={letter} className={styles.group}>
              <div className={styles.groupHeader}>{letter}</div>
              {groupedSaints[letter].map((saint) => (
                <Link
                  key={saint.slug}
                  to={`/chat?saint=${saint.slug}`}
                  className={styles.saintItem}
                >
                  <div className={styles.saintAvatar}>
                    {saint.imageUrl ? (
                      <img 
                        src={saint.imageUrl} 
                        alt={saint.displayName}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <i className="fas fa-user-circle fa-2x"></i>
                    )}
                  </div>
                  <div className={styles.saintInfo}>
                    <div className={styles.saintName}>{saint.displayName}</div>
                    <div className={styles.saintDetails}>
                      {saint.era && <span>{saint.era}</span>}
                      {saint.patronages && saint.patronages.length > 0 && (
                        <span className={styles.patronages}>
                          {saint.patronages.slice(0, 2).join(', ')}
                          {saint.patronages.length > 2 && '...'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.saintAction}>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </Link>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}


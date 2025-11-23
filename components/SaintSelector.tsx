'use client'

import { useState, useRef } from 'react'
import { Form, Badge, ListGroup, InputGroup } from 'react-bootstrap'
import { SEED_SAINTS } from '@/lib/seed'
import type { Saint } from '@/lib/types'
import { useFavorites } from '@/contexts/FavoritesContext'
import SaintCard from './SaintCard'
import styles from './SaintSelector.module.css'

interface SaintSelectorProps {
  selectedSaint: Saint | null
  onSelectSaint: (saint: Saint | null) => void
  disabled?: boolean
  fullPage?: boolean
  onClose?: () => void
  showBackToChat?: boolean // Show "Back to Chat" vs "Home"
}

// Group saints by first letter for contacts-style display
function groupSaintsByLetter(saints: Saint[]) {
  const groups: Record<string, Saint[]> = {}
  
  saints.forEach((saint) => {
    const firstLetter = saint.displayName.replace('St. ', '')[0].toUpperCase()
    if (!groups[firstLetter]) {
      groups[firstLetter] = []
    }
    groups[firstLetter].push(saint)
  })
  
  // Sort within each group
  Object.keys(groups).forEach((letter) => {
    groups[letter].sort((a, b) => a.displayName.localeCompare(b.displayName))
  })
  
  return groups
}

export default function SaintSelector({ 
  selectedSaint, 
  onSelectSaint, 
  disabled = false,
  fullPage = false,
  onClose,
  showBackToChat = false
}: SaintSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [cardSaint, setCardSaint] = useState<Saint | null>(null)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isFavorite } = useFavorites()

  // Filter saints based on search term and favorites filter
  const filteredSaints = SEED_SAINTS.filter((saint) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      saint.displayName.toLowerCase().includes(searchLower) ||
      saint.era?.toLowerCase().includes(searchLower)
    
    const matchesFavorites = !showOnlyFavorites || isFavorite(saint.slug)
    
    return matchesSearch && matchesFavorites
  })
  
  // Group filtered saints by letter
  const saintGroups = groupSaintsByLetter(filteredSaints)

  const handleSaintClick = (saint: Saint) => {
    setCardSaint(saint)
    setShowCard(true)
  }

  const handleStartChat = () => {
    if (cardSaint) {
      onSelectSaint(cardSaint)
      setSearchTerm('')
      setShowCard(false)
      setCardSaint(null)
    }
  }

  const handleCloseCard = () => {
    setShowCard(false)
    setCardSaint(null)
  }

  // If in full-page mode, render the contacts list
  if (fullPage) {
    return (
      <div className={styles.contactsListPage}>
        <div className={styles.contactsHeader}>
          <button
            className="btn btn-link text-decoration-none p-0"
            onClick={onClose}
            style={{ fontSize: '17px', color: '#007aff' }}
          >
            <i className="fas fa-chevron-left me-2"></i>
            {showBackToChat ? 'Back to Chat' : 'Home'}
          </button>
          <h6 className="mb-0" style={{ fontWeight: 600, fontSize: '17px' }}>
            Select a Saint
          </h6>
          <div style={{ width: '100px' }}></div> {/* Spacer for centering */}
        </div>

        <div className={styles.searchHeader}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              className={`${styles.filterButton} ${showOnlyFavorites ? styles.filterActive : ''}`}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              title={showOnlyFavorites ? "Show all saints" : "Show only favorites"}
            >
              <i className={showOnlyFavorites ? "fas fa-star" : "far fa-star"}></i>
            </button>
            <InputGroup style={{ flex: 1 }}>
              <InputGroup.Text>
                <i className="fas fa-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search saints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  className="btn btn-link text-muted"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </InputGroup>
          </div>
        </div>

        <div className={styles.contactsBody}>
          {Object.keys(saintGroups).length === 0 ? (
            <div className="text-center text-muted p-4">
              <i className={showOnlyFavorites ? "fas fa-star fa-2x mb-2" : "fas fa-search fa-2x mb-2"}></i>
              <p>{showOnlyFavorites ? "No favorite saints yet" : "No saints found"}</p>
              {showOnlyFavorites && (
                <small className="d-block mt-2">
                  Tap the star on a saint's contact card to add them to favorites
                </small>
              )}
            </div>
          ) : (
            Object.keys(saintGroups)
              .sort()
              .map((letter) => (
                <div key={letter} className={styles.contactGroup}>
                  <div className={styles.groupHeader}>{letter}</div>
                  {saintGroups[letter].map((saint) => (
                    <div
                      key={saint.slug}
                      className={styles.contactItem}
                      onClick={() => handleSaintClick(saint)}
                    >
                      <div className={styles.contactAvatar}>
                        {saint.imageUrl ? (
                          <img 
                            src={saint.imageUrl} 
                            alt={saint.displayName}
                            className={styles.avatarImage}
                          />
                        ) : (
                          <i className="fas fa-user-circle fa-2x text-secondary"></i>
                        )}
                        {isFavorite(saint.slug) && (
                          <div className={styles.favoriteBadge}>
                            <i className="fas fa-star"></i>
                          </div>
                        )}
                      </div>
                      <div className={styles.contactInfo}>
                        <div className={styles.contactName}>{saint.displayName}</div>
                        <div className={styles.contactDetails}>
                          {saint.era}
                          {saint.aliases && saint.aliases.length > 0 && (
                            <span className="text-muted"> • {saint.aliases[0]}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.contactAction}>
                        <i className="fas fa-chevron-right text-muted"></i>
                      </div>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>

        {showCard && cardSaint && (
          <SaintCard
            saint={cardSaint}
            onStartChat={handleStartChat}
            onClose={handleCloseCard}
          />
        )}
      </div>
    )
  }

  // If not in full-page mode, return null (we only use full-page mode now)
  return null
}

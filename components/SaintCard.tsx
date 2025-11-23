'use client'

import type { Saint } from '@/lib/types'
import { useFavorites } from '@/contexts/FavoritesContext'
import styles from './SaintCard.module.css'

interface SaintCardProps {
  saint: Saint
  onStartChat: () => void
  onClose: () => void
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

export default function SaintCard({ saint, onStartChat, onClose }: SaintCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(saint.slug)

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.avatar}>
            {saint.imageUrl ? (
              <img 
                src={saint.imageUrl} 
                alt={saint.displayName}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <i className="fas fa-dove" style={{ fontSize: '3rem', color: '#667eea' }}></i>
            )}
          </div>

          <h2 className={styles.saintName}>{saint.displayName}</h2>

          {/* Circular action buttons */}
          <div className={styles.actionButtons}>
            <button 
              className={styles.circularBtn}
              onClick={onStartChat}
              title="Start chat"
            >
              <i className="far fa-comment"></i>
            </button>
            <button 
              className={`${styles.circularBtn} ${favorite ? styles.favorite : ''}`}
              onClick={() => toggleFavorite(saint.slug)}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <i className={favorite ? "fas fa-star" : "far fa-star"}></i>
            </button>
          </div>

          {saint.era && (
            <div className={styles.badge}>{saint.era}</div>
          )}

          <div className={styles.infoSection}>
            {saint.birthPlace && (
              <div className={styles.infoItem}>
                <i className="fas fa-map-marker-alt" style={{ color: '#667eea' }}></i>
                <div>
                  <div className={styles.infoLabel}>Birthplace</div>
                  <div className={styles.infoValue}>{saint.birthPlace}</div>
                </div>
              </div>
            )}

            {(saint.birthDate || saint.deathDate) && (
              <div className={styles.infoItem}>
                <i className="fas fa-hourglass-half" style={{ color: '#667eea' }}></i>
                <div>
                  <div className={styles.infoLabel}>Lived</div>
                  <div className={styles.infoValue}>
                    {saint.birthDate && saint.deathDate 
                      ? `${saint.birthDate} - ${saint.deathDate}`
                      : saint.birthDate 
                      ? `Born ${saint.birthDate}`
                      : `Died ${saint.deathDate}`}
                  </div>
                </div>
              </div>
            )}

            {saint.feastDay && (
              <div className={styles.infoItem}>
                <i className="fas fa-calendar-day" style={{ color: '#667eea' }}></i>
                <div>
                  <div className={styles.infoLabel}>Feast Day</div>
                  <div className={styles.infoValue}>{formatFeastDay(saint.feastDay)}</div>
                </div>
              </div>
            )}

            {saint.patronages && saint.patronages.length > 0 && (
              <div className={styles.infoItem}>
                <i className="fas fa-hands-praying" style={{ color: '#667eea' }}></i>
                <div>
                  <div className={styles.infoLabel}>Patron of</div>
                  <div className={styles.infoValue}>
                    {saint.patronages.slice(0, 3).join(', ')}
                    {saint.patronages.length > 3 && ` +${saint.patronages.length - 3} more`}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className={styles.startChatBtn} onClick={onStartChat}>
            <i className="far fa-comment me-2"></i>
            Message {saint.displayName.replace('St. ', '')}
          </button>
        </div>
      </div>
    </>
  )
}


'use client'

import { useNavigate, useLocation, Link } from 'react-router-dom'
import AppHeader from './AppHeader'
import { SEED_SAINTS } from '@/lib/seed'
import type { Saint } from '@/lib/types'
import styles from './HomeScreen.module.css'

interface AppIcon {
  id: string
  name: string
  icon?: string // Font Awesome icon class
  iconImage?: string // Path to image icon
  color: string
  href: string
  external?: boolean // Open in new window instead of routing
}

interface FeastDay {
  date: Date
  dateStr: string
  saints: Saint[]
  isToday: boolean
  isTomorrow: boolean
}

const apps: AppIcon[] = [
  {
    id: 'skymessage',
    name: 'skyMessage',
    iconImage: '/icon.png',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    href: '/chat'
  },
  {
    id: 'contacts',
    name: 'Contacts',
    icon: 'fa-address-book',
    color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Teal-purple gradient
    href: '/contacts'
  },
  {
    id: 'chorus',
    name: 'Chorus',
    icon: 'fa-book-open',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-red gradient
    href: '/chorus'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: 'fa-calendar-alt',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Orange-yellow gradient
    href: '/calendar'
  },
  {
    id: 'patronages',
    name: 'Patronages',
    icon: 'fa-hands-praying',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple gradient (matches SkyMessage)
    href: '/patronages'
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: 'fa-globe-americas',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue gradient
    href: '/geography'
  },
  {
    id: 'videos',
    name: 'Videos',
    icon: 'fa-video',
    color: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)', // Red gradient
    href: 'https://vimeo.com/showcase/10035300?share=copy&mc_cid=ae91337dee&mc_eid=67f5724927',
    external: true
  },
  {
    id: 'confirmation',
    name: 'Saint Match',
    icon: 'fa-heart',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-red gradient
    href: '/confirmation'
  },
  // More apps will be added here
]

export default function HomeScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  
  console.log('🏠 HomeScreen rendered')
  console.log('📱 Apps array:', apps)
  console.log('📊 SEED_SAINTS count:', SEED_SAINTS.length)
  
  // Check for feast days today and tomorrow
  const getFeastDays = (): FeastDay[] => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const tomorrowMMDD = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    
    const feastDays: FeastDay[] = []
    
    // Check today
    const todaySaints = SEED_SAINTS.filter(s => s.feastDay === todayMMDD)
    if (todaySaints.length > 0) {
      feastDays.push({
        date: today,
        dateStr: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        saints: todaySaints,
        isToday: true,
        isTomorrow: false,
      })
    }
    
    // Check tomorrow
    const tomorrowSaints = SEED_SAINTS.filter(s => s.feastDay === tomorrowMMDD)
    if (tomorrowSaints.length > 0) {
      feastDays.push({
        date: tomorrow,
        dateStr: tomorrow.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        saints: tomorrowSaints,
        isToday: false,
        isTomorrow: true,
      })
    }
    
    return feastDays
  }

  const feastDays = getFeastDays()

  return (
    <div className={styles.phoneScreen}>
      <AppHeader transparent={true} />

      <div className={styles.homeContent}>
        {feastDays.length > 0 && (
          <div className={styles.feastDayBanner}>
            {feastDays.map((feast, idx) => (
              <Link key={idx} to="/calendar" className={styles.feastDayCard}>
                <div className={styles.feastDayIcon}>
                  <i className="fas fa-dove"></i>
                </div>
                <div className={styles.feastDayInfo}>
                  <div className={styles.feastDayDate}>
                    {feast.isToday ? '🎉 Today' : '📅 Tomorrow'} - {feast.dateStr}
                  </div>
                  <div className={styles.feastDayNames}>
                    {feast.saints.map(s => s.displayName).join(', ')}
                  </div>
                </div>
                <i className="fas fa-chevron-right" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}></i>
              </Link>
            ))}
          </div>
        )}

        <div className={styles.appGrid}>
          {apps.map((app) => {
            console.log('🔘 Rendering app button:', app.id, app.name, app.href)
            return (
              <div
                key={app.id}
                className={styles.appIcon}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🖱️ [HomeScreen] App clicked:', app.id, app.name, app.href)
                  console.log('🖱️ [HomeScreen] Current pathname:', pathname)
                  if (app.external) {
                    console.log('🖱️ [HomeScreen] Opening external link')
                    window.open(app.href, '_blank', 'noopener,noreferrer')
                  } else {
                    console.log('🖱️ [HomeScreen] Navigating to:', app.href)
                    console.log('🖱️ [HomeScreen] Current pathname before nav:', pathname)
                    
                    // If already on the target route, force a reload
                    if (pathname === app.href) {
                      console.warn('🖱️ [HomeScreen] Already on target route, forcing reload')
                      window.location.reload()
                      return
                    }
                    
                    try {
                      console.log('🖱️ [HomeScreen] Navigating with React Router to:', app.href)
                      navigate(app.href)
                      console.log('🖱️ [HomeScreen] navigate() called successfully')
                    } catch (error) {
                      console.error('🖱️ [HomeScreen] Navigation error:', error)
                      // Fallback to window.location on error
                      window.location.href = app.href
                    }
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('👆 [HomeScreen] Touch end, navigating to:', app.href)
                  console.log('👆 [HomeScreen] Current pathname:', pathname)
                  if (app.external) {
                    console.log('👆 [HomeScreen] Opening external link')
                    window.open(app.href, '_blank', 'noopener,noreferrer')
                  } else {
                    console.log('👆 [HomeScreen] Navigating to:', app.href)
                    console.log('👆 [HomeScreen] Current pathname before nav:', pathname)
                    
                    // If already on the target route, force a reload
                    if (pathname === app.href) {
                      console.warn('👆 [HomeScreen] Already on target route, forcing reload')
                      window.location.reload()
                      return
                    }
                    
                    try {
                      console.log('👆 [HomeScreen] Navigating with React Router to:', app.href)
                      navigate(app.href)
                      console.log('👆 [HomeScreen] navigate() called successfully')
                    } catch (error) {
                      console.error('👆 [HomeScreen] Navigation error:', error)
                      // Fallback to window.location on error
                      window.location.href = app.href
                    }
                  }
                }}
              >
                <div 
                  className={styles.appIconCircle}
                  style={{ background: app.color }}
                >
                  {app.iconImage ? (
                    <img 
                      src={app.iconImage} 
                      alt={app.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }}
                    />
                  ) : (
                    <i className={`fas ${app.icon}`}></i>
                  )}
                </div>
                <span className={styles.appName}>{app.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.dock}>
        <div className={styles.dockContent}>
          {/* Dock apps can go here later */}
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  transparent?: boolean
}

export default function AppHeader({ transparent = false }: AppHeaderProps = {}) {
  const [currentTime, setCurrentTime] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, '0')
      setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If already on home, do nothing (or refresh if needed)
    if (location.pathname === '/') {
      return
    }
    
    // Navigate to home using React Router
    navigate('/', { replace: false })
    
    // Force scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`${styles.appHeader} ${transparent ? styles.transparent : ''}`}>
      <button 
        onClick={handleHomeClick}
        className={styles.homeButton}
        type="button"
        aria-label="Home"
      >
        <i className="fas fa-home"></i>
      </button>

      <div className={styles.centerInfo}>
        <span className={styles.time}>{currentTime}</span>
      </div>

      <div className={styles.statusIcons}>
        <i className="fas fa-signal" title="Signal"></i>
        <i className="fas fa-cloud" title="Cloud"></i>
      </div>
    </div>
  )
}


'use client'

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Saint } from '@/lib/types'
import { useSaints } from '@/lib/useSaints'
import styles from './FeastCalendar.module.css'

interface FeastDay {
  date: string // MM-DD format
  saints: Array<{
    slug: string
    displayName: string
    feastDay: string
  }>
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function FeastCalendar() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  
  // Fetch saints from Firestore via API
  const { saints, isLoading: isLoadingSaints } = useSaints()

  // Get feast days for saints
  const getFeastDaysForMonth = (month: number): FeastDay[] => {
    const feastDays: { [key: string]: FeastDay } = {}

    console.log(`[FeastCalendar] getFeastDaysForMonth called for month ${month} (${MONTH_NAMES[month]})`)
    console.log(`[FeastCalendar] Total saints loaded: ${saints.length}`)
    
    saints.forEach((saint) => {
      if (saint.feastDay) {
        const [feastMonth, feastDate] = saint.feastDay.split('-').map(Number)
        if (feastMonth - 1 === month) {
          const dateKey = saint.feastDay
          if (!feastDays[dateKey]) {
            feastDays[dateKey] = {
              date: dateKey,
              saints: [],
            }
          }
          feastDays[dateKey].saints.push({
            slug: saint.slug,
            displayName: saint.displayName,
            feastDay: saint.feastDay,
          })
          console.log(`[FeastCalendar] Added ${saint.displayName} with feast day ${saint.feastDay} to month ${month}`)
        }
      }
    })

    const result = Object.values(feastDays).sort((a, b) => a.date.localeCompare(b.date))
    console.log(`[FeastCalendar] Found ${result.length} feast days for ${MONTH_NAMES[month]}:`, result.map(f => f.date))
    return result
  }

  // Get calendar days
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (number | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  // Check if a day has feast days
  const getFeastForDay = (day: number): FeastDay | null => {
    const dateStr = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const feastDays = getFeastDaysForMonth(currentMonth)
    return feastDays.find((f) => f.date === dateStr) || null
  }

  // Check if it's today
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToToday = () => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  const handleDayClick = (day: number | null) => {
    if (day) {
      setSelectedDay(day)
    }
  }

  const calendarDays = getCalendarDays()
  const selectedFeast = selectedDay ? getFeastForDay(selectedDay) : null

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button onClick={goToPreviousMonth} className={styles.navButton}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className={styles.monthYear}>
          <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
          <button onClick={goToToday} className={styles.todayButton}>
            Today
          </button>
        </div>
        <button onClick={goToNextMonth} className={styles.navButton}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div className={styles.weekdayHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const feast = day ? getFeastForDay(day) : null
          const isTodayDate = day ? isToday(day) : false
          const isSelected = day === selectedDay

          return (
            <div
              key={index}
              className={`${styles.calendarDay} ${!day ? styles.emptyDay : ''} ${
                isTodayDate ? styles.today : ''
              } ${feast ? styles.hasFeast : ''} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleDayClick(day)}
              style={{ cursor: feast ? 'pointer' : 'default' }}
            >
              {day && (
                <>
                  <div className={styles.dayNumber}>{day}</div>
                  {feast && (
                    <div className={styles.feastIcon}>
                      <i className="fas fa-dove"></i>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {selectedFeast && (
        <div className={styles.detailsSection}>
          <h3 className={styles.detailsTitle}>
            {MONTH_NAMES[currentMonth]} {selectedDay}
          </h3>
          <div className={styles.saintsList}>
            {selectedFeast.saints.map((saint, idx) => (
              <Link
                key={idx}
                to={`/chat?saint=${saint.slug}&greeting=true`}
                className={styles.saintDetail}
              >
                <div className={styles.saintInfo}>
                  <i className="fas fa-dove" style={{ marginRight: '8px', color: '#8a2be2' }}></i>
                  <span>{saint.displayName}</span>
                </div>
                <div className={styles.chatIcon}>
                  <i className="fas fa-comment"></i>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


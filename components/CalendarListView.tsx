'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SEED_SAINTS } from '@/lib/seed'
import styles from './CalendarListView.module.css'

interface FeastEvent {
  date: string // MM-DD format
  month: number // 0-11
  day: number // 1-31
  saints: Array<{
    slug: string
    displayName: string
  }>
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarListView() {
  const [stickyMonth, setStickyMonth] = useState<number | null>(null)
  const [loadedYears, setLoadedYears] = useState(1) // Start with 1 year, load more on scroll
  const containerRef = useRef<HTMLDivElement>(null)
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map()) // Key: "year-month"
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Get all feast days grouped by month
  const feastDaysByMonth = useMemo(() => {
    const today = new Date()
    const currentMonth = today.getMonth()
    
    // Group saints by their feast day
    const feastMap = new Map<string, FeastEvent>()
    
    SEED_SAINTS.forEach((saint) => {
      if (saint.feastDay) {
        const [month, day] = saint.feastDay.split('-').map(Number)
        const monthIndex = month - 1 // Convert to 0-based
        const dateKey = saint.feastDay
        
        if (!feastMap.has(dateKey)) {
          feastMap.set(dateKey, {
            date: dateKey,
            month: monthIndex,
            day: day,
            saints: []
          })
        }
        
        feastMap.get(dateKey)!.saints.push({
          slug: saint.slug,
          displayName: saint.displayName
        })
      }
    })
    
    // Group by month
    const byMonth = new Map<number, FeastEvent[]>()
    feastMap.forEach((event) => {
      if (!byMonth.has(event.month)) {
        byMonth.set(event.month, [])
      }
      byMonth.get(event.month)!.push(event)
    })
    
    // Sort events within each month by day
    byMonth.forEach((events) => {
      events.sort((a, b) => a.day - b.day)
    })
    
    // Reorder months starting from current month
    const orderedMonths: Array<{ month: number; events: FeastEvent[] }> = []
    
    // Add months from current month to December
    for (let m = currentMonth; m < 12; m++) {
      if (byMonth.has(m)) {
        orderedMonths.push({
          month: m,
          events: byMonth.get(m)!
        })
      }
    }
    
    // Add months from January to before current month
    for (let m = 0; m < currentMonth; m++) {
      if (byMonth.has(m)) {
        orderedMonths.push({
          month: m,
          events: byMonth.get(m)!
        })
      }
    }
    
    return orderedMonths
  }, [])

  // Set initial sticky month to current month
  useEffect(() => {
    const today = new Date()
    const currentMonth = today.getMonth()
    setStickyMonth(currentMonth)
  }, [])

  // Handle scroll to update sticky month and load more years
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const containerTop = container.getBoundingClientRect().top
      
      // Find which month section is currently at the top
      let newStickyMonth: number | null = null
      
      monthRefs.current.forEach((element, key) => {
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top - containerTop + scrollTop
          
          // If this month section is at or above the sticky header position
          if (elementTop <= scrollTop + 60) { // 60px for sticky header height
            // Extract month from key (format: "year-month")
            const month = parseInt(key.split('-')[1])
            newStickyMonth = month
          }
        }
      })
      
      if (newStickyMonth !== null && newStickyMonth !== stickyMonth) {
        setStickyMonth(newStickyMonth)
      }

      // Check if we're near the bottom (within 500px) to load more years
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      if (distanceFromBottom < 500 && sentinelRef.current) {
        // Load another year
        setLoadedYears((prev) => prev + 1)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [stickyMonth])

  // Get today's date
  const todayDate = useMemo(() => {
    const today = new Date()
    return {
      month: today.getMonth(),
      day: today.getDate(),
      dateStr: `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    }
  }, [])

  // Format date for display (e.g., "November 12")
  const formatDate = (month: number, day: number): string => {
    return `${MONTH_NAMES[month]} ${day}`
  }

  // Check if an event is today
  const isToday = (event: FeastEvent): boolean => {
    return event.month === todayDate.month && event.day === todayDate.day
  }

  // Check if we should show "today" marker before this event
  const shouldShowTodayBefore = (event: FeastEvent, isFirstInMonth: boolean): boolean => {
    // Show before first event if today is earlier in the month
    if (isFirstInMonth && event.month === todayDate.month && event.day > todayDate.day) {
      return true
    }
    // Show before event if today is between previous event and this one
    return false
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Sticky month header */}
      <div className={styles.stickyHeader}>
        {stickyMonth !== null && (
          <h2 className={styles.monthName}>
            {MONTH_NAMES[stickyMonth]}
          </h2>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Render multiple years for infinite scroll */}
        {Array.from({ length: loadedYears }, (_, yearIndex) => {
          return feastDaysByMonth.map(({ month, events }, monthIndex) => {
            // Only show "today" marker in the first year (current year)
            const isCurrentYear = yearIndex === 0
            const isCurrentMonth = isCurrentYear && month === todayDate.month
            
            // Determine where to show "today" marker (only in first year)
            let showTodayBeforeIndex = -1
            let todayEventIndex = -1
            
            if (isCurrentMonth) {
              // Check if today matches an event
              todayEventIndex = events.findIndex(isToday)
              
              // If no matching event, find where to insert the marker
              if (todayEventIndex === -1) {
                // Find the first event after today
                for (let i = 0; i < events.length; i++) {
                  if (events[i].day > todayDate.day) {
                    showTodayBeforeIndex = i
                    break
                  }
                }
                // If no event after today, show at end
                if (showTodayBeforeIndex === -1 && events.length > 0) {
                  showTodayBeforeIndex = events.length
                }
              }
            }
            
            const uniqueKey = `${yearIndex}-${month}`
            
            return (
              <div
                key={uniqueKey}
                ref={(el) => {
                  if (el) {
                    monthRefs.current.set(uniqueKey, el)
                  } else {
                    monthRefs.current.delete(uniqueKey)
                  }
                }}
                className={styles.monthSection}
              >
              <div className={styles.monthHeader}>
                <h2 className={styles.monthName}>{MONTH_NAMES[month]}</h2>
              </div>
              
              <div className={styles.eventsList}>
                {/* Show "today" marker at start if today is before all events */}
                {isCurrentMonth && events.length > 0 && events[0].day > todayDate.day && (
                  <div className={styles.todayMarker}>
                    <div className={styles.todayDateLine}>
                      <span className={styles.todayBadge}>Today</span>
                      <span className={styles.todayDateText}>{formatDate(todayDate.month, todayDate.day)}</span>
                      <span className={styles.todayLine}></span>
                    </div>
                  </div>
                )}
                
                {events.map((event, eventIndex) => {
                  const isTodayEvent = eventIndex === todayEventIndex
                  
                  return (
                    <div key={event.date}>
                      {/* Show "today" marker before this event if today falls between events */}
                      {eventIndex === showTodayBeforeIndex && (
                        <div className={styles.todayMarker}>
                          <div className={styles.todayDateLine}>
                            <span className={styles.todayBadge}>Today</span>
                            <span className={styles.todayDateText}>{formatDate(todayDate.month, todayDate.day)}</span>
                            <span className={styles.todayLine}></span>
                          </div>
                        </div>
                      )}
                      
                      <div className={`${styles.eventItem} ${isTodayEvent ? styles.todayEvent : ''}`}>
                        <div className={styles.eventDate}>
                          {isTodayEvent ? (
                            <div className={styles.todayDateLine}>
                              <span className={styles.todayBadge}>Today</span>
                              <span className={styles.todayDateText}>{formatDate(event.month, event.day)}</span>
                              <span className={styles.todayLine}></span>
                            </div>
                          ) : (
                            formatDate(event.month, event.day)
                          )}
                        </div>
                        <div className={styles.saintsList}>
                          {event.saints.map((saint, idx) => (
                            <Link
                              key={idx}
                              to={`/chat?saint=${saint.slug}&greeting=true`}
                              className={styles.saintLink}
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
                    </div>
                  )
                })}
                
                {/* Show "today" marker at end if today is after all events */}
                {isCurrentMonth && 
                 events.length > 0 && 
                 events[events.length - 1].day < todayDate.day && 
                 showTodayBeforeIndex === events.length && (
                  <div className={styles.todayMarker}>
                    <div className={styles.todayDateLine}>
                      <span className={styles.todayBadge}>Today</span>
                      <span className={styles.todayDateText}>{formatDate(todayDate.month, todayDate.day)}</span>
                      <span className={styles.todayLine}></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )
          })
        })}
        
        {/* Sentinel element for infinite scroll detection */}
        <div ref={sentinelRef} className={styles.sentinel} />
      </div>
    </div>
  )
}


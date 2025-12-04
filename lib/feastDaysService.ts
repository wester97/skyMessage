/**
 * Service for fetching and processing feast days
 * Handles data source selection (database vs seed data)
 */

import type { Saint } from './types'
import { SEED_SAINTS } from './seed'

export interface FeastDayInfo {
  date: Date
  dateStr: string
  saints: Saint[]
  isToday: boolean
  isTomorrow: boolean
  isUpcoming: boolean
}

/**
 * Get upcoming feast days (today, tomorrow, or next upcoming)
 * Uses database saints if available, falls back to seed data
 */
export function getUpcomingFeastDays(saints: Saint[]): FeastDayInfo[] {
  // Use provided saints (from database) or fall back to seed data
  const sourceSaints = saints.length > 0 ? saints : SEED_SAINTS
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const tomorrowMMDD = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  
  const feastDays: FeastDayInfo[] = []
  
  // Check today
  const todaySaints = sourceSaints.filter(s => s.feastDay === todayMMDD)
  if (todaySaints.length > 0) {
    feastDays.push({
      date: today,
      dateStr: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      saints: todaySaints,
      isToday: true,
      isTomorrow: false,
      isUpcoming: true,
    })
  }
  
  // Check tomorrow
  const tomorrowSaints = sourceSaints.filter(s => s.feastDay === tomorrowMMDD)
  if (tomorrowSaints.length > 0) {
    feastDays.push({
      date: tomorrow,
      dateStr: tomorrow.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      saints: tomorrowSaints,
      isToday: false,
      isTomorrow: true,
      isUpcoming: true,
    })
  }
  
  // If we don't have today or tomorrow, find the next upcoming feast day
  if (feastDays.length === 0) {
    // Look ahead up to 30 days for the next feast day
    for (let daysAhead = 1; daysAhead <= 30; daysAhead++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() + daysAhead)
      
      const dateMMDD = `${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      const daySaints = sourceSaints.filter(s => s.feastDay === dateMMDD)
      
      if (daySaints.length > 0) {
        const isTomorrow = daysAhead === 1
        feastDays.push({
          date: checkDate,
          dateStr: checkDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          saints: daySaints,
          isToday: false,
          isTomorrow,
          isUpcoming: true,
        })
        break // Only show the next upcoming feast day
      }
    }
  }
  
  return feastDays
}

/**
 * Get feast days for a specific date range
 */
export function getFeastDaysInRange(
  saints: Saint[],
  startDate: Date,
  endDate: Date
): FeastDayInfo[] {
  const sourceSaints = saints.length > 0 ? saints : SEED_SAINTS
  const feastDays: FeastDayInfo[] = []
  
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateMMDD = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    const daySaints = sourceSaints.filter(s => s.feastDay === dateMMDD)
    
    if (daySaints.length > 0) {
      const today = new Date()
      const isToday = currentDate.toDateString() === today.toDateString()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isTomorrow = currentDate.toDateString() === tomorrow.toDateString()
      
      feastDays.push({
        date: new Date(currentDate),
        dateStr: currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        saints: daySaints,
        isToday,
        isTomorrow,
        isUpcoming: currentDate >= today,
      })
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return feastDays
}

/**
 * Get the next N upcoming feast days (excluding today)
 */
export function getNextNFeastDays(saints: Saint[], count: number = 5): FeastDayInfo[] {
  const sourceSaints = saints.length > 0 ? saints : SEED_SAINTS
  const today = new Date()
  const feastDays: FeastDayInfo[] = []
  
  // Look ahead up to 365 days
  for (let daysAhead = 1; daysAhead <= 365 && feastDays.length < count; daysAhead++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() + daysAhead)
    
    const dateMMDD = `${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
    const daySaints = sourceSaints.filter(s => s.feastDay === dateMMDD)
    
    if (daySaints.length > 0) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isTomorrow = checkDate.toDateString() === tomorrow.toDateString()
      
      feastDays.push({
        date: checkDate,
        dateStr: checkDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        saints: daySaints,
        isToday: false,
        isTomorrow,
        isUpcoming: true,
      })
    }
  }
  
  return feastDays
}


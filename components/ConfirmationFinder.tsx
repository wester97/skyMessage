'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SEED_SAINTS } from '@/lib/seed'
import { CONFIRMATION_QUESTIONS, getSaintTraits, type Question } from '@/lib/confirmationQuestions'
import type { Saint } from '@/lib/types'
import styles from './ConfirmationFinder.module.css'

interface Answer {
  questionId: string
  selectedOption: 'A' | 'B'
  traits: string[]
}

export default function ConfirmationFinder() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [matchedSaints, setMatchedSaints] = useState<Array<{ saint: Saint; score: number }>>([])
  const [flashColor, setFlashColor] = useState<string | null>(null)

  useEffect(() => {
    // Use multiple log levels
    console.log('🎯 [ConfirmationFinder] Component mounted')
    console.warn('🎯 [ConfirmationFinder] WARN: Component mounted')
    console.error('🎯 [ConfirmationFinder] ERROR: Component mounted (debug)')
    
    if (typeof window !== 'undefined') {
      (window as any).__CONFIRMATION_FINDER_LOADED__ = true
      console.log('🎯 [ConfirmationFinder] Pathname:', pathname)
      console.log('🎯 [ConfirmationFinder] Window location:', window.location.href)
    }
    
    // Check if wrapper is in DOM
    setTimeout(() => {
      const wrapper = document.querySelector('[data-confirmation-wrapper]') as HTMLElement | null
      console.log('🎯 [ConfirmationFinder] DOM check - Wrapper:', !!wrapper)
      if (wrapper) {
        const styles = window.getComputedStyle(wrapper)
        console.log('🎯 [ConfirmationFinder] Wrapper styles:', {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          width: wrapper.offsetWidth,
          height: wrapper.offsetHeight
        })
        console.log('🎯 [ConfirmationFinder] Wrapper visible:', wrapper.offsetWidth > 0 && wrapper.offsetHeight > 0)
      } else {
        console.error('🎯 [ConfirmationFinder] ERROR: Wrapper not found in DOM!')
        // Add visible error indicator
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = 'position: fixed; top: 50px; left: 0; right: 0; background: orange; color: black; padding: 10px; z-index: 9999;'
        errorDiv.textContent = 'ERROR: ConfirmationFinder wrapper not found in DOM'
        document.body.appendChild(errorDiv)
      }
    }, 100)
  }, [pathname])
  
  if (typeof window !== 'undefined') {
    console.log('🎯 [ConfirmationFinder] Rendering, showResults:', showResults, 'currentQuestionIndex:', currentQuestionIndex)
  }

  const currentQuestion = CONFIRMATION_QUESTIONS[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / CONFIRMATION_QUESTIONS.length) * 100

  // Handle swipe/tap selection
  const handleSelect = (option: 'A' | 'B') => {
    if (isAnimating) return
    
    const selectedOptionData = option === 'A' ? currentQuestion.optionA : currentQuestion.optionB
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      selectedOption: option,
      traits: selectedOptionData.traits
    }
    
    setAnswers([...answers, newAnswer])
    // Set exit direction: A = left (green), B = right (blue)
    const direction = option === 'A' ? 'left' : 'right'
    setExitDirection(direction)
    setIsAnimating(true)
    
    // Flash background color
    setFlashColor(option === 'A' ? 'green' : 'blue')
    
    // Animate card out
    setTimeout(() => {
      if (currentQuestionIndex < CONFIRMATION_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setIsAnimating(false)
        setExitDirection(null)
        // Fade back to normal after flash
        setTimeout(() => setFlashColor(null), 200)
      } else {
        // Calculate matches
        calculateMatches([...answers, newAnswer])
        setShowResults(true)
        setExitDirection(null)
        setTimeout(() => setFlashColor(null), 200)
      }
    }, 400)
  }

  // Calculate saint matches based on answers
  const calculateMatches = (allAnswers: Answer[]) => {
    // Collect all selected traits
    const selectedTraits = new Set<string>()
    allAnswers.forEach(answer => {
      answer.traits.forEach(trait => selectedTraits.add(trait))
    })

    // Get gender preference (must match)
    const genderPreference = allAnswers.find(a => a.questionId === 'gender')
    const requiredGender = genderPreference?.traits[0] // 'male' or 'female'

    // Score each saint
    const scoredSaints = SEED_SAINTS.map(saint => {
      const saintTraits = getSaintTraits(saint)
      
      // Filter by gender first - must match
      if (requiredGender && !saintTraits.includes(requiredGender)) {
        return { saint, score: 0 }
      }
      
      let score = 0
      
      // Count matching traits (excluding gender since we already filtered)
      selectedTraits.forEach(trait => {
        if (trait !== 'male' && trait !== 'female' && saintTraits.includes(trait)) {
          score += 1
        }
      })
      
      // Bonus for multiple matches
      const nonGenderTraits = Array.from(selectedTraits).filter(t => t !== 'male' && t !== 'female')
      const matchRatio = score / Math.max(nonGenderTraits.length, 1)
      score = score * (1 + matchRatio) // Weighted score
      
      return { saint, score }
    })

    // Sort by score and take top 10
    const topMatches = scoredSaints
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    setMatchedSaints(topMatches)
  }

  // Reset on question change
  useEffect(() => {
    setExitDirection(null)
  }, [currentQuestionIndex])

  // Get background color with flash effect
  const getBackgroundColor = () => {
    if (flashColor === 'green') {
      return 'linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(76, 175, 80, 0.7) 100%)'
    } else if (flashColor === 'blue') {
      return 'linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(33, 150, 243, 0.7) 100%)'
    }
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }

  if (showResults) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.resultsContainer}>
        <div className={styles.resultsHeader}>
          <h1>Your Confirmation Saint Matches</h1>
          <p>Based on your answers, here are saints that align with your values:</p>
        </div>
        
        <div className={styles.resultsList}>
          {matchedSaints.length > 0 ? (
            matchedSaints.map((match, index) => (
              <div 
                key={match.saint.slug} 
                className={styles.resultCard}
                onClick={() => navigate(`/chat?saint=${match.saint.slug}&greeting=true`)}
              >
                <div className={styles.resultRank}>#{index + 1}</div>
                <div className={styles.resultContent}>
                  <h3>{match.saint.displayName}</h3>
                  {match.saint.era && <p className={styles.resultEra}>{match.saint.era}</p>}
                  {match.saint.patronages && match.saint.patronages.length > 0 && (
                    <div className={styles.resultPatronages}>
                      {match.saint.patronages.slice(0, 3).map((p, i) => (
                        <span key={i} className={styles.patronageTag}>{p}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.matchScore}>
                    Match: {Math.round(match.score * 10)}%
                  </div>
                </div>
                <i className="fas fa-chevron-right"></i>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <p>No matches found. Try again with different answers!</p>
              <button 
                className={styles.restartButton}
                onClick={() => {
                  setCurrentQuestionIndex(0)
                  setAnswers([])
                  setShowResults(false)
                  setMatchedSaints([])
                }}
              >
                Start Over
              </button>
            </div>
          )}
        </div>
        
        <button 
          className={styles.restartButton}
          onClick={() => {
            setCurrentQuestionIndex(0)
            setAnswers([])
            setShowResults(false)
            setMatchedSaints([])
          }}
        >
          <i className="fas fa-redo me-2"></i>
          Take Quiz Again
        </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper} data-confirmation-wrapper>
      <div 
        className={styles.container}
        style={{ background: getBackgroundColor() }}
      >
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className={styles.questionCounter}>
        Question {currentQuestionIndex + 1} of {CONFIRMATION_QUESTIONS.length}
      </div>

      <div className={styles.cardContainer}>
        <div
          className={`${styles.card} ${isAnimating ? (exitDirection === 'left' ? styles.cardExitLeft : styles.cardExitRight) : ''}`}
        >
          <div className={styles.cardContent}>
            <h2 className={styles.questionText}>{currentQuestion.text}</h2>
            
            <div className={styles.optionsSplit}>
              <div 
                className={`${styles.optionHalf} ${styles.optionLeft}`}
                onClick={() => handleSelect('A')}
              >
                <div className={styles.optionContent}>
                  {currentQuestion.optionA.icon && (
                    <i className={`fas ${currentQuestion.optionA.icon}`}></i>
                  )}
                  <span>{currentQuestion.optionA.text}</span>
                </div>
              </div>
              
              <div className={styles.divider}></div>
              
              <div 
                className={`${styles.optionHalf} ${styles.optionRight}`}
                onClick={() => handleSelect('B')}
              >
                <div className={styles.optionContent}>
                  {currentQuestion.optionB.icon && (
                    <i className={`fas ${currentQuestion.optionB.icon}`}></i>
                  )}
                  <span>{currentQuestion.optionB.text}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.swipeHint}>
              <i className="fas fa-hand-pointer"></i>
              <span>Tap to choose</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}


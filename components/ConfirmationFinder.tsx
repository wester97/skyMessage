'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CONFIRMATION_QUESTIONS, getSaintTraits, type Question } from '@/lib/confirmationQuestions'
import { matchSaints } from '@/lib/api'
import type { Saint } from '@/lib/types'
import { useSaints } from '@/lib/useSaints'
import styles from './ConfirmationFinder.module.css'

// Generate a fallback summary for saints
function generateFallbackSummary(saint: Saint): string {
  const parts = []
  
  if (saint.era) {
    parts.push(`Lived in the ${saint.era}`)
  }
  
  if (saint.patronages && saint.patronages.length > 0) {
    const patronagesList = saint.patronages.slice(0, 3).join(', ')
    parts.push(`Patron saint of ${patronagesList}`)
  }
  
  return parts.length > 0 ? parts.join('. ') + '.' : `A beloved Catholic saint.`
}

// Loading animation component
function LoadingAnimation({ traits, saints }: { traits: string[]; saints: Saint[] }) {
  // Get saint names for scrolling
  const saintNames = saints.map(s => s.displayName)
  
  // Format traits for display
  const formattedTraits = traits.map(t => {
    // Convert snake_case to Title Case
    return t.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  })
  
  return (
    <div className={styles.loadingAnimation}>
      <div className={styles.cloudContainer}>
        <div className={styles.cloud}>
          <i className="fas fa-cloud"></i>
          <div className={styles.cloudSpinner}></div>
        </div>
        <p className={styles.loadingText}>Finding your perfect saint match...</p>
      </div>
      
      <div className={styles.scrollingContainer}>
        <div className={styles.scrollTrack}>
          <div className={`${styles.scrollContent} ${styles.scrollRight}`}>
            {formattedTraits.map((trait, i) => (
              <span key={i} className={styles.scrollItem}>{trait}</span>
            ))}
            {/* Duplicate for seamless loop */}
            {formattedTraits.map((trait, i) => (
              <span key={`dup-${i}`} className={styles.scrollItem}>{trait}</span>
            ))}
          </div>
        </div>
        
        <div className={styles.scrollTrack}>
          <div className={`${styles.scrollContent} ${styles.scrollLeft}`}>
            {/* Duplicate for seamless loop - start with second copy */}
            {saintNames.map((name, i) => (
              <span key={`dup-${i}`} className={styles.scrollItem}>{name}</span>
            ))}
            {saintNames.map((name, i) => (
              <span key={i} className={styles.scrollItem}>{name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Answer {
  questionId: string
  selectedOption: 'A' | 'B'
  traits: string[]
}

export default function ConfirmationFinder() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { saints } = useSaints()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [matchedSaints, setMatchedSaints] = useState<Array<{ saint: Saint; score: number; explanation?: string; summary?: string }>>([])
  const [flashColor, setFlashColor] = useState<string | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  useEffect(() => {
    // Component mounted
  }, [pathname])

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
        // Calculate matches (async)
        calculateMatches([...answers, newAnswer]).then(() => {
          setShowResults(true)
        })
        setExitDirection(null)
        setTimeout(() => setFlashColor(null), 200)
      }
    }, 400)
  }

  // Calculate saint matches using AI
  const calculateMatches = async (allAnswers: Answer[]) => {
    setIsMatching(true)
    try {
      // Collect all selected traits
      const selectedTraits = new Set<string>()
      allAnswers.forEach(answer => {
        answer.traits.forEach(trait => selectedTraits.add(trait))
      })

      // Get user's gender (must match)
      const genderAnswer = allAnswers.find(a => a.questionId === 'gender')
      const userGender = genderAnswer?.traits[0] as 'male' | 'female' | undefined

      if (!userGender) {
        console.error('No gender found in answers')
        setIsMatching(false)
        return
      }

      // Convert traits set to array (excluding gender)
      const traitsArray = Array.from(selectedTraits).filter(t => t !== 'male' && t !== 'female')

      // Call AI matching service
      const response = await matchSaints({
        traits: traitsArray,
        gender: userGender,
      })

      // Convert response to expected format
      const matches = response.matches.map(match => ({
        saint: match.saint,
        score: match.score,
        explanation: match.explanation,
        summary: match.summary,
      }))

      setMatchedSaints(matches)
    } catch (error) {
      console.error('Error matching saints with AI:', error)
      // Fallback to simple trait matching if AI fails
      fallbackTraitMatching(allAnswers)
    } finally {
      setIsMatching(false)
    }
  }

  // Fallback to simple trait matching if AI fails
  const fallbackTraitMatching = (allAnswers: Answer[]) => {
    // Collect all selected traits
    const selectedTraits = new Set<string>()
    allAnswers.forEach(answer => {
      answer.traits.forEach(trait => selectedTraits.add(trait))
    })

    // Get user's gender (must match)
    const genderAnswer = allAnswers.find(a => a.questionId === 'gender')
    const requiredGender = genderAnswer?.traits[0] // 'male' or 'female'

    // Score each saint
    const scoredSaints = saints.map(saint => {
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
      
      // Calculate match percentage (0-100%)
      const nonGenderTraits = Array.from(selectedTraits).filter(t => t !== 'male' && t !== 'female')
      const matchRatio = score / Math.max(nonGenderTraits.length, 1)
      // Convert to percentage (0-1 range)
      const percentageScore = Math.min(matchRatio, 1.0)
      
      return { saint, score: percentageScore }
    })

    // Sort by score and take top 10
    const topMatches = scoredSaints
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(match => ({
        ...match,
        explanation: `Matched ${Math.round(match.score * 100)}% of your traits.`,
        summary: generateFallbackSummary(match.saint),
      }))

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
        
        {isMatching ? (
          <LoadingAnimation 
            saints={saints}
            traits={(() => {
              const allTraits = new Set<string>()
              answers.forEach(answer => {
                answer.traits.forEach(trait => {
                  if (trait !== 'male' && trait !== 'female') {
                    allTraits.add(trait)
                  }
                })
              })
              return Array.from(allTraits)
            })()}
          />
        ) : (
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
                    {match.summary && (
                      <p className={styles.saintSummary}>{match.summary}</p>
                    )}
                    {match.saint.patronages && match.saint.patronages.length > 0 && (
                      <div className={styles.resultPatronages}>
                        {match.saint.patronages.slice(0, 3).map((p, i) => (
                          <span key={i} className={styles.patronageTag}>{p}</span>
                        ))}
                      </div>
                    )}
                    {match.explanation && (
                      <p className={styles.matchExplanation}>{match.explanation}</p>
                    )}
                    <div className={styles.matchScore}>
                      Match: {Math.round(match.score * 100)}%
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
        )}
        
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


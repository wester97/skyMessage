'use client'

import { useState } from 'react'
import { PATRONAGE_CATEGORIES, type PatronageCategory, type PatronageSubcategory } from '@/lib/patronageCategories'
import { SEED_SAINTS } from '@/lib/seed'
import { Link } from 'react-router-dom'
import styles from './PatronagesApp.module.css'

type ViewState = 'categories' | 'subcategories' | 'patronages' | 'results'

export default function PatronagesApp() {
  const [viewState, setViewState] = useState<ViewState>('categories')
  const [selectedCategory, setSelectedCategory] = useState<PatronageCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<PatronageSubcategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ patronage: string; saints: any[] }>>([])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      setViewState('categories')
      return
    }

    // Search through all patronages in categories
    const results: Array<{ patronage: string; saints: any[] }> = []
    const lowerQuery = query.toLowerCase()

    PATRONAGE_CATEGORIES.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.patronages.forEach(patronage => {
          if (patronage.toLowerCase().includes(lowerQuery)) {
            // Find saints with this patronage
            const saintsForPatronage = SEED_SAINTS.filter(saint =>
              saint.patronages?.some(p => p.toLowerCase() === patronage.toLowerCase())
            )
            
            results.push({ patronage, saints: saintsForPatronage })
          }
        })
      })
    })

    setSearchResults(results)
    setViewState('results')
  }

  // Handle category selection
  const handleCategoryClick = (category: PatronageCategory) => {
    setSelectedCategory(category)
    setViewState('subcategories')
  }

  // Handle subcategory selection
  const handleSubcategoryClick = (subcategory: PatronageSubcategory) => {
    setSelectedSubcategory(subcategory)
    setViewState('patronages')
  }

  // Handle back navigation
  const handleBack = () => {
    if (viewState === 'patronages') {
      setViewState('subcategories')
      setSelectedSubcategory(null)
    } else if (viewState === 'subcategories') {
      setViewState('categories')
      setSelectedCategory(null)
    } else if (viewState === 'results') {
      setViewState('categories')
      setSearchQuery('')
      setSearchResults([])
    }
  }

  // Get saints for a specific patronage
  const getSaintsForPatronage = (patronage: string) => {
    return SEED_SAINTS.filter(saint =>
      saint.patronages?.some(p => p.toLowerCase() === patronage.toLowerCase())
    )
  }

  // Get saint count for a category
  const getSaintCountForCategory = (category: PatronageCategory) => {
    const uniqueSaints = new Set<string>()
    category.subcategories.forEach(subcategory => {
      subcategory.patronages.forEach(patronage => {
        const saints = getSaintsForPatronage(patronage)
        saints.forEach(saint => uniqueSaints.add(saint.slug))
      })
    })
    return uniqueSaints.size
  }

  // Get saint count for a subcategory
  const getSaintCountForSubcategory = (subcategory: PatronageSubcategory) => {
    const uniqueSaints = new Set<string>()
    subcategory.patronages.forEach(patronage => {
      const saints = getSaintsForPatronage(patronage)
      saints.forEach(saint => uniqueSaints.add(saint.slug))
    })
    return uniqueSaints.size
  }

  return (
    <div className={styles.patronagesContainer}>
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search patronages..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.clearButton}
              onClick={() => handleSearch('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Back Button */}
      {viewState !== 'categories' && (
        <button className={styles.backButton} onClick={handleBack}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
      )}

      {/* Categories View */}
      {viewState === 'categories' && (
        <div className={styles.categoriesGrid}>
          {PATRONAGE_CATEGORIES.map(category => {
            const saintCount = getSaintCountForCategory(category)
            return (
              <button
                key={category.id}
                className={styles.categoryCard}
                style={{ borderLeftColor: category.color }}
                onClick={() => handleCategoryClick(category)}
              >
                <i className={`fas ${category.icon} ${styles.categoryIcon}`} style={{ color: category.color }}></i>
                <h3 className={styles.categoryName}>{category.name}</h3>
                {saintCount > 0 && (
                  <span className={styles.saintCount}>{saintCount} {saintCount === 1 ? 'saint' : 'saints'}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Subcategories View */}
      {viewState === 'subcategories' && selectedCategory && (
        <div className={styles.subcategoriesContainer}>
          <h2 className={styles.viewTitle} style={{ color: selectedCategory.color }}>
            <i className={`fas ${selectedCategory.icon}`}></i> {selectedCategory.name}
          </h2>
          <div className={styles.subcategoriesList}>
            {selectedCategory.subcategories.map(subcategory => {
              const saintCount = getSaintCountForSubcategory(subcategory)
              return (
                <button
                  key={subcategory.id}
                  className={styles.subcategoryCard}
                  onClick={() => handleSubcategoryClick(subcategory)}
                >
                  <h4>{subcategory.name}</h4>
                  <div className={styles.subcategoryMeta}>
                    <p className={styles.subcategoryInfo}>
                      {subcategory.patronages.length} patronages
                    </p>
                    {saintCount > 0 && (
                      <span className={styles.saintCountBadge}>{saintCount}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Patronages View */}
      {viewState === 'patronages' && selectedSubcategory && (
        <div className={styles.patronagesContainer}>
          <h2 className={styles.viewTitle}>{selectedSubcategory.name}</h2>
          <div className={styles.patronagesList}>
            {selectedSubcategory.patronages.map(patronage => {
              const saints = getSaintsForPatronage(patronage)
              return (
                <div key={patronage} className={styles.patronageItem}>
                  <h4 className={styles.patronageName}>{patronage}</h4>
                  {saints.length > 0 ? (
                    <div className={styles.saintsList}>
                      {saints.map(saint => (
                        <Link
                          key={saint.slug}
                          to={`/chat?saint=${saint.slug}`}
                          className={styles.saintLink}
                        >
                          <i className="fas fa-comment"></i> {saint.displayName}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noSaints}>No saints found yet</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search Results View */}
      {viewState === 'results' && (
        <div className={styles.searchResultsContainer}>
          <h2 className={styles.viewTitle}>Search Results for "{searchQuery}"</h2>
          {searchResults.length > 0 ? (
            <div className={styles.patronagesList}>
              {searchResults.map(({ patronage, saints }) => (
                <div key={patronage} className={styles.patronageItem}>
                  <h4 className={styles.patronageName}>{patronage}</h4>
                  {saints.length > 0 ? (
                    <div className={styles.saintsList}>
                      {saints.map(saint => (
                        <Link
                          key={saint.slug}
                          to={`/chat?saint=${saint.slug}`}
                          className={styles.saintLink}
                        >
                          <i className="fas fa-comment"></i> {saint.displayName}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noSaints}>No saints found yet</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No patronages found matching "{searchQuery}"</p>
          )}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useMemo } from 'react'
import { InputGroup, Form, ListGroup } from 'react-bootstrap'
import { SEED_SAINTS } from '@/lib/seed'
import { extractCountry, type CountryInfo } from '@/lib/countryMapping'
import type { Saint } from '@/lib/types'
import styles from './GeographyApp.module.css'

interface CountryGroup {
  country: CountryInfo
  saints: Saint[]
}

export default function GeographyApp() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null)

  // Group saints by country
  const countryGroups = useMemo(() => {
    const groups: Record<string, CountryGroup> = {}
    
    SEED_SAINTS.forEach((saint) => {
      const country = extractCountry(saint?.birthPlace)
      if (country) {
        const key = country.name
        if (!groups[key]) {
          groups[key] = {
            country,
            saints: []
          }
        }
        groups[key].saints.push(saint)
      }
    })
    
    // Sort saints within each country alphabetically
    Object.values(groups).forEach(group => {
      group.saints.sort((a, b) => a.displayName.localeCompare(b.displayName))
    })
    
    // Convert to array and sort alphabetically by country name
    return Object.values(groups).sort((a, b) => 
      a.country.name.localeCompare(b.country.name)
    )
  }, [])

  // Filter countries by search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countryGroups
    
    const lowerSearch = searchTerm.toLowerCase()
    return countryGroups.filter(group => 
      group.country.name.toLowerCase().includes(lowerSearch) ||
      group.saints.some(saint => 
        saint.displayName.toLowerCase().includes(lowerSearch)
      )
    )
  }, [countryGroups, searchTerm])

  // Get saints for selected country
  const selectedSaints = useMemo(() => {
    if (!selectedCountry) return []
    return countryGroups.find(g => g.country.name === selectedCountry.name)?.saints || []
  }, [selectedCountry, countryGroups])

  const handleBack = () => {
    setSelectedCountry(null)
    setSearchTerm('')
  }

  return (
    <div className={styles.geographyContainer}>
      {!selectedCountry ? (
        <>
          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <InputGroup>
              <InputGroup.Text>
                <i className="fas fa-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search countries or saints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <InputGroup.Text 
                  className={styles.clearBtn}
                  onClick={() => setSearchTerm('')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="fas fa-times"></i>
                </InputGroup.Text>
              )}
            </InputGroup>
          </div>

          {/* Country List */}
          <div className={styles.countryList}>
            {filteredCountries.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-globe" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }}></i>
                <p>No countries found</p>
              </div>
            ) : (
              filteredCountries.map((group) => (
                <div
                  key={group.country.name}
                  className={styles.countryCard}
                  onClick={() => setSelectedCountry(group.country)}
                >
                  <div className={styles.countryFlag}>{group.country.flag}</div>
                  <div className={styles.countryInfo}>
                    <div className={styles.countryName}>{group.country.name}</div>
                    <div className={styles.saintCount}>
                      {group.saints.length} {group.saints.length === 1 ? 'saint' : 'saints'}
                    </div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: '#999', fontSize: '0.9rem' }}></i>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Back Button & Country Header */}
          <div className={styles.saintListHeader}>
            <button className={styles.backButton} onClick={handleBack}>
              <i className="fas fa-chevron-left"></i> Countries
            </button>
            <div className={styles.selectedCountry}>
              <span className={styles.selectedFlag}>{selectedCountry.flag}</span>
              <span className={styles.selectedName}>{selectedCountry.name}</span>
            </div>
          </div>

          {/* Saints List */}
          <div className={styles.saintsList}>
            <ListGroup>
              {selectedSaints.map((saint) => (
                <ListGroup.Item
                  key={saint.slug}
                  className={styles.saintItem}
                >
                  <div className={styles.saintAvatar}>
                    {saint.imageUrl ? (
                      <img src={saint.imageUrl} alt={saint.displayName} />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                  <div className={styles.saintInfo}>
                    <div className={styles.saintName}>{saint.displayName}</div>
                    {saint.birthPlace && (
                      <div className={styles.saintLocation}>
                        <i className="fas fa-map-marker-alt"></i> {saint.birthPlace}
                      </div>
                    )}
                    {saint.era && (
                      <div className={styles.saintEra}>{saint.era}</div>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </>
      )}
    </div>
  )
}


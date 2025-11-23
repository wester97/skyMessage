// Map location strings to standardized countries with flags
export interface CountryInfo {
  name: string;
  flag: string;
}

export const COUNTRY_MAPPINGS: Record<string, CountryInfo> = {
  // Italy
  'Italy': { name: 'Italy', flag: '🇮🇹' },
  'Sicily': { name: 'Italy', flag: '🇮🇹' },
  'Assisi': { name: 'Italy', flag: '🇮🇹' },
  'Siena': { name: 'Italy', flag: '🇮🇹' },
  'Milan': { name: 'Italy', flag: '🇮🇹' },
  'Nursia': { name: 'Italy', flag: '🇮🇹' },
  'Magenta': { name: 'Italy', flag: '🇮🇹' },
  'Pietrelcina': { name: 'Italy', flag: '🇮🇹' },
  
  // France
  'France': { name: 'France', flag: '🇫🇷' },
  'Aquitaine': { name: 'France', flag: '🇫🇷' },
  'Domremy': { name: 'France', flag: '🇫🇷' },
  'Pibrac': { name: 'France', flag: '🇫🇷' },
  'Poissy': { name: 'France', flag: '🇫🇷' },
  'Cuvilly': { name: 'France', flag: '🇫🇷' },
  
  // Spain
  'Spain': { name: 'Spain', flag: '🇪🇸' },
  'Calaroga': { name: 'Spain', flag: '🇪🇸' },
  'Azpeitia': { name: 'Spain', flag: '🇪🇸' },
  'Barbastro': { name: 'Spain', flag: '🇪🇸' },
  'Avila': { name: 'Spain', flag: '🇪🇸' },
  
  // England
  'England': { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'London': { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Walton': { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  
  // Ireland
  'Ireland': { name: 'Ireland', flag: '🇮🇪' },
  'Faughart': { name: 'Ireland', flag: '🇮🇪' },
  
  // Scotland
  'Scotland': { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Kilpatrick': { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  
  // Poland
  'Poland': { name: 'Poland', flag: '🇵🇱' },
  'Głogowiec': { name: 'Poland', flag: '🇵🇱' },
  
  // Germany
  'Germany': { name: 'Germany', flag: '🇩🇪' },
  'Breslau': { name: 'Germany', flag: '🇩🇪' },
  
  // Netherlands
  'Netherlands': { name: 'Netherlands', flag: '🇳🇱' },
  'Amsterdam': { name: 'Netherlands', flag: '🇳🇱' },
  
  // Hungary
  'Hungary': { name: 'Hungary', flag: '🇭🇺' },
  'Pressburg': { name: 'Hungary', flag: '🇭🇺' },
  
  // North Macedonia
  'Macedonia': { name: 'North Macedonia', flag: '🇲🇰' },
  'Skopje': { name: 'North Macedonia', flag: '🇲🇰' },
  
  // Holy Land / Middle East
  'Israel': { name: 'Israel', flag: '🇮🇱' },
  'Bethlehem': { name: 'Israel', flag: '🇮🇱' },
  'Bethsaida': { name: 'Israel', flag: '🇮🇱' },
  'Galilee': { name: 'Israel', flag: '🇮🇱' },
  'Palestine': { name: 'Palestine', flag: '🇵🇸' },
  'Lydda': { name: 'Palestine', flag: '🇵🇸' },
  'Syria': { name: 'Syria', flag: '🇸🇾' },
  'Antioch': { name: 'Syria', flag: '🇸🇾' },
  
  // Africa
  'Numidia': { name: 'Algeria', flag: '🇩🇿' },
  'Tagaste': { name: 'Algeria', flag: '🇩🇿' },
  'Sudan': { name: 'Sudan', flag: '🇸🇩' },
  
  // Rome (as its own entity given historical importance)
  'Rome': { name: 'Italy', flag: '🇮🇹' },
  
  // Historical regions that map to modern countries
  'Kingdom of Naples': { name: 'Italy', flag: '🇮🇹' },
  'Rocca Secca': { name: 'Italy', flag: '🇮🇹' },
};

// Extract country from birthPlace string
export function extractCountry(birthPlace: string | undefined): CountryInfo | null {
  if (!birthPlace) return null;
  
  // Check each mapping key to see if it's in the birthPlace string
  for (const [key, country] of Object.entries(COUNTRY_MAPPINGS)) {
    if (birthPlace.includes(key)) {
      return country;
    }
  }
  
  return null;
}


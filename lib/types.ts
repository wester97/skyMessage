export interface Saint {
  slug: string
  displayName: string
  aliases?: string[]
  era?: string
  feastDay?: string // Format: MM-DD
  patronages?: string[]
  birthDate?: string // Format: "c. 1181" or "1910"
  deathDate?: string // Format: "1226" or "October 3, 1226"
  birthPlace?: string // Format: "City, Country"
  imageUrl?: string // Wikimedia/Wikidata image URL
  hasBeard?: boolean // Whether the saint is typically depicted with a beard
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'speaker'
  content: string
  timestamp: Date
  saint?: string
  sources?: Array<{
    publisher?: string
    url?: string
  }>
  speaker?: string // Initial or name for dialogue speakers (G for God, J for Jesus, etc.)
}

export interface AskSaintRequest {
  text: string
  saintSlug?: string
  style?: 'saint' | 'emoji-story' | 'plain'
  audience?: 'kids' | 'adult'
}

export interface AskSaintResponse {
  text: string
  sources: Array<{
    publisher?: string
    url?: string
  }>
  saint: string
}


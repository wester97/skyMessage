/**
 * Questions for the Confirmation Saint Finder
 * Each question has two options that users can swipe/tap to choose
 */

export interface Question {
  id: string
  text: string
  optionA: {
    text: string
    icon?: string
    traits: string[] // Traits/virtues this option represents
  }
  optionB: {
    text: string
    icon?: string
    traits: string[] // Traits/virtues this option represents
  }
}

export const CONFIRMATION_QUESTIONS: Question[] = [
  {
    id: 'gender',
    text: 'Do you have a preference?',
    optionA: {
      text: 'Male Saints',
      icon: 'fa-mars',
      traits: ['male']
    },
    optionB: {
      text: 'Female Saints',
      icon: 'fa-venus',
      traits: ['female']
    }
  },
  {
    id: 'popularity',
    text: 'What kind of saint do you want?',
    optionA: {
      text: 'Well-known & Popular',
      icon: 'fa-star',
      traits: ['popular']
    },
    optionB: {
      text: 'Hidden Gem & Obscure',
      icon: 'fa-gem',
      traits: ['obscure']
    }
  },
  {
    id: 'era',
    text: 'Which era appeals to you?',
    optionA: {
      text: 'Ancient & Early Church',
      icon: 'fa-scroll',
      traits: ['ancient', 'early_church']
    },
    optionB: {
      text: 'Modern & Recent',
      icon: 'fa-clock',
      traits: ['modern', 'recent']
    }
  },
  {
    id: 'virtue_charity',
    text: 'What matters more to you?',
    optionA: {
      text: 'Serving the Poor',
      icon: 'fa-hands-helping',
      traits: ['charity', 'service', 'compassion']
    },
    optionB: {
      text: 'Deep Prayer & Contemplation',
      icon: 'fa-pray',
      traits: ['prayer', 'contemplation', 'mysticism']
    }
  },
  {
    id: 'virtue_courage',
    text: 'How do you face challenges?',
    optionA: {
      text: 'Bold Action & Leadership',
      icon: 'fa-shield-alt',
      traits: ['courage', 'leadership', 'action']
    },
    optionB: {
      text: 'Quiet Strength & Patience',
      icon: 'fa-dove',
      traits: ['patience', 'humility', 'endurance']
    }
  },
  {
    id: 'virtue_faith',
    text: 'What describes your faith journey?',
    optionA: {
      text: 'Convert & Transformation',
      icon: 'fa-exchange-alt',
      traits: ['conversion', 'transformation', 'redemption']
    },
    optionB: {
      text: 'Lifelong Devotion',
      icon: 'fa-heart',
      traits: ['devotion', 'consistency', 'faithfulness']
    }
  },
  {
    id: 'vocation',
    text: 'What path calls to you?',
    optionA: {
      text: 'Religious Life & Monasticism',
      icon: 'fa-church',
      traits: ['monastic', 'religious_life', 'contemplation']
    },
    optionB: {
      text: 'Lay Life & Family',
      icon: 'fa-home',
      traits: ['family', 'marriage', 'lay_life']
    }
  },
  {
    id: 'suffering',
    text: 'How do you view suffering?',
    optionA: {
      text: 'Martyrdom & Sacrifice',
      icon: 'fa-cross',
      traits: ['martyrdom', 'sacrifice', 'witness']
    },
    optionB: {
      text: 'Illness & Redemptive Suffering',
      icon: 'fa-heartbeat',
      traits: ['illness', 'suffering', 'redemption']
    }
  },
  {
    id: 'education',
    text: 'What matters more?',
    optionA: {
      text: 'Learning & Teaching',
      icon: 'fa-graduation-cap',
      traits: ['education', 'teaching', 'wisdom']
    },
    optionB: {
      text: 'Simple Faith & Trust',
      icon: 'fa-child',
      traits: ['simplicity', 'trust', 'innocence']
    }
  },
  {
    id: 'patronage',
    text: 'What are you passionate about?',
    optionA: {
      text: 'Specific Causes & Professions',
      icon: 'fa-briefcase',
      traits: ['patronage_specific']
    },
    optionB: {
      text: 'Universal Virtues',
      icon: 'fa-globe',
      traits: ['patronage_universal']
    }
  }
]

/**
 * Map saint attributes to traits for matching
 */
export function getSaintTraits(saint: {
  displayName: string
  era?: string
  patronages?: string[]
  birthDate?: string
  deathDate?: string
}): string[] {
  const traits: string[] = []
  const name = saint.displayName.toLowerCase()
  
  // Gender detection (basic)
  if (name.includes('mary') || name.includes('catherine') || name.includes('elizabeth') || 
      name.includes('teresa') || name.includes('therese') || name.includes('cecilia') ||
      name.includes('agatha') || name.includes('lucy') || name.includes('rose') ||
      name.includes('bernadette') || name.includes('gianna') || name.includes('brigid') ||
      name.includes('adelaide') || name.includes('monica') || name.includes('clare') ||
      name.includes('joan') || name.includes('faustina') || name.includes('kateri')) {
    traits.push('female')
  } else {
    traits.push('male')
  }
  
  // Era detection
  if (saint.era) {
    const era = saint.era.toLowerCase()
    if (era.includes('1st century') || era.includes('2nd century') || era.includes('3rd century') || 
        era.includes('4th century') || era.includes('early centuries')) {
      traits.push('ancient', 'early_church')
    } else if (era.includes('19th century') || era.includes('20th century') || 
               (saint.birthDate && parseInt(saint.birthDate) >= 1800)) {
      traits.push('modern', 'recent')
    }
  }
  
  // Popularity (heuristic: well-known saints)
  const popularSaints = [
    'francis', 'augustine', 'thomas', 'john', 'mary', 'joseph', 'peter', 'paul',
    'catherine', 'teresa', 'therese', 'joan', 'anthony', 'benedict', 'ignatius',
    'patrick', 'valentine', 'christopher', 'george', 'lucy', 'cecilia'
  ]
  const isPopular = popularSaints.some(pop => name.includes(pop))
  if (isPopular) {
    traits.push('popular')
  } else {
    traits.push('obscure')
  }
  
  // Patronages
  if (saint.patronages && saint.patronages.length > 0) {
    traits.push('patronage_specific')
  } else {
    traits.push('patronage_universal')
  }
  
  // Specific virtue indicators (from patronages and names)
  const patronagesStr = (saint.patronages || []).join(' ').toLowerCase()
  if (patronagesStr.includes('poor') || patronagesStr.includes('charity') || 
      patronagesStr.includes('hospitals') || patronagesStr.includes('homeless')) {
    traits.push('charity', 'service', 'compassion')
  }
  if (patronagesStr.includes('soldiers') || patronagesStr.includes('courage') || 
      name.includes('george') || name.includes('joan')) {
    traits.push('courage', 'leadership', 'action')
  }
  if (patronagesStr.includes('students') || patronagesStr.includes('teachers') || 
      patronagesStr.includes('education') || patronagesStr.includes('philosophers')) {
    traits.push('education', 'teaching', 'wisdom')
  }
  if (name.includes('francis') || name.includes('clare') || name.includes('benedict') ||
      name.includes('domin') || name.includes('ignatius')) {
    traits.push('monastic', 'religious_life')
  }
  if (name.includes('mary') || name.includes('joseph') || name.includes('gianna') ||
      name.includes('elizabeth') || name.includes('monica')) {
    traits.push('family', 'marriage', 'lay_life')
  }
  if (name.includes('augustine') || name.includes('ignatius') || name.includes('francis')) {
    traits.push('conversion', 'transformation')
  }
  if (patronagesStr.includes('martyr') || name.includes('stephen') || 
      name.includes('lawrence') || name.includes('sebastian')) {
    traits.push('martyrdom', 'sacrifice', 'witness')
  }
  
  return traits
}


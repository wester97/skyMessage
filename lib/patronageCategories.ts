/**
 * Patronage Categories and Structure
 */

export interface PatronageCategory {
  id: string
  name: string
  icon: string
  color: string
  subcategories: PatronageSubcategory[]
}

export interface PatronageSubcategory {
  id: string
  name: string
  patronages: string[]
}

export const PATRONAGE_CATEGORIES: PatronageCategory[] = [
  {
    id: 'people-life',
    name: 'People & Life Stages',
    icon: 'fa-users',
    color: '#FF6B6B',
    subcategories: [
      {
        id: 'children-youth',
        name: 'Children & Youth',
        patronages: ['children', 'youth', 'students', 'schoolchildren', 'boys', 'girls', 'apprentices'],
      },
      {
        id: 'family',
        name: 'Family & Marriage',
        patronages: ['marriage', 'families', 'mothers', 'fathers', 'parents', 'parenthood', 'widows', 'difficult marriages'],
      },
      {
        id: 'elderly',
        name: 'Elderly',
        patronages: ['elderly people', 'aged', 'seniors'],
      },
    ],
  },
  {
    id: 'work-professions',
    name: 'Work & Professions',
    icon: 'fa-briefcase',
    color: '#4ECDC4',
    subcategories: [
      {
        id: 'education',
        name: 'Education',
        patronages: ['students', 'teachers', 'schools', 'colleges', 'Catholic universities', 'education', 'educators'],
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        patronages: ['nurses', 'doctors', 'physicians', 'sick', 'hospitals', 'caregivers'],
      },
      {
        id: 'business',
        name: 'Business & Trade',
        patronages: ['merchants', 'business', 'finance', 'trades'],
      },
      {
        id: 'creative',
        name: 'Creative Arts',
        patronages: ['musicians', 'artists', 'writers', 'church music', 'editors', 'publishers'],
      },
      {
        id: 'technical',
        name: 'Technical & Trades',
        patronages: ['engineers', 'builders', 'craftsmen'],
      },
    ],
  },
  {
    id: 'health-healing',
    name: 'Health & Healing',
    icon: 'fa-heart-pulse',
    color: '#95E1D3',
    subcategories: [
      {
        id: 'illness',
        name: 'Physical Illness',
        patronages: ['sick', 'illness', 'disease', 'pain', 'suffering'],
      },
      {
        id: 'specific-conditions',
        name: 'Specific Conditions',
        patronages: ['cancer', 'infertility', 'pregnancy', 'childbirth'],
      },
      {
        id: 'mental-health',
        name: 'Mental Health',
        patronages: ['depression', 'anxiety', 'stress relief', 'mental illness'],
      },
    ],
  },
  {
    id: 'spiritual-life',
    name: 'Spiritual Life',
    icon: 'fa-hands-praying',
    color: '#C7CEEA',
    subcategories: [
      {
        id: 'prayer-faith',
        name: 'Prayer & Faith',
        patronages: ['faith', 'prayer', 'conversion', 'seekers', 'people ridiculed for their faith', 'Divine Mercy'],
      },
      {
        id: 'difficult-causes',
        name: 'Difficult Causes',
        patronages: ['impossible causes', 'lost causes', 'desperate situations'],
      },
      {
        id: 'religious-life',
        name: 'Religious Life',
        patronages: ['priests', 'parish priests', 'religious', 'vocations', 'monks'],
      },
    ],
  },
  {
    id: 'daily-life',
    name: 'Daily Life & Protection',
    icon: 'fa-shield-halved',
    color: '#FFB6B9',
    subcategories: [
      {
        id: 'travel',
        name: 'Travel & Journeys',
        patronages: ['travelers', 'pilots', 'journeys', 'safe travel'],
      },
      {
        id: 'lost-things',
        name: 'Lost Things',
        patronages: ['lost items', 'lost articles', 'lost people', 'lost souls'],
      },
      {
        id: 'nature-animals',
        name: 'Nature & Animals',
        patronages: ['animals', 'environment', 'ecology', 'nature'],
      },
      {
        id: 'protection',
        name: 'Protection',
        patronages: ['against fire', 'against dangers', 'protection', 'safety'],
      },
    ],
  },
  {
    id: 'places-causes',
    name: 'Places & Causes',
    icon: 'fa-earth-americas',
    color: '#FFEAA7',
    subcategories: [
      {
        id: 'countries',
        name: 'Countries & Cities',
        patronages: ['Italy', 'Ireland', 'France', 'Europe'],
      },
      {
        id: 'social-justice',
        name: 'Social Justice',
        patronages: ['the poor', 'poor children', 'oppressed people', 'charity', 'social justice', 'abuse victims'],
      },
      {
        id: 'mission',
        name: 'Mission & Service',
        patronages: ['missionaries', 'missions', 'evangelization'],
      },
    ],
  },
];


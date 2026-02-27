/**
 * PTU Trainer Class reference data for character creation.
 *
 * Encodes class names, categories, associated skills, and descriptions
 * from PTU Core Chapter 4 (pp. 65-166).
 *
 * Scope note: This file encodes names, categories, and associated skills only.
 * Full prerequisite trees are NOT included -- the GM is expected to know the
 * rules; the UI provides convenient selection, not deep prerequisite enforcement.
 */

export interface TrainerClassDef {
  name: string
  category: TrainerClassCategory
  associatedSkills: string[]
  description: string
  /** Can be taken multiple times with different specializations (e.g., Type Ace, Stat Ace) */
  isBranching?: boolean
}

export type TrainerClassCategory =
  | 'Introductory'
  | 'Battling Style'
  | 'Specialist Team'
  | 'Professional'
  | 'Fighter'
  | 'Supernatural'

/** All trainer class categories in display order */
export const TRAINER_CLASS_CATEGORIES: TrainerClassCategory[] = [
  'Introductory',
  'Battling Style',
  'Specialist Team',
  'Professional',
  'Fighter',
  'Supernatural'
]

/** Maximum trainer classes a character can have (PTU Core p. 65) */
export const MAX_TRAINER_CLASSES = 4

export const TRAINER_CLASSES: TrainerClassDef[] = [
  // --- Introductory ---
  { name: 'Ace Trainer', category: 'Introductory', associatedSkills: ['Command'], description: 'Dedicated training regimen for your Pokemon' },
  { name: 'Capture Specialist', category: 'Introductory', associatedSkills: ['Acrobatics', 'Athletics', 'Stealth', 'Survival', 'Perception', 'Guile'], description: 'Master of catching Pokemon' },
  { name: 'Commander', category: 'Introductory', associatedSkills: ['Command'], description: 'Tactical battlefield Orders' },
  { name: 'Coordinator', category: 'Introductory', associatedSkills: ['Charm', 'Command', 'Guile', 'Intimidate', 'Intuition'], description: 'Pokemon Contest specialist' },
  { name: 'Hobbyist', category: 'Introductory', associatedSkills: ['General Ed', 'Perception'], description: 'Jack of all trades with extra skill edges' },
  { name: 'Mentor', category: 'Introductory', associatedSkills: ['Charm', 'Intuition', 'Intimidate', 'Pokemon Ed'], description: 'Draws out hidden potential in Pokemon' },

  // --- Battling Style ---
  { name: 'Cheerleader', category: 'Battling Style', associatedSkills: ['Charm'], description: 'Motivates Pokemon to victory through belief' },
  { name: 'Duelist', category: 'Battling Style', associatedSkills: ['Focus'], description: 'Gains momentum over time in battle' },
  { name: 'Enduring Soul', category: 'Battling Style', associatedSkills: ['Athletics', 'Focus'], description: 'Pokemon shake off injuries through tenacity' },
  { name: 'Juggler', category: 'Battling Style', associatedSkills: ['Acrobatics', 'Guile'], description: 'Quickly cycles through Pokemon team' },
  { name: 'Rider', category: 'Battling Style', associatedSkills: ['Acrobatics', 'Athletics'], description: 'Fights mounted on Pokemon' },
  { name: 'Taskmaster', category: 'Battling Style', associatedSkills: ['Intimidate'], description: 'Brutal training at any cost' },
  { name: 'Trickster', category: 'Battling Style', associatedSkills: ['Guile'], description: 'Outwits opponents with Status Moves' },

  // --- Specialist Team ---
  { name: 'Stat Ace', category: 'Specialist Team', associatedSkills: ['Command', 'Focus'], description: 'Specializes in a Combat Stat', isBranching: true },
  { name: 'Style Expert', category: 'Specialist Team', associatedSkills: ['Charm', 'Command', 'Guile', 'Intimidate', 'Intuition'], description: 'Specializes in a Contest Stat', isBranching: true },
  { name: 'Type Ace', category: 'Specialist Team', associatedSkills: [], description: 'Specializes in a Pokemon Type (skills vary by chosen type)', isBranching: true },

  // --- Professional ---
  { name: 'Chef', category: 'Professional', associatedSkills: ['Intuition'], description: 'Feeds and heals allies with cooking' },
  { name: 'Chronicler', category: 'Professional', associatedSkills: ['Perception'], description: 'Observes and records everything' },
  { name: 'Fashionista', category: 'Professional', associatedSkills: ['Charm', 'Command', 'Guile', 'Intimidate', 'Intuition'], description: 'Personal style with Accessories' },
  { name: 'Researcher', category: 'Professional', associatedSkills: ['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed', 'Survival'], description: 'Academic specialist with Fields of Study', isBranching: true },
  { name: 'Survivalist', category: 'Professional', associatedSkills: ['Survival'], description: 'Master of wilderness terrains' },

  // --- Fighter ---
  { name: 'Athlete', category: 'Fighter', associatedSkills: ['Athletics'], description: 'Physically fit Trainer combatant' },
  { name: 'Dancer', category: 'Fighter', associatedSkills: ['Acrobatics', 'Athletics', 'Charm'], description: 'Graceful combat through dance' },
  { name: 'Hunter', category: 'Fighter', associatedSkills: ['Stealth', 'Survival'], description: 'Tracks and captures quarry' },
  { name: 'Martial Artist', category: 'Fighter', associatedSkills: ['Combat'], description: 'Hand-to-hand fighter', isBranching: true },
  { name: 'Musician', category: 'Fighter', associatedSkills: ['Charm', 'Focus'], description: 'Fights with musical abilities' },
  { name: 'Provocateur', category: 'Fighter', associatedSkills: ['Charm', 'Guile', 'Intimidate'], description: 'Silver tongue in battle' },
  { name: 'Rogue', category: 'Fighter', associatedSkills: ['Acrobatics', 'Athletics', 'Stealth'], description: 'Dark-typed stealth fighter' },
  { name: 'Roughneck', category: 'Fighter', associatedSkills: ['Intimidate'], description: 'Fear tactics and brute force' },
  { name: 'Tumbler', category: 'Fighter', associatedSkills: ['Acrobatics'], description: 'Agile close-range fighter' },

  // --- Supernatural ---
  { name: 'Aura Guardian', category: 'Supernatural', associatedSkills: ['Intuition'], description: 'Aura-powered combat' },
  { name: 'Channeler', category: 'Supernatural', associatedSkills: ['Intuition'], description: 'Emotional Pokemon bond' },
  { name: 'Hex Maniac', category: 'Supernatural', associatedSkills: ['Occult Ed'], description: 'Curses and hexes' },
  { name: 'Ninja', category: 'Supernatural', associatedSkills: ['Combat', 'Stealth'], description: 'Illusions and stealth techniques' },
  { name: 'Oracle', category: 'Supernatural', associatedSkills: ['Intuition', 'Perception'], description: 'Visions and foresight' },
  { name: 'Sage', category: 'Supernatural', associatedSkills: ['Occult Ed'], description: 'Blessings and wards' },
  { name: 'Telekinetic', category: 'Supernatural', associatedSkills: ['Focus'], description: 'Move objects with the mind' },
  { name: 'Telepath', category: 'Supernatural', associatedSkills: ['Focus', 'Intuition'], description: 'Read and influence minds' },
  { name: 'Warper', category: 'Supernatural', associatedSkills: ['Focus', 'Guile'], description: 'Teleportation powers' }
]

/**
 * Valid specializations for each branching class (decree-022).
 *
 * Type Ace → 18 Pokemon types
 * Stat Ace → 6 combat stats
 * Style Expert → 5 contest stats
 * Researcher → fields of study (PTU Core p. 127)
 * Martial Artist → martial art styles (PTU Core p. 143)
 */
export const BRANCHING_CLASS_SPECIALIZATIONS: Record<string, readonly string[]> = {
  'Type Ace': [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ],
  'Stat Ace': ['Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed'],
  'Style Expert': ['Cool', 'Beautiful', 'Cute', 'Smart', 'Tough'],
  // PTU grants 2 Fields of Study per Researcher instance (Core p. 4163),
  // but the tool records 1 specialization per class entry — the GM tracks
  // the second field outside the tool.
  'Researcher': [
    'General Research', 'Apothecary', 'Artificer', 'Botany', 'Chemistry',
    'Climatology', 'Occultism', 'Paleontology', 'Pokemon Caretaking'
  ],
  'Martial Artist': [
    'Aura', 'Cover', 'Elemental', 'Focused', 'Form', 'Freestyle', 'Parkour', 'Weapons'
  ]
} as const

/**
 * Get valid specializations for a branching class, or empty array if not branching.
 */
export function getBranchingSpecializations(className: string): readonly string[] {
  return BRANCHING_CLASS_SPECIALIZATIONS[className] ?? []
}

/**
 * Check if a trainer class entry (which may include specialization suffix) has a specific base class.
 * Per decree-022: use startsWith prefix matching for branching classes.
 *
 * Examples:
 *   hasBaseClass('Type Ace: Fire', 'Type Ace') → true
 *   hasBaseClass('Type Ace', 'Type Ace') → true
 *   hasBaseClass('Ace Trainer', 'Type Ace') → false
 */
export function hasBaseClass(classEntry: string, baseName: string): boolean {
  return classEntry === baseName || classEntry.startsWith(`${baseName}: `)
}

/**
 * Extract the base class name from a class entry (strips specialization suffix).
 *
 * Examples:
 *   getBaseClassName('Type Ace: Fire') → 'Type Ace'
 *   getBaseClassName('Ace Trainer') → 'Ace Trainer'
 */
export function getBaseClassName(classEntry: string): string {
  const colonIndex = classEntry.indexOf(': ')
  if (colonIndex === -1) return classEntry
  const baseName = classEntry.substring(0, colonIndex)
  // Only strip if the base name is a known branching class
  if (baseName in BRANCHING_CLASS_SPECIALIZATIONS) return baseName
  return classEntry
}

/**
 * Extract the specialization from a class entry, or null if none.
 *
 * Examples:
 *   getSpecialization('Type Ace: Fire') → 'Fire'
 *   getSpecialization('Ace Trainer') → null
 */
export function getSpecialization(classEntry: string): string | null {
  const colonIndex = classEntry.indexOf(': ')
  if (colonIndex === -1) return null
  const baseName = classEntry.substring(0, colonIndex)
  if (baseName in BRANCHING_CLASS_SPECIALIZATIONS) {
    return classEntry.substring(colonIndex + 2)
  }
  return null
}

/** Get trainer classes grouped by category */
export function getClassesByCategory(): Record<TrainerClassCategory, TrainerClassDef[]> {
  return TRAINER_CLASS_CATEGORIES.reduce((acc, category) => ({
    ...acc,
    [category]: TRAINER_CLASSES.filter(c => c.category === category)
  }), {} as Record<TrainerClassCategory, TrainerClassDef[]>)
}

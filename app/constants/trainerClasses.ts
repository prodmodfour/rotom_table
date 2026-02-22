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
  { name: 'Juggler', category: 'Battling Style', associatedSkills: ['Acrobatics'], description: 'Quickly cycles through Pokemon team' },
  { name: 'Rider', category: 'Battling Style', associatedSkills: ['Acrobatics', 'Athletics'], description: 'Fights mounted on Pokemon' },
  { name: 'Taskmaster', category: 'Battling Style', associatedSkills: ['Intimidate'], description: 'Brutal training at any cost' },
  { name: 'Trickster', category: 'Battling Style', associatedSkills: ['Guile'], description: 'Outwits opponents with Status Moves' },

  // --- Specialist Team ---
  { name: 'Stat Ace', category: 'Specialist Team', associatedSkills: ['Command', 'Focus'], description: 'Specializes in a Combat Stat', isBranching: true },
  { name: 'Style Expert', category: 'Specialist Team', associatedSkills: ['Charm', 'Intuition'], description: 'Specializes in a Contest Stat', isBranching: true },
  { name: 'Type Ace', category: 'Specialist Team', associatedSkills: ['Command', 'Pokemon Ed'], description: 'Specializes in a Pokemon Type', isBranching: true },

  // --- Professional ---
  { name: 'Chef', category: 'Professional', associatedSkills: ['Intuition', 'Survival'], description: 'Feeds and heals allies with cooking' },
  { name: 'Chronicler', category: 'Professional', associatedSkills: ['Perception'], description: 'Observes and records everything' },
  { name: 'Fashionista', category: 'Professional', associatedSkills: ['Charm'], description: 'Personal style with Accessories' },
  { name: 'Researcher', category: 'Professional', associatedSkills: ['General Ed', 'Medicine Ed', 'Technology Ed', 'Pokemon Ed'], description: 'Academic specialist with Fields of Study', isBranching: true },
  { name: 'Survivalist', category: 'Professional', associatedSkills: ['Athletics', 'Survival'], description: 'Master of wilderness terrains' },

  // --- Fighter ---
  { name: 'Athlete', category: 'Fighter', associatedSkills: ['Athletics', 'Acrobatics'], description: 'Physically fit Trainer combatant' },
  { name: 'Dancer', category: 'Fighter', associatedSkills: ['Acrobatics', 'Combat'], description: 'Graceful combat through dance' },
  { name: 'Hunter', category: 'Fighter', associatedSkills: ['Perception', 'Stealth'], description: 'Tracks and captures quarry' },
  { name: 'Martial Artist', category: 'Fighter', associatedSkills: ['Combat', 'Athletics'], description: 'Hand-to-hand fighter', isBranching: true },
  { name: 'Musician', category: 'Fighter', associatedSkills: ['Charm', 'Focus'], description: 'Fights with musical abilities' },
  { name: 'Provocateur', category: 'Fighter', associatedSkills: ['Charm', 'Guile'], description: 'Silver tongue in battle' },
  { name: 'Rogue', category: 'Fighter', associatedSkills: ['Guile', 'Stealth'], description: 'Dark-typed stealth fighter' },
  { name: 'Roughneck', category: 'Fighter', associatedSkills: ['Intimidate'], description: 'Fear tactics and brute force' },
  { name: 'Tumbler', category: 'Fighter', associatedSkills: ['Acrobatics'], description: 'Agile close-range fighter' },

  // --- Supernatural ---
  { name: 'Aura Guardian', category: 'Supernatural', associatedSkills: ['Intuition', 'Focus'], description: 'Aura-powered combat' },
  { name: 'Channeler', category: 'Supernatural', associatedSkills: ['Intuition', 'Charm'], description: 'Emotional Pokemon bond' },
  { name: 'Hex Maniac', category: 'Supernatural', associatedSkills: ['Occult Ed', 'Focus'], description: 'Curses and hexes' },
  { name: 'Ninja', category: 'Supernatural', associatedSkills: ['Stealth', 'Acrobatics'], description: 'Illusions and stealth techniques' },
  { name: 'Oracle', category: 'Supernatural', associatedSkills: ['Occult Ed', 'Intuition'], description: 'Visions and foresight' },
  { name: 'Sage', category: 'Supernatural', associatedSkills: ['Occult Ed', 'Focus'], description: 'Blessings and wards' },
  { name: 'Telekinetic', category: 'Supernatural', associatedSkills: ['Focus'], description: 'Move objects with the mind' },
  { name: 'Telepath', category: 'Supernatural', associatedSkills: ['Focus', 'Intuition'], description: 'Read and influence minds' },
  { name: 'Warper', category: 'Supernatural', associatedSkills: ['Occult Ed', 'Focus'], description: 'Teleportation powers' }
]

/** Get trainer classes grouped by category */
export function getClassesByCategory(): Record<TrainerClassCategory, TrainerClassDef[]> {
  return TRAINER_CLASS_CATEGORIES.reduce((acc, category) => ({
    ...acc,
    [category]: TRAINER_CLASSES.filter(c => c.category === category)
  }), {} as Record<TrainerClassCategory, TrainerClassDef[]>)
}

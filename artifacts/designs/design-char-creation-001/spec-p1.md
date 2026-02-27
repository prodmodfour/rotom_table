# P1 Specification

## D. Trainer Class Constants (P1)

### New File: `app/constants/trainerClasses.ts`

Reference data for trainer class selection. This is a large data file encoding the class names, categories, associated skills (prerequisites), and brief descriptions from PTU Core Chapter 4.

```typescript
export interface TrainerClassDef {
  name: string
  category: 'Introductory' | 'Battling Style' | 'Specialist Team' | 'Professional' | 'Fighter' | 'Supernatural'
  associatedSkills: string[] // Skills that appear in prerequisites
  description: string // One-line summary
  isBranching?: boolean // Can be taken multiple times (e.g., Type Ace, Stat Ace)
}

export const TRAINER_CLASSES: TrainerClassDef[] = [
  // Introductory
  { name: 'Ace Trainer', category: 'Introductory', associatedSkills: ['Command'], description: 'Dedicated training regimen for your Pokemon' },
  { name: 'Capture Specialist', category: 'Introductory', associatedSkills: ['Survival', 'Pokemon Ed'], description: 'Master of catching Pokemon' },
  { name: 'Commander', category: 'Introductory', associatedSkills: ['Command', 'Intuition'], description: 'Tactical battlefield Orders' },
  { name: 'Coordinator', category: 'Introductory', associatedSkills: ['Charm', 'Focus'], description: 'Pokemon Contest specialist' },
  { name: 'Hobbyist', category: 'Introductory', associatedSkills: [], description: 'Jack of all trades with extra skill edges' },
  { name: 'Mentor', category: 'Introductory', associatedSkills: ['Intuition', 'Pokemon Ed'], description: 'Draws out hidden potential in Pokemon' },
  // Battling Style
  { name: 'Cheerleader', category: 'Battling Style', associatedSkills: ['Charm', 'Command'], description: 'Motivates Pokemon to victory through belief' },
  { name: 'Duelist', category: 'Battling Style', associatedSkills: ['Command', 'Focus'], description: 'Gains momentum over time in battle' },
  { name: 'Enduring Soul', category: 'Battling Style', associatedSkills: ['Focus', 'Intuition'], description: 'Pokemon shake off injuries through tenacity' },
  { name: 'Juggler', category: 'Battling Style', associatedSkills: ['Acrobatics'], description: 'Quickly cycles through Pokemon team' },
  { name: 'Rider', category: 'Battling Style', associatedSkills: ['Acrobatics', 'Athletics'], description: 'Fights mounted on Pokemon' },
  { name: 'Taskmaster', category: 'Battling Style', associatedSkills: ['Command', 'Intimidate'], description: 'Brutal training at any cost' },
  { name: 'Trickster', category: 'Battling Style', associatedSkills: ['Guile'], description: 'Outwits opponents with Status Moves' },
  // Specialist Team
  { name: 'Stat Ace', category: 'Specialist Team', associatedSkills: ['Command', 'Focus'], description: 'Specializes in a Combat Stat', isBranching: true },
  { name: 'Style Expert', category: 'Specialist Team', associatedSkills: ['Charm', 'Intuition'], description: 'Specializes in a Contest Stat', isBranching: true },
  { name: 'Type Ace', category: 'Specialist Team', associatedSkills: ['Command', 'Pokemon Ed'], description: 'Specializes in a Pokemon Type', isBranching: true },
  // Professional
  { name: 'Chef', category: 'Professional', associatedSkills: ['Intuition', 'Survival'], description: 'Feeds and heals allies with cooking' },
  { name: 'Chronicler', category: 'Professional', associatedSkills: ['Perception'], description: 'Observes and records everything' },
  { name: 'Fashionista', category: 'Professional', associatedSkills: ['Charm'], description: 'Personal style with Accessories' },
  { name: 'Researcher', category: 'Professional', associatedSkills: ['General Ed', 'Medicine Ed', 'Technology Ed', 'Pokemon Ed'], description: 'Academic specialist with Fields of Study', isBranching: true },
  { name: 'Survivalist', category: 'Professional', associatedSkills: ['Athletics', 'Survival'], description: 'Master of wilderness terrains' },
  // Fighter
  { name: 'Athlete', category: 'Fighter', associatedSkills: ['Athletics', 'Acrobatics'], description: 'Physically fit Trainer combatant' },
  { name: 'Dancer', category: 'Fighter', associatedSkills: ['Acrobatics', 'Combat'], description: 'Graceful combat through dance' },
  { name: 'Hunter', category: 'Fighter', associatedSkills: ['Perception', 'Stealth'], description: 'Tracks and captures quarry' },
  { name: 'Martial Artist', category: 'Fighter', associatedSkills: ['Combat', 'Athletics'], description: 'Hand-to-hand fighter', isBranching: true },
  { name: 'Musician', category: 'Fighter', associatedSkills: ['Charm', 'Focus'], description: 'Fights with musical abilities' },
  { name: 'Provocateur', category: 'Fighter', associatedSkills: ['Charm', 'Guile'], description: 'Silver tongue in battle' },
  { name: 'Rogue', category: 'Fighter', associatedSkills: ['Guile', 'Stealth'], description: 'Dark-typed stealth fighter' },
  { name: 'Roughneck', category: 'Fighter', associatedSkills: ['Intimidate'], description: 'Fear tactics and brute force' },
  { name: 'Tumbler', category: 'Fighter', associatedSkills: ['Acrobatics'], description: 'Agile close-range fighter' },
  // Supernatural
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

/** Maximum trainer classes a character can have (PTU Core p. 65) */
export const MAX_TRAINER_CLASSES = 4
```

**Scope note:** This file encodes names, categories, and associated skills only. Full prerequisite trees (e.g., "Requires 3 Features in Ace Trainer and Expert Command") are NOT included -- that level of automation is out of scope for this ticket. The GM is expected to know the rules; the UI provides convenient selection, not enforcement of deep prerequisite chains.

---


## E. Class/Feature/Edge Selection with Basic Validation (P1)

### New File: `app/components/create/ClassFeatureSection.vue`

#### User Flow: Class Selection

1. **Class picker**: Searchable list grouped by category (Introductory, Battling Style, etc.)
2. Selected classes shown as tags (matching `HumanClassesTab.vue` violet tag style)
3. Maximum 4 classes enforced (PTU Core p. 65)
4. Branching classes (Type Ace, Stat Ace, Researcher, Martial Artist) prompt for specialization name

#### User Flow: Feature Selection

1. **Feature name input**: Text input with "Add" button (free-text, not a full feature database)
2. Selected features shown as tags (teal tag style)
3. Counter: `Features: 3/4 (+1 Training Feature)`
4. One feature slot marked as "Training Feature (free, no prerequisites)"
5. Starting Trainers: 4 features + 1 Training Feature = 5 total

**Rationale for free-text:** PTU has hundreds of features across classes, supplements, and homebrew. Building a complete feature database with prerequisites is a large separate project. Free-text entry lets the GM type the feature name and keeps the form useful immediately. Future enhancement: autocomplete from a feature reference table.

### New File: `app/components/create/EdgeSelectionSection.vue`

#### User Flow: Edge Selection

1. **Edge name input**: Text input with "Add" button (free-text)
2. Selected edges shown as tags (yellow/warning tag style)
3. Counter: `Edges: 2/4`
4. Starting Trainers: 4 edges
5. **Skill Edge shortcut**: Button "Add Skill Edge" opens a dropdown of the 17 skills, selecting one adds "Skill Edge: [Skill Name]" and visually shows the skill rank-up in the skill grid

#### Validation

- Starting edges: exactly 4 (soft warning, not hard block -- GM may override for higher-level characters)
- Cannot raise skills above Novice at level 1 via Skill Edges (PTU p. 13)
- Cannot rank up Pathetic skills from background (PTU p. 14)

---


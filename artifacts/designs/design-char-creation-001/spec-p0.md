# P0 Specification

## A. PTU Skill Constants and Background Presets (P0)

### New File: `app/constants/trainerSkills.ts`

Pure reference data. No DB interaction.

```typescript
import type { SkillRank } from '~/types/character'

/** All 17 PTU trainer skills organized by category (PTU Core p. 33) */
export const PTU_SKILL_CATEGORIES = {
  Body: ['Acrobatics', 'Athletics', 'Combat', 'Intimidate', 'Stealth', 'Survival'] as const,
  Mind: ['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed', 'Guile', 'Perception'] as const,
  Spirit: ['Charm', 'Command', 'Focus', 'Intuition'] as const
} as const

export const PTU_ALL_SKILLS = [
  ...PTU_SKILL_CATEGORIES.Body,
  ...PTU_SKILL_CATEGORIES.Mind,
  ...PTU_SKILL_CATEGORIES.Spirit
] as const

export type PtuSkillName = typeof PTU_ALL_SKILLS[number]

/** Skill rank progression and dice rolls (PTU Core p. 33) */
export const SKILL_RANKS: { rank: SkillRank; value: number; dice: string }[] = [
  { rank: 'Pathetic', value: 1, dice: '1d6' },
  { rank: 'Untrained', value: 2, dice: '2d6' },
  { rank: 'Novice', value: 3, dice: '3d6' },
  { rank: 'Adept', value: 4, dice: '4d6' },
  { rank: 'Expert', value: 5, dice: '5d6' },
  { rank: 'Master', value: 6, dice: '6d6' }
]

/** Level prerequisites for skill ranks (PTU Core p. 34) */
export const SKILL_RANK_LEVEL_REQS: Partial<Record<SkillRank, number>> = {
  Adept: 2,
  Expert: 6,
  Master: 12
}

/** Default skill ranks before background (all Untrained) */
export function getDefaultSkills(): Record<PtuSkillName, SkillRank> {
  return Object.fromEntries(
    PTU_ALL_SKILLS.map(skill => [skill, 'Untrained' as SkillRank])
  ) as Record<PtuSkillName, SkillRank>
}
```

### New File: `app/constants/trainerBackgrounds.ts`

```typescript
import type { SkillRank } from '~/types/character'
import type { PtuSkillName } from './trainerSkills'

/** A PTU background modifies skill ranks (PTU Core pp. 14-15) */
export interface TrainerBackground {
  name: string
  description: string
  /** Skill raised to Adept */
  adeptSkill: PtuSkillName
  /** Skill raised to Novice */
  noviceSkill: PtuSkillName
  /** 3 skills lowered to Pathetic */
  patheticSkills: [PtuSkillName, PtuSkillName, PtuSkillName]
}

/** Sample backgrounds from PTU Core p. 14 */
export const SAMPLE_BACKGROUNDS: TrainerBackground[] = [
  {
    name: 'Fitness Training',
    description: 'Maybe you\'re a career soldier; maybe you\'re just a fitness nut.',
    adeptSkill: 'Athletics',
    noviceSkill: 'Acrobatics',
    patheticSkills: ['Guile', 'Intuition', 'Focus']
  },
  {
    name: 'Book Worm',
    description: 'Why go outside? Everything you need to know is right here on Bulbapedia!',
    adeptSkill: 'General Ed',
    noviceSkill: 'Pokemon Ed',
    patheticSkills: ['Athletics', 'Acrobatics', 'Combat']
  },
  {
    name: 'Hermit',
    description: 'You don\'t like people, and they tend to not like you.',
    adeptSkill: 'Occult Ed', // PTU: "Adept Education Skill" — player's choice; Occult Ed as default
    noviceSkill: 'Perception',
    patheticSkills: ['Charm', 'Guile', 'Intuition']
  },
  {
    name: 'Old Timer',
    description: 'Age comes with wisdom and experience, and bad hips.',
    adeptSkill: 'Focus',
    noviceSkill: 'Intuition',
    patheticSkills: ['Acrobatics', 'Combat', 'Technology Ed']
  },
  {
    name: 'Quick and Small',
    description: 'You\'re kind of skinny and weak, but smart and quick.',
    adeptSkill: 'Acrobatics',
    noviceSkill: 'Guile',
    patheticSkills: ['Athletics', 'Intimidate', 'Command']
  },
  {
    name: 'Rough',
    description: 'You\'re the kind of guy that\'s likely to end up with a nickname like Knuckles.',
    adeptSkill: 'Combat',
    noviceSkill: 'Intimidate',
    patheticSkills: ['Charm', 'Guile', 'Perception']
  },
  {
    name: 'Silver Tongued',
    description: 'You always know just what to say, but it\'s best no one ask you to get sweaty.',
    adeptSkill: 'Guile',
    noviceSkill: 'Charm',
    patheticSkills: ['Athletics', 'Combat', 'Survival']
  },
  {
    name: 'Street Rattata',
    description: 'Growing up on the street is rough. Well, for all those other suckers.',
    adeptSkill: 'Guile',
    noviceSkill: 'Perception',
    patheticSkills: ['Focus', 'General Ed', 'Survival']
  },
  {
    name: 'Super Nerd',
    description: 'You\'re smart and cunning, but your social skills...',
    adeptSkill: 'Technology Ed',
    noviceSkill: 'Guile',
    patheticSkills: ['Charm', 'Intimidate', 'Intuition']
  },
  {
    name: 'Wild Child',
    description: 'Maybe you were raised by Mightyenas. Or maybe you just had lousy parents.',
    adeptSkill: 'Survival',
    noviceSkill: 'Athletics',
    patheticSkills: ['General Ed', 'Technology Ed', 'Medicine Ed']
  },
  {
    name: 'At Least He\'s Pretty',
    description: 'Looks aren\'t everything... but they\'re better than nothing, right?',
    adeptSkill: 'Charm',
    noviceSkill: 'Command',
    patheticSkills: ['Combat', 'Intimidate', 'Perception']
  }
]
```

**Implementation note:** Some backgrounds list choices (e.g., "Novice Command *or* Intuition"). The constants encode one default; the UI should allow the user to pick from the options. Where a background says "one Education Skill at Adept, one at Novice", the UI provides dropdowns filtered to education skills. This complexity is deferred to the P1 tier to keep P0 focused. For P0, each background has a single default encoding, with a `// see note` comment flagging the ones that need choice UI in P1.

---


## B. Stat Allocation with PTU Constraints (P0)

### New File: `app/components/create/StatAllocationSection.vue`

Component for PTU-compliant stat allocation.

#### PTU Rules (Chapter 2, p. 15)

- Starting Trainers begin with **10 HP** and **5 in each other stat**
- Distribute **10 additional points** among combat stats
- **No more than 5 points** into any single stat
- Features with `[+HP]` tags add to HP (handled post-feature-selection)

#### User Flow

1. Display 6 stat boxes (HP, Atk, Def, SpA, SpD, Spe) with base values pre-filled
2. Each stat shows: `Base + Added = Total` (e.g., `10 + 3 = 13` for HP)
3. Remaining points pool displayed prominently: `Points Remaining: 7/10`
4. +/- buttons on each stat (or number input capped at base + 5)
5. Validation: total added points must equal 10, no single stat exceeds +5

#### Props/Events

```typescript
interface Props {
  level: number // affects maxHp formula display
}

interface Emits {
  'update:stats': [stats: Stats] // emits final computed stats
}
```

#### Computed Derived Display

Below the allocation grid, show auto-calculated derived values:
- Max HP: `Level * 2 + HP * 3 + 10` (already computed in POST endpoint)
- Evasions: `floor(Def/5)` Physical, `floor(SpD/5)` Special, `floor(Spe/5)` Speed

### Changes to `app/pages/gm/create.vue`

Replace the current raw stat inputs with `StatAllocationSection`. The `humanForm` reactive object gains:

```typescript
const humanForm = ref({
  name: '',
  characterType: 'npc' as 'player' | 'npc',
  level: 1,
  location: '',
  // Stats: base + added points
  statPoints: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
  // Skills, edges, features, classes — new fields
  skills: getDefaultSkills(),
  background: null as TrainerBackground | null,
  trainerClasses: [] as string[],
  features: [] as string[],
  edges: [] as string[],
  // Bio
  age: null as number | null,
  gender: null as string | null,
  height: null as number | null,
  weight: null as number | null,
  personalityText: '',
  goalsText: '',
  backgroundText: '',
  money: 5000,
  notes: ''
})
```

The final `createHuman()` function computes stats as: `{ hp: 10 + statPoints.hp, attack: 5 + statPoints.attack, ... }` and passes everything to the API.

---


## C. Skill Background Selection (P0)

### New File: `app/components/create/SkillBackgroundSection.vue`

#### User Flow

1. **Preset selector**: Dropdown of sample backgrounds from `SAMPLE_BACKGROUNDS`
2. Selecting a preset auto-fills the skill grid (Adept/Novice/Pathetic assignments)
3. **Custom option**: "Custom Background" entry at top of dropdown
4. In custom mode, the user can:
   - Pick 1 skill to raise to Adept
   - Pick 1 skill to raise to Novice
   - Pick 3 skills to lower to Pathetic
   - Enter a custom background name
5. **Skill grid display** below the selector showing all 17 skills with their current rank
   - Organized by category (Body / Mind / Spirit)
   - Color-coded ranks matching `HumanSkillsTab.vue` styling
   - Pathetic skills marked clearly (red left border, per existing pattern)
6. **Validation**:
   - Exactly 1 Adept, 1 Novice, 3 Pathetic (remaining all Untrained)
   - Pathetic skills cannot be raised above Pathetic during character creation (PTU p. 14)
   - Adept and Novice must be different skills

#### Props/Events

```typescript
interface Props {
  level: number // For skill rank cap display
}

interface Emits {
  'update:skills': [skills: Record<string, SkillRank>]
  'update:backgroundName': [name: string]
}
```

---


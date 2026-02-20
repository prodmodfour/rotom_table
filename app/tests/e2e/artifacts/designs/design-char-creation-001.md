---
design_id: design-char-creation-001
ticket_id: ptu-rule-056
category: FEATURE_GAP
scope: FULL
domain: character-lifecycle
status: p0-complete
affected_files:
  - app/pages/gm/create.vue
  - app/server/api/characters/index.post.ts
  - app/components/character/CharacterModal.vue
  - app/components/character/tabs/HumanClassesTab.vue
  - app/components/character/tabs/HumanSkillsTab.vue
  - app/components/character/tabs/NotesTab.vue
  - app/types/character.ts
  - app/stores/library.ts
new_files:
  - app/constants/trainerSkills.ts
  - app/constants/trainerBackgrounds.ts
  - app/constants/trainerClasses.ts
  - app/components/create/CreateHumanForm.vue
  - app/components/create/StatAllocationSection.vue
  - app/components/create/SkillBackgroundSection.vue
  - app/components/create/ClassFeatureSection.vue
  - app/components/create/EdgeSelectionSection.vue
  - app/components/create/BiographySection.vue
  - app/composables/useCharacterCreation.ts
  - app/utils/characterCreationValidation.ts
---

# Design: Expanded Character Creation Form (PTU Rules-Compliant)

## Summary

The current character creation form (`app/pages/gm/create.vue`) is a minimal stub that only collects name, character type, level, stats (raw numbers), and notes. All PTU character creation steps are missing: background selection, skill allocation, edge/feature selection, class selection, and biographical details. Full character data can only be entered via CSV import or post-creation editing through the character sheet modal.

This design expands the creation form to follow the PTU 1.05 character creation flow (Chapter 2, pp. 12-22) while preserving the existing quick-create path for NPCs. The form targets GM use -- the GM creates characters for both PCs and NPCs.

---

## PTU Character Creation Steps (Reference)

Per PTU 1.05 Chapter 2 (pp. 12-18), character creation follows 9 steps:

1. **Character Concept** -- brief phrase (name, type selection)
2. **Background** -- raises 1 skill to Adept, 1 to Novice, lowers 3 to Pathetic
3. **Choose Edges** -- 4 starting edges (Skill Edges raise skill ranks; specialty edges provide specific bonuses)
4. **Choose Features** -- 4 features + 1 free Training Feature (most come from Trainer Classes)
5. **Assign Combat Stats** -- 10 HP base, 5 each other stat, distribute 10 points (max 5 per stat)
6. **Derived Stats** -- auto-calculated (already implemented in `trainerDerivedStats.ts`)
7. **Basic Descriptions** -- name, appearance, personality, goals, background story
8. **Choose Pokemon** -- handled separately (pokemon creation flow)
9. **Money and Items** -- starting cash + inventory

Steps 2-4 can be done in any order (PTU p. 14: "You can take Steps 3 and 4 in any order").

---

## Current State Analysis

### What Exists

| PTU Step | DB Column | Create Form | Character Sheet (View/Edit) | CSV Import |
|---|---|---|---|---|
| Name/Type | `name`, `characterType` | Yes | Yes | Yes |
| Level | `level` | Yes | Yes | Yes |
| Stats (HP/Atk/Def/SpA/SpD/Spe) | `hp`, `attack`, etc. | Yes (raw numbers) | Yes (read-only) | Yes |
| Max HP | `maxHp` | Auto-calculated | Yes | Yes |
| Trainer Classes | `trainerClasses` (JSON) | **No** | View only (tags) | **No** (parsed from features col) |
| Skills | `skills` (JSON) | **No** | View only (grid) | Yes (17 skills) |
| Features | `features` (JSON) | **No** | View only (tags) | Yes (parsed) |
| Edges | `edges` (JSON) | **No** | View only (tags) | Yes (parsed) |
| Background | `background` | **No** | Edit via Notes tab | Yes |
| Personality | `personality` | **No** | Edit via Notes tab | **No** |
| Goals | `goals` | **No** | Edit via Notes tab | **No** |
| Age/Gender/Height/Weight | All exist | **No** | Age/Gender in header; Height/Weight in Stats tab | Age/Gender from CSV |
| Money | `money` | **No** | Edit via Stats tab | Yes |
| Location | `location` | NPC only | Yes | **No** |

### What is Missing from Create Form

- Skill background selection (or custom skill allocation)
- Edge selection (4 starting edges)
- Feature/Class selection (4 features + 1 Training Feature)
- Stat allocation with PTU constraints (10 HP base, 5 others, +10 to distribute, max 5 per stat)
- Biographical fields (age, gender, height, weight, background text, personality, goals)
- Money input

### DB Schema Status

**No schema changes needed.** All required columns already exist in the `HumanCharacter` model:
- `trainerClasses` (JSON string, default `[]`)
- `skills` (JSON string, default `{}`)
- `features` (JSON string, default `[]`)
- `edges` (JSON string, default `[]`)
- `background`, `personality`, `goals` (nullable strings)
- `age`, `gender`, `height`, `weight` (nullable)
- `money` (int, default 0)

The POST endpoint (`/api/characters/index.post.ts`) already accepts all these fields -- it just passes through whatever the client sends as JSON. The create form simply does not send them.

---

## Priority Map

| # | Feature | What it Does | Priority |
|---|---------|-------------|----------|
| A | PTU skill constants + background presets | Reference data for skills and backgrounds | **P0** |
| B | Stat allocation with PTU constraints | Enforce starting stat rules (10 HP, 5 base, +10 pool, max 5/stat) | **P0** |
| C | Skill background selection | Apply background presets or custom skill allocation | **P0** |
| D | Trainer class constants (name + prerequisites only) | Reference data for class selection UI | **P1** |
| E | Class/Feature selection with prerequisite validation | Select classes (max 4), features (4+1 Training), edges (4) | **P1** |
| F | Biographical fields section | Age, gender, height, weight, personality, goals, background text | **P2** |
| G | Quick-create vs Full-create mode toggle | Preserve current minimal path for NPCs, full path for PCs | **P2** |

---

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
    adeptSkill: 'Perception',
    noviceSkill: 'Perception', // "Adept Education Skill, Novice Perception" — see note
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

## F. Biographical Fields Section (P2)

### New File: `app/components/create/BiographySection.vue`

#### User Flow

Collapsible section with:
- Age (number input)
- Gender (text input, not select -- PTU allows any)
- Height (number input, cm, with lbs display toggle)
- Weight (number input, kg, with lbs display toggle + auto weight class display)
- Background Story (textarea, maps to `background` DB field)
- Personality (textarea)
- Goals (textarea)
- Money (number input, default 5000 for level 1 per PTU p. 17)

This section is optional -- all fields are nullable in the DB. The section is collapsed by default for NPC creation and expanded for Player Characters.

---

## G. Quick-Create vs Full-Create Mode Toggle (P2)

### User Flow

When the user selects "Human Character" on the create page:

1. **Two sub-modes** appear as tabs or radio buttons:
   - **Quick Create** (current flow, minimal): Name, Type, Level, raw Stats, Notes. For rapid NPC scaffolding.
   - **Full Create** (new flow, PTU-compliant): Multi-section form following PTU steps.

2. **Full Create sections** are displayed as an accordion or vertical stepper:
   - Section 1: Basic Info (name, type, level, location)
   - Section 2: Background & Skills
   - Section 3: Edges (4)
   - Section 4: Classes & Features (max 4 classes, 4+1 features)
   - Section 5: Combat Stats (10-point allocation)
   - Section 6: Biography (collapsible, optional)

3. Each section shows a completion indicator (checkmark when filled, count when partial)

4. The "Create" button is always enabled (no hard validation blocks -- the GM decides when the character is ready)

---

## Composable: `useCharacterCreation.ts`

### New File: `app/composables/useCharacterCreation.ts`

State management for the multi-section creation form. Encapsulates:

- Reactive form state (all fields)
- Background application logic (apply preset, compute skills)
- Stat point tracking (pool remaining, per-stat cap)
- Feature/edge counters
- Validation warnings (soft, not blocking)
- `buildCreatePayload()` -- transforms form state into the API body shape

```typescript
export function useCharacterCreation() {
  const form = reactive({
    // Basic
    name: '',
    characterType: 'npc' as CharacterType,
    level: 1,
    location: '',
    // Background
    backgroundPreset: null as TrainerBackground | null,
    backgroundName: '',
    // Skills
    skills: getDefaultSkills(),
    // Stats
    statPoints: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
    // Classes/Features/Edges
    trainerClasses: [] as string[],
    features: [] as string[],
    trainingFeature: '',
    edges: [] as string[],
    // Bio
    age: null as number | null,
    gender: null as string | null,
    height: null as number | null,
    weight: null as number | null,
    backgroundText: '',
    personality: '',
    goals: '',
    money: 5000,
    notes: ''
  })

  // --- Computed ---
  const statPointsUsed = computed(() =>
    Object.values(form.statPoints).reduce((sum, v) => sum + v, 0)
  )
  const statPointsRemaining = computed(() => 10 - statPointsUsed.value)

  const computedStats = computed((): Stats => ({
    hp: 10 + form.statPoints.hp,
    attack: 5 + form.statPoints.attack,
    defense: 5 + form.statPoints.defense,
    specialAttack: 5 + form.statPoints.specialAttack,
    specialDefense: 5 + form.statPoints.specialDefense,
    speed: 5 + form.statPoints.speed
  }))

  const maxHp = computed(() =>
    form.level * 2 + computedStats.value.hp * 3 + 10
  )

  const allFeatures = computed(() =>
    form.trainingFeature
      ? [...form.features, form.trainingFeature]
      : [...form.features]
  )

  // --- Actions ---
  function applyBackground(bg: TrainerBackground) {
    const skills = getDefaultSkills()
    skills[bg.adeptSkill] = 'Adept'
    skills[bg.noviceSkill] = 'Novice'
    for (const s of bg.patheticSkills) {
      skills[s] = 'Pathetic'
    }
    form.skills = skills
    form.backgroundPreset = bg
    form.backgroundName = bg.name
  }

  function buildCreatePayload() {
    return {
      name: form.name,
      characterType: form.characterType,
      level: form.level,
      location: form.location || undefined,
      stats: computedStats.value,
      maxHp: maxHp.value,
      currentHp: maxHp.value,
      trainerClasses: form.trainerClasses,
      skills: form.skills,
      features: allFeatures.value,
      edges: form.edges,
      age: form.age,
      gender: form.gender,
      height: form.height,
      weight: form.weight,
      background: form.backgroundText || undefined,
      personality: form.personality || undefined,
      goals: form.goals || undefined,
      money: form.money,
      notes: form.notes || undefined
    }
  }

  return {
    form,
    statPointsUsed,
    statPointsRemaining,
    computedStats,
    maxHp,
    allFeatures,
    applyBackground,
    buildCreatePayload
  }
}
```

---

## Validation Utility: `app/utils/characterCreationValidation.ts`

Pure validation functions for PTU character creation rules. Returns warning arrays, not errors -- the GM always has the final say.

```typescript
export interface CreationWarning {
  section: 'stats' | 'skills' | 'edges' | 'features' | 'classes'
  message: string
  severity: 'info' | 'warning'
}

export function validateStatAllocation(
  statPoints: Record<string, number>,
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const total = Object.values(statPoints).reduce((s, v) => s + v, 0)

  if (total !== 10 && level === 1) {
    warnings.push({
      section: 'stats',
      message: `Level 1 trainers should allocate exactly 10 stat points (currently ${total})`,
      severity: 'warning'
    })
  }

  for (const [stat, points] of Object.entries(statPoints)) {
    if (points > 5 && level === 1) {
      warnings.push({
        section: 'stats',
        message: `${stat} has ${points} added points (max 5 per stat at level 1)`,
        severity: 'warning'
      })
    }
  }

  return warnings
}

export function validateSkillBackground(
  skills: Record<string, string>,
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const ranks = Object.values(skills)
  const adeptCount = ranks.filter(r => r === 'Adept').length
  const noviceCount = ranks.filter(r => r === 'Novice').length
  const patheticCount = ranks.filter(r => r === 'Pathetic').length

  if (adeptCount !== 1) {
    warnings.push({ section: 'skills', message: `Background should set exactly 1 skill to Adept (found ${adeptCount})`, severity: 'warning' })
  }
  if (noviceCount !== 1) {
    warnings.push({ section: 'skills', message: `Background should set exactly 1 skill to Novice (found ${noviceCount})`, severity: 'warning' })
  }
  if (patheticCount !== 3) {
    warnings.push({ section: 'skills', message: `Background should set exactly 3 skills to Pathetic (found ${patheticCount})`, severity: 'warning' })
  }

  return warnings
}

export function validateEdgesAndFeatures(
  edges: string[],
  features: string[],
  trainerClasses: string[],
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []

  if (level === 1 && edges.length !== 4) {
    warnings.push({ section: 'edges', message: `Level 1 trainers start with 4 edges (have ${edges.length})`, severity: 'warning' })
  }
  if (level === 1 && features.length !== 5) {
    warnings.push({ section: 'features', message: `Level 1 trainers start with 5 features (4 + 1 Training) (have ${features.length})`, severity: 'warning' })
  }
  if (trainerClasses.length > 4) {
    warnings.push({ section: 'classes', message: `Maximum 4 trainer classes (have ${trainerClasses.length})`, severity: 'warning' })
  }

  return warnings
}
```

---

## Changes to Existing Files

### `app/pages/gm/create.vue`

**Major refactor.** The human form section is replaced with:

1. Quick/Full mode toggle (P2)
2. In P0/P1: the form is expanded in-place with new section components
3. The `createHuman()` function calls `buildCreatePayload()` from the composable
4. The Pokemon form is unchanged

The page becomes a layout shell that imports and composes the section components. The inline `humanForm` reactive object is replaced by the `useCharacterCreation()` composable.

### `app/server/api/characters/index.post.ts`

**No changes needed.** The endpoint already accepts `trainerClasses`, `skills`, `features`, `edges`, `background`, `personality`, `goals`, `age`, `gender`, `height`, `weight`, and `money`. It serializes arrays/objects to JSON for storage. The only change is that the client now actually sends these fields.

### `app/types/character.ts`

**No changes needed.** The `HumanCharacter` interface already has all the fields: `trainerClasses: string[]`, `skills: Record<string, SkillRank>`, `features: string[]`, `edges: string[]`, biographical fields, etc.

### `app/stores/library.ts`

**No changes needed.** The `createHuman()` action already passes `Partial<HumanCharacter>` to the API. The expanded form just sends more fields.

---

## Component Hierarchy (Final State)

```
pages/gm/create.vue
  |-- (mode toggle: Quick / Full)  [P2]
  |
  |-- Quick Mode: existing inline form (name, type, level, raw stats, notes)
  |
  |-- Full Mode:
      |-- Section 1: Basic Info (inline: name, type, level, location)
      |-- Section 2: SkillBackgroundSection.vue  [P0]
      |-- Section 3: EdgeSelectionSection.vue     [P1]
      |-- Section 4: ClassFeatureSection.vue      [P1]
      |-- Section 5: StatAllocationSection.vue    [P0]
      |-- Section 6: BiographySection.vue         [P2]
```

---

## Testing Strategy

### Unit Tests (Vitest)

| Test | Tier |
|---|---|
| `trainerSkills.ts` -- `getDefaultSkills()` returns all 17 skills as Untrained | P0 |
| `trainerBackgrounds.ts` -- each background has exactly 1 Adept, 1 Novice, 3 Pathetic | P0 |
| `characterCreationValidation.ts` -- stat allocation warnings for over/under 10 points | P0 |
| `characterCreationValidation.ts` -- skill background warnings for wrong counts | P0 |
| `characterCreationValidation.ts` -- edge/feature count warnings | P1 |
| `useCharacterCreation.ts` -- `applyBackground()` correctly modifies skills | P0 |
| `useCharacterCreation.ts` -- `buildCreatePayload()` produces correct API shape | P0 |
| `useCharacterCreation.ts` -- `statPointsRemaining` tracks correctly | P0 |

### E2E Tests (Playwright)

| Test | Tier |
|---|---|
| Create character with full stat allocation, verify DB record has correct stats | P0 |
| Create character with background preset, verify skills in DB match preset | P0 |
| Create character with classes, features, edges, verify all stored in DB | P1 |
| Stat point cap (cannot add >5 to single stat) | P0 |
| Full creation flow: background + skills + stats + edges + features + bio, verify everything persists | P2 |

---

## Out of Scope

- **Feature prerequisite enforcement**: Full prerequisite trees for hundreds of features would require a separate reference data project. The form uses free-text input.
- **Level-up flow**: This design covers creation only. Level-up stat/feature/edge additions are a separate system.
- **Player View creation**: This form is GM-only. Player self-service character creation is a future feature.
- **Pokemon selection during creation**: Step 8 (Choose Pokemon) is handled by the existing Pokemon creation flow and trainer linking.
- **Inventory/item management during creation**: Step 9 items are handled post-creation through the character sheet.

---

## Implementation Order

1. **P0 (constants + stat allocation + skill backgrounds)**
   - `app/constants/trainerSkills.ts`
   - `app/constants/trainerBackgrounds.ts`
   - `app/utils/characterCreationValidation.ts`
   - `app/composables/useCharacterCreation.ts`
   - `app/components/create/StatAllocationSection.vue`
   - `app/components/create/SkillBackgroundSection.vue`
   - Update `app/pages/gm/create.vue` to use new composable and sections
   - Unit tests for constants, validation, and composable

2. **P1 (class/feature/edge selection)**
   - `app/constants/trainerClasses.ts`
   - `app/components/create/ClassFeatureSection.vue`
   - `app/components/create/EdgeSelectionSection.vue`
   - Background choice variants (backgrounds with either/or options)
   - Unit + E2E tests

3. **P2 (biography + mode toggle)**
   - `app/components/create/BiographySection.vue`
   - Quick/Full mode toggle in create page
   - Full E2E creation flow test

---

## Implementation Log

### P0 Implementation (2026-02-20)

**Status:** Complete

**Files created:**
- `app/constants/trainerSkills.ts` -- 17 PTU skills by category, rank progression, level prereqs, `getDefaultSkills()`
- `app/constants/trainerBackgrounds.ts` -- 11 sample backgrounds with Adept/Novice/Pathetic assignments
- `app/utils/characterCreationValidation.ts` -- Pure validation: stat allocation, skill background, edge/feature counts
- `app/composables/useCharacterCreation.ts` -- Form state, stat tracking, background logic, payload builder
- `app/components/create/StatAllocationSection.vue` -- +/- stat buttons, 10-point pool, derived stats display
- `app/components/create/SkillBackgroundSection.vue` -- Preset dropdown, custom mode, categorized skill grid

**Files modified:**
- `app/pages/gm/create.vue` -- Replaced raw stat inputs with section components, uses composable

**Design decisions:**
- Composable returns computed refs; template accesses `.value` for prop bindings since the return is a plain object
- Background presets encode a single default for backgrounds with choice options (flagged for P1 enhancement)
- Custom background mode provides Adept/Novice dropdowns and Pathetic checkboxes (max 3)
- Validation is soft warnings only -- shown in summary section but never blocks form submission
- Hermit background encodes `Perception` Adept / `Survival` Novice as default (PTU variant noted in comment)

**Commits:**
1. `feat: add PTU trainer skill constants and background presets`
2. `feat: add character creation validation utility`
3. `feat: add useCharacterCreation composable`
4. `feat: add StatAllocationSection component for character creation`
5. `feat: add SkillBackgroundSection component for character creation`
6. `feat: integrate stat allocation and skill background into create page`

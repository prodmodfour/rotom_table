# Shared Specifications

## Existing Code Analysis

### 1. Character Level Editing (Current Flow)

The GM can change a trainer's level in two places:

**Standalone character page (`app/pages/gm/characters/[id].vue`):**
```html
<input v-model.number="editData.level" type="number" class="form-input" :disabled="!isEditing" />
```
The GM clicks "Edit", changes the level number, clicks "Save Changes". The `saveChanges()` function sends the full `editData` object to `PUT /api/characters/[id]`. No advancement logic runs.

**Character modal (`app/components/character/CharacterModal.vue`):**
Same pattern -- raw `v-model.number` binding on `editData.level`, saved via `emit('save', editData.value)`.

**The gap:** Changing level from 4 to 5 should trigger a guided workflow (stat allocation, skill choice, class choice at level 5), but currently the level number just updates directly with no prompts.

### 2. Existing Advancement Constants (`app/constants/trainerStats.ts`)

These pure functions already calculate **totals** at a given level:

| Function | Returns | Notes |
|----------|---------|-------|
| `getStatPointsForLevel(level)` | `10 + (level - 1)` | Total stat points at that level |
| `getExpectedEdgesForLevel(level)` | `{ base, bonusSkillEdges, total }` | Total edges including bonus Skill Edges at 2/6/12 |
| `getExpectedFeaturesForLevel(level)` | `5 + floor((level - 1) / 2)` | Total features including Training Feature |
| `getMaxSkillRankForLevel(level)` | `'Novice' / 'Adept' / 'Expert' / 'Master'` | Skill rank cap at that level |
| `isSkillRankAboveCap(rank, level)` | `boolean` | Whether a rank exceeds the level's cap |

**What is missing:** These functions compute totals, not deltas. For level-up, we need to know what changes when going from level N to level N+1. For example, going from level 4 to 5 grants +1 stat point, +1 feature (odd level), no edge (odd level), and triggers the Amateur Trainer milestone. A new `trainerAdvancement.ts` utility will compute per-level deltas.

### 3. Pokemon Level-Up Check (`app/utils/levelUpCheck.ts`)

A pure utility already exists for **Pokemon** level-up:

```typescript
export function checkLevelUp(input: LevelUpCheckInput): LevelUpInfo[]
export function summarizeLevelUps(infos: LevelUpInfo[]): { ... }
```

This returns per-level info: stat points gained, new moves, ability milestones, tutor points. The trainer advancement utility will follow the same pattern: pure functions returning per-level deltas, composable managing reactive state.

### 4. Character Creation Composable (`app/composables/useCharacterCreation.ts`)

The creation composable manages:
- Reactive form state (stats, skills, edges, features, classes)
- Stat point tracking (pool remaining, increment/decrement)
- Skill rank management (Pathetic blocking per decree-027)
- Edge/Feature add/remove with validation
- Class management (branching per decree-022)

**Reuse opportunity:** The level-up composable (`useTrainerLevelUp`) should NOT extend `useCharacterCreation` -- they have different concerns. Creation manages the full initial state; level-up manages deltas applied to an existing character. However, the level-up composable will reuse:

- **Stat point allocation pattern:** `incrementStat`/`decrementStat` with pool tracking
- **Skill rank management:** Rank progression logic, cap enforcement
- **Edge/Feature selection patterns:** Free-text input with validation
- **Class selection:** Reuse `ClassFeatureSection.vue` props/events pattern
- **Branching class handling:** decree-022 suffix format, decree-026 Martial Artist exclusion

### 5. Character Creation Components (Reuse Candidates)

| Component | What it Does | Reuse for Level-Up |
|-----------|-------------|-------------------|
| `StatAllocationSection.vue` | Stat point allocation with +/- buttons, pool tracking | **Adapt** -- same UI but smaller pool (1-2 points per level vs 10+ at creation) |
| `EdgeSelectionSection.vue` | Free-text edge input + Skill Edge shortcut with dropdown | **Reuse directly** -- same edge selection UI |
| `ClassFeatureSection.vue` | Class picker with branching specialization, feature free-text | **Reuse directly** -- same class/feature selection UI |
| `SkillBackgroundSection.vue` | Background preset + custom skill assignment | **Do not reuse** -- level-up doesn't change backgrounds. New `LevelUpSkillSection` for single rank-up |

### 6. Server API (`app/server/api/characters/[id].put.ts`)

The PUT endpoint is a generic field-setter -- it accepts any subset of fields and updates them. It already handles:
- `level`, `stats` (hp, attack, etc.), `skills`, `edges`, `features`, `trainerClasses`
- JSON serialization for array/object fields
- maxHp recalculation is NOT done server-side (client computes)

**No server changes needed for P0.** The level-up workflow will compute the updated character state client-side and send the full updated fields via the existing PUT endpoint. Future P1 consideration: server-side validation of advancement choices (not in scope).

### 7. Character Type & Data Model (`app/types/character.ts`)

The `HumanCharacter` interface has all needed fields:
```typescript
interface HumanCharacter {
  level: number
  stats: Stats                          // { hp, attack, defense, specialAttack, specialDefense, speed }
  skills: Record<string, SkillRank>     // 17 PTU skills
  edges: string[]                       // Edge names
  features: string[]                    // Feature names
  trainerClasses: string[]              // Class names (with specialization suffix for branching)
  maxHp: number                         // Computed: level * 2 + hp * 3 + 10
  currentHp: number
  // ... other fields unchanged by level-up
}
```

No new fields needed. The level-up workflow reads `stats`, `skills`, `edges`, `features`, `trainerClasses` from the existing character, computes deltas, presents choices, and writes back the updated values.

---

## Composable: `useTrainerLevelUp.ts`

### New File: `app/composables/useTrainerLevelUp.ts`

Reactive state management for the level-up workflow. Separate from `useCharacterCreation` because:
1. Level-up operates on **deltas** (what changed), not totals
2. Level-up starts from an **existing** character state, not blank
3. Level-up may span multiple levels (e.g., GM jumps from level 3 to level 7)
4. Pathetic skill handling differs (decree-027 applies only during creation, not level-up)

```typescript
export function useTrainerLevelUp() {
  // --- Input State ---
  const character = ref<HumanCharacter | null>(null)
  const oldLevel = ref(0)
  const newLevel = ref(0)

  // --- Derived from trainerAdvancement.ts ---
  const advancement = computed(() =>
    character.value && oldLevel.value < newLevel.value
      ? computeTrainerAdvancement(oldLevel.value, newLevel.value)
      : null
  )

  // --- Allocation State (user choices) ---
  const statPointAllocations = reactive<StatPoints>({
    hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0
  })

  const skillRankChoices = ref<PtuSkillName[]>([])  // One per level gained
  const edgeChoices = ref<string[]>([])              // Edges chosen at even levels
  const featureChoices = ref<string[]>([])           // Features chosen at odd levels
  const newClassChoices = ref<string[]>([])          // Classes chosen at milestone levels
  const milestoneChoices = ref<Record<number, MilestoneChoice>>({})  // Per-milestone-level

  // --- Computed Validation ---
  const statPointsUsed = computed(() => ...)
  const statPointsRemaining = computed(() => ...)
  const isComplete = computed(() => ...)             // All required choices made

  // --- Actions ---
  function initialize(char: HumanCharacter, targetLevel: number) { ... }
  function incrementStat(stat: keyof StatPoints) { ... }
  function decrementStat(stat: keyof StatPoints) { ... }
  function addSkillRank(skill: PtuSkillName) { ... }
  function removeSkillRank(index: number) { ... }
  function addEdge(edgeName: string) { ... }
  function removeEdge(index: number) { ... }
  function addFeature(featureName: string) { ... }
  function removeFeature(index: number) { ... }
  function setMilestoneChoice(level: number, choice: MilestoneChoice) { ... }

  // --- Build Update Payload ---
  function buildUpdatePayload(): Partial<HumanCharacter> { ... }

  return { ... }
}
```

---

## Utility: `trainerAdvancement.ts`

### New File: `app/utils/trainerAdvancement.ts`

Pure functions for computing trainer advancement deltas. Follows the same pattern as `levelUpCheck.ts` (Pokemon).

```typescript
export interface TrainerLevelUpInfo {
  newLevel: number
  statPointsGained: number          // Always 1
  // skillRanksGained removed per decree-037 (skill ranks come from Skill Edges only)
  edgesGained: number               // 1 on even levels, 0 on odd
  featuresGained: number            // 1 on odd levels (3+), 0 on even
  bonusSkillEdge: boolean           // true at levels 2, 6, 12
  skillRankCapUnlocked: SkillRankName | null  // 'Adept' at 2, 'Expert' at 6, 'Master' at 12
  milestone: TrainerMilestone | null // Amateur/Capable/Veteran/Elite/Champion
  newClassSlot: boolean             // true at levels 5, 10 (NOT 3rd/4th class)
}

export interface TrainerMilestone {
  level: number
  name: 'Amateur' | 'Capable' | 'Veteran' | 'Elite' | 'Champion'
  choices: MilestoneOption[]
}

export interface MilestoneOption {
  type: 'stat_points' | 'edges' | 'feature'
  description: string
  // For stat_points: Atk/SpAtk per even level in range
  levelRange?: [number, number]
  retroactivePoints?: number
  // For edges: how many bonus edges
  edgeCount?: number
}

export function computeTrainerLevelUp(level: number): TrainerLevelUpInfo { ... }
export function computeTrainerAdvancement(fromLevel: number, toLevel: number): TrainerLevelUpInfo[] { ... }
export function summarizeTrainerAdvancement(infos: TrainerLevelUpInfo[]): TrainerAdvancementSummary { ... }
```

---


## Changes to Existing Files

### `app/pages/gm/characters/[id].vue`

**Integration point:** Add a watcher on `editData.level` that detects when the level increases. When the level changes upward while in edit mode, show the `LevelUpModal` instead of letting the raw number change persist. The modal handles all allocation choices and writes back the updated character data.

```typescript
// Watch for level increase in edit mode
watch(() => editData.value.level, (newLevel, oldLevel) => {
  if (isEditing.value && newLevel > oldLevel && character.value) {
    // Revert the raw level change -- the modal will apply it after choices
    editData.value.level = oldLevel
    // Show level-up modal
    showLevelUpModal.value = true
    levelUpTarget.value = newLevel
  }
})
```

### `app/components/character/CharacterModal.vue`

Same integration pattern as the standalone page. The modal-within-modal approach uses the same `LevelUpModal` component.

### `app/constants/trainerStats.ts`

**No changes needed for P0.** The existing functions compute totals correctly. The new `trainerAdvancement.ts` utility uses them internally but doesn't modify them.

### `app/utils/characterCreationValidation.ts`

**No changes needed.** Validation logic is creation-specific. Level-up validation lives in the composable.

---


## Component Hierarchy (Final State)

```
gm/characters/[id].vue (or CharacterModal.vue)
  |-- Level input triggers watch → opens LevelUpModal
  |
  |-- LevelUpModal.vue
      |-- Step navigation (stepper or accordion)
      |
      |-- Step 1: LevelUpStatSection.vue         [P0]
      |   (stat point allocation: +N points to distribute)
      |
      |-- Step 2: LevelUpSkillSection.vue         [P0]
      |   (skill rank choices: pick N skills to rank up)
      |
      |-- Step 3: LevelUpEdgeSection.vue          [P1]
      |   (edge selection at even levels + bonus Skill Edges)
      |
      |-- Step 4: LevelUpFeatureSection.vue       [P1]
      |   (feature selection at odd levels)
      |
      |-- Step 5: LevelUpClassSection.vue         [P1]
      |   (class choice at levels 5/10)
      |
      |-- Step 6: LevelUpMilestoneSection.vue     [P1]
      |   (Amateur/Capable/Veteran/Elite/Champion choices)
      |
      |-- Final: LevelUpSummary.vue               [P0]
          (review all choices, confirm and apply)
```

---


## Key Design Decisions

### 1. Modal-based workflow (not inline)

The level-up workflow uses a modal dialog rather than inline form expansion. Rationale:
- Level-up is a discrete event with a clear start and end
- The modal prevents accidental saves of partial state
- The character sheet stays clean; advancement choices are isolated
- Multi-level jumps need a sequential presentation that inline editing doesn't support

### 2. Multi-level jump support

When the GM changes level from 3 to 7, the workflow computes advancement for levels 4, 5, 6, and 7 combined. The summary shows total stat points, total skills, etc. The GM makes all choices in one session. This matches how PTU works at the table: the GM may grant multiple levels after a major story milestone.

### 3. Pathetic skills unlocked during level-up

Per decree-027, Pathetic skills are locked during **character creation**. During level-up (post-creation), the lock lifts. The `useTrainerLevelUp` composable does NOT enforce the Pathetic block. A trainer at level 2 can use their bonus Skill Edge to rank up a previously-Pathetic skill from Pathetic to Untrained. This is the intended PTU behavior per p. 41's Basic Skills Edge description.

### 4. Soft warnings, not hard blocks

Following the creation form pattern, validation produces warnings but does not block the GM from saving. The GM always has final say. If the GM allocates 0 of 3 available stat points and clicks "Apply", the system saves it (with a warning shown).

### 5. Client-side only (no server advancement logic)

The server remains a dumb data store. All advancement logic runs client-side. The level-up workflow computes the updated character and sends the full update via the existing PUT endpoint. This matches the existing architecture where the client computes maxHp, derived stats, etc.

# P0 Specification

## A. Trainer Advancement Pure Logic

### New File: `app/utils/trainerAdvancement.ts`

Pure functions for computing what a trainer gains at each level-up. No side effects, no reactive state, no DB access. This mirrors the pattern of `app/utils/levelUpCheck.ts` (Pokemon level-up) but for trainers.

#### Types

```typescript
import type { SkillRankName } from '~/constants/trainerStats'

/**
 * What a trainer gains at a single level-up.
 * Pure data -- no choices, just the entitlements.
 */
export interface TrainerLevelUpInfo {
  /** The new level reached */
  newLevel: number
  /** Stat points gained this level (always 1 per PTU p.19) */
  statPointsGained: number
  /** Edges gained this level: 1 on even levels, 0 on odd */
  edgesGained: number
  /** Features gained this level: 1 on odd levels (3+), 0 on even, 0 at levels 1-2 */
  featuresGained: number
  /** Whether a bonus Skill Edge is granted at this level (levels 2, 6, 12) */
  bonusSkillEdge: boolean
  /**
   * Skill rank cap name unlocked at this level, or null.
   * 'Adept' at level 2, 'Expert' at level 6, 'Master' at level 12.
   */
  skillRankCapUnlocked: SkillRankName | null
  /** Trainer milestone at this level (Amateur/Capable/etc.), or null */
  milestone: TrainerMilestone | null
  /**
   * Whether a new class slot opens at this level.
   * PTU does not strictly grant "class slots" at specific levels -- trainers can
   * take a new class whenever they have a Feature from that class available.
   * However, levels 5 and 10 are conventional points where campaigns introduce
   * new classes, and the Amateur/Capable milestones often coincide with class
   * expansion. The tool prompts for a class choice at these levels.
   */
  classChoicePrompt: boolean
}

/**
 * Trainer milestone data (Amateur, Capable, Veteran, Elite, Champion).
 * Each milestone offers a choice between options.
 */
export interface TrainerMilestone {
  level: number
  name: 'Amateur' | 'Capable' | 'Veteran' | 'Elite' | 'Champion'
  /** The options the trainer chooses one from */
  choices: MilestoneOption[]
}

/**
 * A single milestone choice option.
 */
export interface MilestoneOption {
  id: string
  type: 'lifestyle_stat_points' | 'bonus_edges' | 'general_feature'
  label: string
  description: string
  /**
   * For lifestyle_stat_points: the level range where +1 Atk/SpAtk is gained on even levels.
   * E.g., Amateur grants +1 on even levels 6-10, with +2 retroactive for levels 2 and 4.
   */
  evenLevelRange?: [number, number]
  /** Retroactive stat points granted immediately (Amateur only: +2 for levels 2 and 4) */
  retroactivePoints?: number
  /** Number of bonus edges granted (Capable/Veteran: 2) */
  edgeCount?: number
}

/**
 * Summary of all advancement deltas across multiple levels.
 */
export interface TrainerAdvancementSummary {
  fromLevel: number
  toLevel: number
  totalStatPoints: number
  totalEdges: number
  totalFeatures: number
  bonusSkillEdges: number
  skillRankCapsUnlocked: Array<{ level: number; cap: SkillRankName }>
  milestones: TrainerMilestone[]
  classChoicePrompts: number[]
}
```

#### Core Functions

```typescript
/**
 * Compute what a trainer gains when reaching a specific level.
 * Pure function -- returns entitlements, not choices.
 */
export function computeTrainerLevelUp(level: number): TrainerLevelUpInfo {
  const isEven = level % 2 === 0
  const isOdd = !isEven

  return {
    newLevel: level,
    statPointsGained: 1,
    edgesGained: isEven ? 1 : 0,
    featuresGained: (isOdd && level >= 3) ? 1 : 0,
    bonusSkillEdge: [2, 6, 12].includes(level),
    skillRankCapUnlocked: getSkillRankCapUnlockedAt(level),
    milestone: getMilestoneAt(level),
    classChoicePrompt: [5, 10].includes(level)
  }
}

/**
 * Compute advancement for a range of levels (inclusive).
 * Handles multi-level jumps (e.g., level 3 -> 7 returns info for levels 4, 5, 6, 7).
 */
export function computeTrainerAdvancement(
  fromLevel: number,
  toLevel: number
): TrainerLevelUpInfo[] {
  if (toLevel <= fromLevel || fromLevel < 1) return []
  const results: TrainerLevelUpInfo[] = []
  for (let level = fromLevel + 1; level <= Math.min(toLevel, 50); level++) {
    results.push(computeTrainerLevelUp(level))
  }
  return results
}

/**
 * Summarize advancement across multiple levels into aggregate totals.
 */
export function summarizeTrainerAdvancement(
  infos: TrainerLevelUpInfo[]
): TrainerAdvancementSummary {
  // ... aggregate totals from individual level infos
}
```

#### Milestone Definitions

```typescript
function getSkillRankCapUnlockedAt(level: number): SkillRankName | null {
  if (level === 2) return 'Adept'
  if (level === 6) return 'Expert'
  if (level === 12) return 'Master'
  return null
}

function getMilestoneAt(level: number): TrainerMilestone | null {
  switch (level) {
    case 5:
      return {
        level: 5,
        name: 'Amateur',
        choices: [
          {
            id: 'amateur-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (6-10), +2 retroactive for levels 2 and 4',
            evenLevelRange: [6, 10],
            retroactivePoints: 2
          },
          {
            id: 'amateur-feature',
            type: 'general_feature',
            label: 'General Feature',
            description: 'Gain one General Feature for which you qualify'
          }
        ]
      }
    case 10:
      return {
        level: 10,
        name: 'Capable',
        choices: [
          {
            id: 'capable-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (12-20)',
            evenLevelRange: [12, 20]
          },
          {
            id: 'capable-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          }
        ]
      }
    case 20:
      return {
        level: 20,
        name: 'Veteran',
        choices: [
          {
            id: 'veteran-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (22-30)',
            evenLevelRange: [22, 30]
          },
          {
            id: 'veteran-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          }
        ]
      }
    case 30:
      return {
        level: 30,
        name: 'Elite',
        choices: [
          {
            id: 'elite-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (32-40)',
            evenLevelRange: [32, 40]
          },
          {
            id: 'elite-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          },
          {
            id: 'elite-feature',
            type: 'general_feature',
            label: 'General Feature',
            description: 'Gain one General Feature for which you qualify'
          }
        ]
      }
    case 40:
      return {
        level: 40,
        name: 'Champion',
        choices: [
          {
            id: 'champion-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (42-50)',
            evenLevelRange: [42, 50]
          },
          {
            id: 'champion-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          },
          {
            id: 'champion-feature',
            type: 'general_feature',
            label: 'General Feature',
            description: 'Gain one General Feature for which you qualify'
          }
        ]
      }
    default:
      return null
  }
}
```

#### Lifestyle Stat Point Calculation

The "lifestyle" stat point system (from Amateur/Capable/Veteran/Elite/Champion choosing the stat points option) applies +1 Atk or SpAtk on each even level within a range. To compute how many lifestyle stat points a trainer has earned at a given level, we need to track which milestone choices they made.

```typescript
/**
 * Calculate total lifestyle stat points earned based on milestone choices.
 * Used when creating higher-level characters or validating advancement.
 *
 * Each milestone that chose 'lifestyle_stat_points' grants:
 * - Amateur: +1 per even level in [6, 10] + 2 retroactive = up to 5 total
 * - Capable: +1 per even level in [12, 20] = up to 5 total
 * - Veteran: +1 per even level in [22, 30] = up to 5 total
 * - Elite:   +1 per even level in [32, 40] = up to 5 total
 * - Champion: +1 per even level in [42, 50] = up to 5 total
 *
 * These points must be spent on Attack or Special Attack only.
 */
export function calculateLifestyleStatPoints(
  currentLevel: number,
  milestoneChoices: Record<number, string>  // milestone level -> chosen option id
): number {
  let total = 0
  for (const [milestoneLevel, choiceId] of Object.entries(milestoneChoices)) {
    if (!choiceId.endsWith('-stats')) continue
    const milestone = getMilestoneAt(Number(milestoneLevel))
    const choice = milestone?.choices.find(c => c.id === choiceId)
    if (!choice || choice.type !== 'lifestyle_stat_points') continue

    // Add retroactive points
    total += choice.retroactivePoints ?? 0

    // Add per-even-level points within the range, up to current level
    if (choice.evenLevelRange) {
      const [start, end] = choice.evenLevelRange
      for (let lvl = start; lvl <= Math.min(end, currentLevel); lvl += 2) {
        total++
      }
    }
  }
  return total
}
```

---

## B. Level-Up Detection & Modal Trigger

### Integration Pattern

The level-up workflow is triggered when the GM changes the level field to a higher value while in edit mode. This applies to both the standalone character page and the character modal.

#### Standalone Page (`app/pages/gm/characters/[id].vue`)

```typescript
// --- Level-Up Modal State ---
const showLevelUpModal = ref(false)
const levelUpTargetLevel = ref(0)

// Watch for level increase in edit mode
watch(() => editData.value.level, (newVal, oldVal) => {
  if (!isEditing.value) return
  if (typeof newVal !== 'number' || typeof oldVal !== 'number') return
  if (newVal <= oldVal) return

  // Revert the raw input change -- the modal will handle it
  editData.value = { ...editData.value, level: oldVal }
  levelUpTargetLevel.value = newVal
  showLevelUpModal.value = true
})

// Handle level-up completion
function onLevelUpComplete(updatedData: Partial<HumanCharacter>) {
  // Apply all updated fields to editData
  editData.value = {
    ...editData.value,
    ...updatedData
  }
  showLevelUpModal.value = false

  // Auto-save immediately (or let the user save manually -- design choice)
  // For P0, we update editData and let the user click "Save Changes"
}

function onLevelUpCancel() {
  showLevelUpModal.value = false
  // editData.level was already reverted, nothing else to do
}
```

```html
<LevelUpModal
  v-if="showLevelUpModal"
  :character="character"
  :target-level="levelUpTargetLevel"
  @complete="onLevelUpComplete"
  @cancel="onLevelUpCancel"
/>
```

#### Character Modal (`app/components/character/CharacterModal.vue`)

Same pattern. The `editData.level` watcher intercepts the change, shows `LevelUpModal`, and applies results to `editData` on completion.

#### Level Decrement Handling

When the GM decreases the level, the change is allowed without any prompt. Level-down is a rare GM correction, not a gameplay event. No guided workflow is needed.

#### Multi-Level Jump

The GM types "7" into the level field (from 3). The watcher detects 3->7 and opens the modal with `targetLevel=7`. The modal computes advancement for levels 4, 5, 6, 7 combined and presents all choices in one session.

---

## C. Level-Up Modal Component

### New File: `app/components/levelup/LevelUpModal.vue`

The modal shell that orchestrates the level-up workflow. It uses the `useTrainerLevelUp` composable for state and presents steps in sequence.

#### Props

```typescript
interface Props {
  /** The character being leveled up (current state) */
  character: HumanCharacter
  /** Target level to advance to */
  targetLevel: number
}
```

#### Events

```typescript
interface Emits {
  /** Emitted when the GM confirms all choices. Payload is the updated character fields. */
  complete: [updatedData: Partial<HumanCharacter>]
  /** Emitted when the GM cancels the level-up */
  cancel: []
}
```

#### Template Structure

```html
<div class="modal-overlay" @click.self="$emit('cancel')">
  <div class="modal modal--levelup">
    <div class="modal__header">
      <h2>Level Up: {{ character.name }}</h2>
      <span class="level-badge">Level {{ character.level }} → {{ targetLevel }}</span>
    </div>

    <div class="modal__body">
      <!-- Advancement Summary Banner -->
      <div class="advancement-banner">
        <div class="advancement-banner__item">
          <span class="advancement-banner__label">Stat Points</span>
          <span class="advancement-banner__value">+{{ summary.totalStatPoints }}</span>
        </div>
        <!-- Per decree-037: No skill rank banner item. Skill ranks come from Skill Edges only. -->
        <!-- P1: Edges, Features, Milestones shown here too -->
      </div>

      <!-- Step Content (one visible at a time) -->
      <LevelUpStatSection v-if="currentStep === 'stats'" ... />
      <!-- Per decree-037: No LevelUpSkillSection step. Skill ranks come from Skill Edges. -->
      <LevelUpEdgeSection v-if="currentStep === 'edges'" ... />
      <LevelUpFeatureSection v-if="currentStep === 'features'" ... />
      <LevelUpSummary v-if="currentStep === 'summary'" ... />
    </div>

    <div class="modal__footer">
      <button v-if="hasPreviousStep" class="btn btn--secondary" @click="previousStep">
        Back
      </button>
      <button v-if="hasNextStep" class="btn btn--primary" @click="nextStep">
        Next
      </button>
      <button v-if="currentStep === 'summary'" class="btn btn--primary" @click="apply">
        Apply Level Up
      </button>
      <button class="btn btn--secondary" @click="$emit('cancel')">
        Cancel
      </button>
    </div>
  </div>
</div>
```

#### Step Navigation

Per decree-037, the skills step has been removed. Steps: `milestones` (if any) -> `stats` -> `edges` (if any) -> `features` (if any) -> `classes` (if any) -> `summary`

Steps are shown conditionally based on what the advancement grants. For example, if the level jump is from 4 to 5 (odd level), the edge step is skipped (no edges at odd levels). If no milestone applies, the milestone step is skipped.

```typescript
const steps = computed((): string[] => {
  const s: string[] = []
  if (summary.milestones.length > 0) s.push('milestones')
  s.push('stats')
  if (regularEdgesTotal > 0 || bonusSkillEdgeEntries.length > 0) s.push('edges')
  if (featuresTotal > 0) s.push('features')
  if (summary.classChoicePrompts.length > 0) s.push('classes')
  s.push('summary')
  return s
})
```

---

## D. Stat Point Allocation Step

### New File: `app/components/levelup/LevelUpStatSection.vue`

Allocate stat points gained from leveling. Each level grants +1 stat point with no per-stat cap (PTU p. 19: "Trainers don't follow Base Relations").

#### Props

```typescript
interface Props {
  /** Current stat values (base + previously allocated) */
  currentStats: Stats
  /** Points allocated so far in this level-up session */
  allocations: StatPoints
  /** Total points to distribute in this level-up */
  totalPoints: number
  /** Points remaining to allocate */
  pointsRemaining: number
  /** New level (for maxHp calculation preview) */
  newLevel: number
}
```

#### Events

```typescript
interface Emits {
  incrementStat: [stat: keyof StatPoints]
  decrementStat: [stat: keyof StatPoints]
}
```

#### UI Layout

```
┌─────────────────────────────────────────┐
│ Stat Allocation (+3 points)             │
│                                         │
│ Points Remaining: 1 / 3                 │
│                                         │
│ ┌──────────┬─────┬──────┬─────┬──────┐  │
│ │ Stat     │ Was │ Add  │ New │ +/-  │  │
│ ├──────────┼─────┼──────┼─────┼──────┤  │
│ │ HP       │ 12  │ +1   │ 13  │ [+][-]│ │
│ │ Attack   │  7  │ +1   │  8  │ [+][-]│ │
│ │ Defense  │  6  │  0   │  6  │ [+][-]│ │
│ │ Sp. Atk  │  8  │ +1   │  9  │ [+][-]│ │
│ │ Sp. Def  │  6  │  0   │  6  │ [+][-]│ │
│ │ Speed    │  7  │  0   │  7  │ [+][-]│ │
│ └──────────┴─────┴──────┴─────┴──────┘  │
│                                         │
│ Max HP Preview: 42 → 50                 │
│ Evasions: Phys 1 / Spec 1 / Spd 1      │
└─────────────────────────────────────────┘
```

#### Implementation Notes

- "Was" column shows `currentStats[stat]` (from the character's existing stats)
- "Add" column shows `allocations[stat]` (from the composable)
- "New" column shows `currentStats[stat] + allocations[stat]`
- Max HP preview uses the trainer HP formula: `newLevel * 2 + (currentStats.hp + allocations.hp) * 3 + 10`
- No per-stat cap after level 1 (PTU p. 19). The +/- buttons are only bounded by `pointsRemaining` (can't go below 0 allocation)

---

## E. Skill Rank Allocation Step — DEFERRED TO P1

> **DECREE-037 (binding):** Per decree-037, trainers do NOT receive automatic skill ranks per level. Skill ranks come from Skill Edges only (PTU Core p.19, p.52). The `LevelUpSkillSection.vue` component was built but is now disabled in the P0 wizard flow. Skill rank allocation will be re-integrated in P1 as part of Edge selection — when a trainer selects a Skill Edge (Basic/Adept/Expert/Master Skills), the skill rank picker will surface as a sub-step of the Edge step.
>
> The `LevelUpSkillSection.vue` file is retained for reuse in P1. The `skillRanksGained` field was removed from `TrainerLevelUpInfo` and `totalSkillRanks` from `TrainerAdvancementSummary`. All skill-related state, actions, and computed values were removed from `useTrainerLevelUp.ts`. The `buildUpdatePayload` no longer includes `skills` in its output.

---

## F. Level-Up Summary Step

### New File: `app/components/levelup/LevelUpSummary.vue`

Review step showing all choices made before applying. The GM can go back to any step to change allocations.

#### Props

```typescript
interface Props {
  /** Character name */
  characterName: string
  /** Level transition */
  fromLevel: number
  toLevel: number
  /** Stat allocations */
  statAllocations: StatPoints
  currentStats: Stats
  /** Skill rank choices */
  skillChoices: PtuSkillName[]
  currentSkills: Record<PtuSkillName, SkillRank>
  /** P1: Edge choices, feature choices, class choices, milestone choices */
  /** Warnings about incomplete allocations */
  warnings: string[]
}
```

#### UI Layout

```
┌─────────────────────────────────────────┐
│ Level-Up Summary                        │
│ Trainer Name: Level 4 → Level 7        │
│                                         │
│ ┌─ Stats ──────────────────────────────┐│
│ │ HP:     12 → 13 (+1)                 ││
│ │ Attack:  7 →  9 (+2)                 ││
│ │ Speed:   7 →  7 (unchanged)          ││
│ │ Max HP: 42 → 54                      ││
│ └──────────────────────────────────────┘│
│                                         │
│ ┌─ Skills ─────────────────────────────┐│
│ │ Athletics: Novice → Adept            ││
│ │ Perception: Untrained → Novice       ││
│ │ Command: Untrained → Novice          ││
│ └──────────────────────────────────────┘│
│                                         │
│ ┌─ Warnings ───────────────────────────┐│
│ │ 1 stat point unallocated             ││
│ └──────────────────────────────────────┘│
│                                         │
│           [Apply Level Up]   [Cancel]   │
└─────────────────────────────────────────┘
```

#### Validation Warnings

The summary shows soft warnings for incomplete allocations:
- "X stat point(s) unallocated" -- if not all stat points were spent
- "X skill rank(s) unallocated" -- if not all skill rank-ups were chosen
- P1: "X edge(s) not selected", "X feature(s) not selected"

These are warnings, not blockers. The GM can click "Apply Level Up" even with unspent points.

---

## G. Composable: `useTrainerLevelUp.ts`

### New File: `app/composables/useTrainerLevelUp.ts`

Reactive state management for the level-up workflow. Orchestrates the `trainerAdvancement.ts` pure logic with reactive state for UI binding.

```typescript
import type { HumanCharacter, Stats, SkillRank } from '~/types/character'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { StatPoints } from '~/composables/useCharacterCreation'
import {
  computeTrainerAdvancement,
  summarizeTrainerAdvancement
} from '~/utils/trainerAdvancement'
import type {
  TrainerLevelUpInfo,
  TrainerAdvancementSummary,
  TrainerMilestone
} from '~/utils/trainerAdvancement'
import { getMaxSkillRankForLevel, isSkillRankAboveCap } from '~/constants/trainerStats'

type MilestoneChoiceId = string

export function useTrainerLevelUp() {
  // --- Input State ---
  const character = ref<HumanCharacter | null>(null)
  const oldLevel = ref(0)
  const newLevel = ref(0)
  const isActive = ref(false)

  // --- Derived Advancement Info ---
  const advancementInfos = computed((): TrainerLevelUpInfo[] =>
    isActive.value
      ? computeTrainerAdvancement(oldLevel.value, newLevel.value)
      : []
  )

  const summary = computed((): TrainerAdvancementSummary | null =>
    advancementInfos.value.length > 0
      ? summarizeTrainerAdvancement(advancementInfos.value)
      : null
  )

  // --- P0: Stat Allocation State ---
  const statAllocations = reactive<StatPoints>({
    hp: 0, attack: 0, defense: 0,
    specialAttack: 0, specialDefense: 0, speed: 0
  })

  const statPointsUsed = computed(() =>
    Object.values(statAllocations).reduce((sum, v) => sum + v, 0)
  )

  const statPointsTotal = computed(() =>
    summary.value?.totalStatPoints ?? 0
  )

  const statPointsRemaining = computed(() =>
    statPointsTotal.value - statPointsUsed.value
  )

  // Per decree-037: No automatic skill rank allocation state.
  // Skill ranks come from Skill Edges only (handled in P1 Edge selection).

  // --- Initialize ---
  function initialize(char: HumanCharacter, targetLevel: number): void {
    character.value = char
    oldLevel.value = char.level
    newLevel.value = targetLevel
    isActive.value = true

    // Reset allocations
    Object.assign(statAllocations, { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 })
  }

  function reset(): void {
    character.value = null
    oldLevel.value = 0
    newLevel.value = 0
    isActive.value = false
    Object.assign(statAllocations, { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 })
  }

  // --- Stat Actions ---
  function incrementStat(stat: keyof StatPoints): void {
    if (statPointsRemaining.value <= 0) return
    statAllocations[stat]++
  }

  function decrementStat(stat: keyof StatPoints): void {
    if (statAllocations[stat] <= 0) return
    statAllocations[stat]--
  }

  // Per decree-037: Skill actions removed. Skill rank-ups happen via
  // Skill Edges in the edges step (addBonusSkillEdge, regular Skill Edge entries).

  // --- Computed Updated Stats ---
  const updatedStats = computed((): Stats | null => {
    if (!character.value) return null
    return {
      hp: character.value.stats.hp + statAllocations.hp,
      attack: character.value.stats.attack + statAllocations.attack,
      defense: character.value.stats.defense + statAllocations.defense,
      specialAttack: character.value.stats.specialAttack + statAllocations.specialAttack,
      specialDefense: character.value.stats.specialDefense + statAllocations.specialDefense,
      speed: character.value.stats.speed + statAllocations.speed
    }
  })

  const updatedMaxHp = computed((): number => {
    if (!updatedStats.value) return 0
    return newLevel.value * 2 + updatedStats.value.hp * 3 + 10
  })

  // Per decree-037: updatedSkills removed from composable. Skills are updated
  // via Skill Edge rank-ups in buildUpdatePayload (bonus + regular Skill Edges).

  // --- Warnings ---
  const warnings = computed((): string[] => {
    const w: string[] = []
    if (statPointsRemaining.value > 0) {
      w.push(`${statPointsRemaining.value} stat point(s) unallocated`)
    }
    // Per decree-037: No "skill rank(s) unallocated" warning.
    // Skill ranks come from Skill Edges only.
    return w
  })

  // --- Build Update Payload ---
  function buildUpdatePayload(): Partial<HumanCharacter> {
    if (!character.value) return {}
    return {
      level: newLevel.value,
      stats: updatedStats.value ?? character.value.stats,
      maxHp: updatedMaxHp.value,
      currentHp: Math.min(character.value.currentHp, updatedMaxHp.value),
      // Per decree-037: skills updated via Skill Edge rank-ups (bonus + regular)
      // edges, features, trainerClasses
    }
  }

  return {
    // State
    character: readonly(character),
    oldLevel: readonly(oldLevel),
    newLevel: readonly(newLevel),
    isActive: readonly(isActive),
    // Advancement info
    advancementInfos,
    summary,
    // Stat allocation
    statAllocations,
    statPointsUsed,
    statPointsTotal,
    statPointsRemaining,
    incrementStat,
    decrementStat,
    // Per decree-037: No skill allocation exports.
    // Skill rank-ups handled via Edge selection.
    // Computed updates
    updatedStats,
    updatedMaxHp,
    // Warnings
    warnings,
    // Lifecycle
    initialize,
    reset,
    buildUpdatePayload
  }
}
```

---

## H. maxHp Recalculation

When a trainer levels up, `maxHp` must be recalculated. The trainer HP formula is:

```
maxHp = level * 2 + hp_stat * 3 + 10
```

Both `level` and `hp_stat` may change during level-up. The composable computes `updatedMaxHp` and includes it in the update payload. `currentHp` is clamped to the new `maxHp` (it should not exceed it, but should not be reduced below its current value unless it was already above the new max).

The existing `[id].put.ts` API already accepts `maxHp` and `currentHp` as update fields.

---

## Integration Summary (P0 Complete State)

After P0+P1 implementation:

1. GM opens character sheet (standalone or modal)
2. GM clicks "Edit"
3. GM changes level from N to N+K (any positive increment)
4. Level input reverts; LevelUpModal opens
5. Steps: Milestones (if any) -> Stats -> Edges (if any) -> Features (if any) -> Classes (if any) -> Summary
6. GM clicks "Apply Level Up"
7. editData is updated with new level, stats, edges, features, classes, skills (from Skill Edges), maxHp
8. GM clicks "Save Changes" to persist

Per decree-037, there is NO automatic skill rank allocation step. Skill ranks come exclusively from Skill Edges selected in the Edges step.

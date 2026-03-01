/**
 * Composable managing trainer level-up workflow state.
 *
 * Orchestrates the trainerAdvancement.ts pure logic with reactive state
 * for UI binding. Handles stat point allocation and building the update payload.
 *
 * Separate from useCharacterCreation because:
 * 1. Level-up operates on deltas (what changed), not totals
 * 2. Level-up starts from an existing character state, not blank
 * 3. Level-up may span multiple levels (e.g., GM jumps from level 3 to level 7)
 *
 * Note: Per decree-037, skill rank allocation is NOT part of level-up.
 * Skill ranks come from Skill Edges only (PTU Core p.19, p.52).
 * Skill rank allocation will be handled in P1 Edge selection.
 *
 * Reference: PTU Core Chapter 3 — Trainers (pp. 19-21)
 */

import type { HumanCharacter, Stats } from '~/types/character'
import type { StatPoints } from '~/composables/useCharacterCreation'
import {
  computeTrainerAdvancement,
  summarizeTrainerAdvancement
} from '~/utils/trainerAdvancement'
import type {
  TrainerLevelUpInfo,
  TrainerAdvancementSummary
} from '~/utils/trainerAdvancement'

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
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0
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

  // --- Initialize ---
  function initialize(char: HumanCharacter, targetLevel: number): void {
    character.value = char
    oldLevel.value = char.level
    newLevel.value = targetLevel
    isActive.value = true

    // Reset allocations (immutable pattern for reactive: Object.assign)
    Object.assign(statAllocations, {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    })
  }

  function reset(): void {
    character.value = null
    oldLevel.value = 0
    newLevel.value = 0
    isActive.value = false
    Object.assign(statAllocations, {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    })
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

  // --- Computed Updated Stats ---
  const updatedStats = computed((): Stats | null => {
    if (!character.value) return null
    const charStats = character.value.stats
    return {
      hp: (charStats?.hp ?? 0) + statAllocations.hp,
      attack: (charStats?.attack ?? 0) + statAllocations.attack,
      defense: (charStats?.defense ?? 0) + statAllocations.defense,
      specialAttack: (charStats?.specialAttack ?? 0) + statAllocations.specialAttack,
      specialDefense: (charStats?.specialDefense ?? 0) + statAllocations.specialDefense,
      speed: (charStats?.speed ?? 0) + statAllocations.speed
    }
  })

  const currentMaxHp = computed((): number => {
    if (!character.value) return 0
    return character.value.maxHp ?? 0
  })

  const updatedMaxHp = computed((): number => {
    if (!updatedStats.value) return 0
    return newLevel.value * 2 + updatedStats.value.hp * 3 + 10
  })

  // --- Warnings ---
  const warnings = computed((): string[] => {
    const w: string[] = []
    if (statPointsRemaining.value > 0) {
      w.push(`${statPointsRemaining.value} stat point(s) unallocated`)
    }
    return w
  })

  // --- Build Update Payload ---
  function buildUpdatePayload(): Partial<HumanCharacter> {
    if (!character.value) return {}
    const newMaxHp = updatedMaxHp.value
    const wasAtFullHp = character.value.currentHp >= (character.value.maxHp ?? 0)
    const newCurrentHp = wasAtFullHp
      ? newMaxHp
      : Math.min(character.value.currentHp, newMaxHp)
    return {
      level: newLevel.value,
      stats: updatedStats.value ?? character.value.stats,
      maxHp: newMaxHp,
      currentHp: newCurrentHp
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
    // Computed updates
    updatedStats,
    currentMaxHp,
    updatedMaxHp,
    // Warnings
    warnings,
    // Lifecycle
    initialize,
    reset,
    buildUpdatePayload
  }
}

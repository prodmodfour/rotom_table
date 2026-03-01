/**
 * Composable managing trainer level-up workflow state.
 *
 * Orchestrates the trainerAdvancement.ts pure logic with reactive state
 * for UI binding. Handles stat point allocation, skill rank allocation,
 * and building the update payload.
 *
 * Separate from useCharacterCreation because:
 * 1. Level-up operates on deltas (what changed), not totals
 * 2. Level-up starts from an existing character state, not blank
 * 3. Level-up may span multiple levels (e.g., GM jumps from level 3 to level 7)
 * 4. Pathetic skill handling differs (decree-027 applies only during creation)
 *
 * Reference: PTU Core Chapter 3 — Trainers (pp. 19-21)
 */

import type { HumanCharacter, Stats, SkillRank } from '~/types/character'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { StatPoints } from '~/composables/useCharacterCreation'
import {
  computeTrainerAdvancement,
  summarizeTrainerAdvancement
} from '~/utils/trainerAdvancement'
import type {
  TrainerLevelUpInfo,
  TrainerAdvancementSummary
} from '~/utils/trainerAdvancement'
import { isSkillRankAboveCap } from '~/constants/trainerStats'

/** Skill rank progression order */
const RANK_PROGRESSION: readonly SkillRank[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
] as const

/**
 * Get the next rank in the progression, or null if already at Master.
 */
function getNextRank(rank: SkillRank): SkillRank | null {
  const index = RANK_PROGRESSION.indexOf(rank)
  if (index === -1 || index >= RANK_PROGRESSION.length - 1) return null
  return RANK_PROGRESSION[index + 1]
}

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

  // --- P0: Skill Rank Allocation State ---
  const skillChoices = ref<PtuSkillName[]>([])

  const skillRanksTotal = computed(() =>
    summary.value?.totalSkillRanks ?? 0
  )

  const skillRanksRemaining = computed(() =>
    skillRanksTotal.value - skillChoices.value.length
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
    skillChoices.value = []
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
    skillChoices.value = []
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

  // --- Skill Actions ---

  /**
   * Get the effective rank of a skill, accounting for pending rank-ups
   * from this level-up session.
   */
  function getEffectiveSkillRank(skill: PtuSkillName): SkillRank {
    if (!character.value) return 'Untrained'
    const baseRank = (character.value.skills[skill] as SkillRank) ?? 'Untrained'
    const pendingRankUps = skillChoices.value.filter(s => s === skill).length
    const baseIndex = RANK_PROGRESSION.indexOf(baseRank)
    const effectiveIndex = Math.min(baseIndex + pendingRankUps, RANK_PROGRESSION.length - 1)
    return RANK_PROGRESSION[effectiveIndex]
  }

  /**
   * Check whether a skill can be ranked up further in this session.
   * Considers remaining ranks, current effective rank, and level cap.
   */
  function canRankUpSkill(skill: PtuSkillName): boolean {
    if (skillRanksRemaining.value <= 0) return false
    const effectiveRank = getEffectiveSkillRank(skill)
    if (effectiveRank === 'Master') return false
    const nextRank = getNextRank(effectiveRank)
    if (!nextRank) return false
    return !isSkillRankAboveCap(nextRank, newLevel.value)
  }

  function addSkillRank(skill: PtuSkillName): void {
    if (!canRankUpSkill(skill)) return
    skillChoices.value = [...skillChoices.value, skill]
  }

  function removeSkillRank(index: number): void {
    skillChoices.value = skillChoices.value.filter((_, i) => i !== index)
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

  const updatedSkills = computed((): Record<string, SkillRank> | null => {
    if (!character.value) return null
    const skills = { ...character.value.skills } as Record<string, SkillRank>
    for (const skill of skillChoices.value) {
      const currentRank = skills[skill] ?? 'Untrained'
      const currentIndex = RANK_PROGRESSION.indexOf(currentRank as SkillRank)
      if (currentIndex < RANK_PROGRESSION.length - 1) {
        skills[skill] = RANK_PROGRESSION[currentIndex + 1]
      }
    }
    return skills
  })

  // --- Warnings ---
  const warnings = computed((): string[] => {
    const w: string[] = []
    if (statPointsRemaining.value > 0) {
      w.push(`${statPointsRemaining.value} stat point(s) unallocated`)
    }
    if (skillRanksRemaining.value > 0) {
      w.push(`${skillRanksRemaining.value} skill rank(s) unallocated`)
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
      currentHp: newCurrentHp,
      skills: updatedSkills.value ?? character.value.skills
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
    // Skill allocation
    skillChoices,
    skillRanksTotal,
    skillRanksRemaining,
    getEffectiveSkillRank,
    canRankUpSkill,
    addSkillRank,
    removeSkillRank,
    // Computed updates
    updatedStats,
    currentMaxHp,
    updatedMaxHp,
    updatedSkills,
    // Warnings
    warnings,
    // Lifecycle
    initialize,
    reset,
    buildUpdatePayload
  }
}

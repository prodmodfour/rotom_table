/**
 * Composable managing trainer level-up workflow state.
 *
 * Orchestrates the trainerAdvancement.ts pure logic with reactive state
 * for UI binding. Handles stat point allocation, edge/feature selection,
 * class choice, milestone decisions, and building the update payload.
 *
 * Separate from useCharacterCreation because:
 * 1. Level-up operates on deltas (what changed), not totals
 * 2. Level-up starts from an existing character state, not blank
 * 3. Level-up may span multiple levels (e.g., GM jumps from level 3 to level 7)
 *
 * Note: Per decree-037, skill rank allocation comes from Skill Edges only
 * (PTU Core p.19, p.52). Bonus Skill Edges at levels 2/6/12 grant rank-ups.
 *
 * Note: Per decree-027, Pathetic skill restriction is creation-only.
 * During level-up, Pathetic skills CAN be raised via Skill Edges.
 *
 * Reference: PTU Core Chapter 3 — Trainers (pp. 19-21)
 */

import type { HumanCharacter, Stats, SkillRank } from '~/types/character'
import type { StatPoints } from '~/composables/useCharacterCreation'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { SkillRankName } from '~/constants/trainerStats'
import { RANK_PROGRESSION, getMaxSkillRankForLevel } from '~/constants/trainerStats'
import {
  computeTrainerAdvancement,
  summarizeTrainerAdvancement
} from '~/utils/trainerAdvancement'
import type {
  TrainerLevelUpInfo,
  TrainerAdvancementSummary
} from '~/utils/trainerAdvancement'

/** Milestone choice identifier (the option id string) */
export type MilestoneChoiceId = string

/** A bonus Skill Edge choice recording which skill was raised and from which level milestone */
export interface BonusSkillEdgeChoice {
  skill: PtuSkillName
  fromLevel: number
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

  // --- P1: Milestone Choices ---
  const milestoneChoices = ref<Record<number, MilestoneChoiceId>>({})

  /**
   * Retroactive stat points from Amateur milestone (if lifestyle_stat_points chosen).
   * Amateur grants +2 retroactive stat points for levels 2 and 4.
   */
  const milestoneRetroactiveStatPoints = computed((): number => {
    const choices = milestoneChoices.value
    let total = 0
    for (const [levelStr, choiceId] of Object.entries(choices)) {
      const milestoneLevel = Number(levelStr)
      const milestone = summary.value?.milestones.find(m => m.level === milestoneLevel)
      const choice = milestone?.choices.find(c => c.id === choiceId)
      if (choice?.type === 'lifestyle_stat_points' && choice.retroactivePoints) {
        total += choice.retroactivePoints
      }
    }
    return total
  })

  /**
   * Bonus edges from milestone choices (Capable/Veteran/Elite/Champion).
   */
  const milestoneBonusEdges = computed((): number => {
    const choices = milestoneChoices.value
    let total = 0
    for (const [levelStr, choiceId] of Object.entries(choices)) {
      const milestoneLevel = Number(levelStr)
      const milestone = summary.value?.milestones.find(m => m.level === milestoneLevel)
      const choice = milestone?.choices.find(c => c.id === choiceId)
      if (choice?.type === 'bonus_edges' && choice.edgeCount) {
        total += choice.edgeCount
      }
    }
    return total
  })

  /**
   * Bonus features from milestone choices.
   */
  const milestoneBonusFeatures = computed((): number => {
    const choices = milestoneChoices.value
    let total = 0
    for (const [levelStr, choiceId] of Object.entries(choices)) {
      const milestoneLevel = Number(levelStr)
      const milestone = summary.value?.milestones.find(m => m.level === milestoneLevel)
      const choice = milestone?.choices.find(c => c.id === choiceId)
      if (choice?.type === 'general_feature') {
        total += 1
      }
    }
    return total
  })

  const statPointsTotal = computed(() =>
    (summary.value?.totalStatPoints ?? 0) + milestoneRetroactiveStatPoints.value
  )

  const statPointsRemaining = computed(() =>
    statPointsTotal.value - statPointsUsed.value
  )

  // --- P1: Edge Allocation State ---
  const edgeChoices = ref<string[]>([])
  const bonusSkillEdgeChoices = ref<BonusSkillEdgeChoice[]>([])

  /** Total regular edges to allocate (from advancement + milestone bonus) */
  const regularEdgesTotal = computed(() =>
    (summary.value?.totalEdges ?? 0) + milestoneBonusEdges.value
  )

  /** Bonus Skill Edge entries (levels 2/6/12 with rank restriction) */
  const bonusSkillEdgeEntries = computed(() =>
    summary.value?.skillRankCapsUnlocked.map(cap => ({
      level: cap.level,
      restrictedRank: cap.cap as SkillRankName
    })) ?? []
  )

  const edgesRemaining = computed(() =>
    regularEdgesTotal.value - edgeChoices.value.length
  )

  // --- P1: Skill Rank Tracking (from ALL Skill Edges) ---

  /** Skill Edge prefix used in edgeChoices strings */
  const SKILL_EDGE_PREFIX = 'Skill Edge: '

  /**
   * Parse regular Skill Edge entries from edgeChoices.
   * Regular Skill Edges are stored as "Skill Edge: <skillName>" strings.
   * Returns an array of skill names that have been raised via regular edge slots.
   */
  const regularSkillEdgeSkills = computed((): string[] =>
    edgeChoices.value
      .filter(e => e.startsWith(SKILL_EDGE_PREFIX))
      .map(e => e.slice(SKILL_EDGE_PREFIX.length))
  )

  /**
   * Count rank-ups for a given skill from ALL sources (bonus + regular Skill Edges).
   */
  function countAllSkillEdgeUps(skill: string): number {
    const bonusUps = bonusSkillEdgeChoices.value.filter(c => c.skill === skill).length
    const regularUps = regularSkillEdgeSkills.value.filter(s => s === skill).length
    return bonusUps + regularUps
  }

  /**
   * Get effective skill rank accounting for ALL Skill Edge choices
   * (both bonus and regular). Uses character's current skills + pending rank-ups.
   */
  function getEffectiveSkillRank(skill: PtuSkillName): SkillRank {
    const base = (character.value?.skills?.[skill] as SkillRank) ?? 'Untrained'
    const ups = countAllSkillEdgeUps(skill)
    if (ups === 0) return base
    const baseIndex = RANK_PROGRESSION.indexOf(base)
    const newIndex = Math.min(baseIndex + ups, RANK_PROGRESSION.length - 1)
    return RANK_PROGRESSION[newIndex] as SkillRank
  }

  /**
   * Computed map of effective skills (current + ALL Skill Edge rank-ups).
   * Includes rank-ups from both bonus Skill Edges and regular Skill Edges.
   * Used for passing to edge section as props.
   */
  const effectiveSkills = computed((): Record<string, SkillRank> => {
    if (!character.value) return {}
    const skills = character.value.skills ?? {}
    const result: Record<string, SkillRank> = {}
    for (const [skill, rank] of Object.entries(skills)) {
      const ups = countAllSkillEdgeUps(skill)
      if (ups === 0) {
        result[skill] = rank as SkillRank
      } else {
        const baseIndex = RANK_PROGRESSION.indexOf(rank as string)
        const newIndex = Math.min(baseIndex + ups, RANK_PROGRESSION.length - 1)
        result[skill] = RANK_PROGRESSION[newIndex] as SkillRank
      }
    }
    return result
  })

  // --- P1: Feature Allocation State ---
  const featureChoices = ref<string[]>([])

  const featuresTotal = computed(() =>
    (summary.value?.totalFeatures ?? 0) + milestoneBonusFeatures.value
  )

  const featuresRemaining = computed(() =>
    featuresTotal.value - featureChoices.value.length
  )

  // --- P1: Class Choices ---
  const newClassChoices = ref<string[]>([])

  /** Class choice milestone levels crossed in this advancement */
  const classChoiceLevels = computed(() =>
    summary.value?.classChoicePrompts ?? []
  )

  // --- Initialize ---
  function initialize(char: HumanCharacter, targetLevel: number): void {
    character.value = char
    oldLevel.value = char.level
    newLevel.value = targetLevel
    isActive.value = true

    // Reset all allocations
    Object.assign(statAllocations, {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    })
    milestoneChoices.value = {}
    edgeChoices.value = []
    bonusSkillEdgeChoices.value = []
    featureChoices.value = []
    newClassChoices.value = []
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
    milestoneChoices.value = {}
    edgeChoices.value = []
    bonusSkillEdgeChoices.value = []
    featureChoices.value = []
    newClassChoices.value = []
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

  // --- P1: Milestone Actions ---
  function setMilestoneChoice(milestoneLevel: number, choiceId: MilestoneChoiceId): void {
    milestoneChoices.value = {
      ...milestoneChoices.value,
      [milestoneLevel]: choiceId
    }
  }

  // --- P1: Edge Actions ---
  function addEdge(edgeName: string): void {
    if (edgesRemaining.value <= 0) return
    edgeChoices.value = [...edgeChoices.value, edgeName]
  }

  function removeEdge(index: number): void {
    edgeChoices.value = edgeChoices.value.filter((_, i) => i !== index)
  }

  function addBonusSkillEdge(skill: PtuSkillName, fromLevel: number): void {
    // Validate: not already chosen for this level's slot
    const alreadyChosen = bonusSkillEdgeChoices.value.some(c => c.fromLevel === fromLevel)
    if (alreadyChosen) return

    // Validate: skill rank is not at cap for target level
    const effectiveRank = getEffectiveSkillRank(skill)
    const maxRank = getMaxSkillRankForLevel(newLevel.value)
    if (effectiveRank === maxRank || effectiveRank === 'Master') return

    // Validate: next rank is not the restricted rank for this level's bonus
    const entry = bonusSkillEdgeEntries.value.find(e => e.level === fromLevel)
    if (entry) {
      const currentIndex = RANK_PROGRESSION.indexOf(effectiveRank)
      const nextRank = RANK_PROGRESSION[currentIndex + 1]
      if (nextRank === entry.restrictedRank) return
    }

    bonusSkillEdgeChoices.value = [...bonusSkillEdgeChoices.value, { skill, fromLevel }]
  }

  function removeBonusSkillEdge(index: number): void {
    bonusSkillEdgeChoices.value = bonusSkillEdgeChoices.value.filter((_, i) => i !== index)
  }

  // --- P1: Feature Actions ---
  function addFeature(featureName: string): void {
    if (featuresRemaining.value <= 0) return
    featureChoices.value = [...featureChoices.value, featureName]
  }

  function removeFeature(index: number): void {
    featureChoices.value = featureChoices.value.filter((_, i) => i !== index)
  }

  // --- P1: Class Actions ---
  function addClass(className: string): void {
    const currentTotal = (character.value?.trainerClasses?.length ?? 0) + newClassChoices.value.length
    if (currentTotal >= 4) return
    newClassChoices.value = [...newClassChoices.value, className]
  }

  function removeClass(className: string): void {
    newClassChoices.value = newClassChoices.value.filter(c => c !== className)
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
    if (edgesRemaining.value > 0) {
      w.push(`${edgesRemaining.value} edge(s) not selected`)
    }
    // Check for unfilled bonus Skill Edge slots
    const unfilledBonusSlots = bonusSkillEdgeEntries.value.length - bonusSkillEdgeChoices.value.length
    if (unfilledBonusSlots > 0) {
      w.push(`${unfilledBonusSlots} bonus Skill Edge(s) not selected`)
    }
    if (featuresRemaining.value > 0) {
      w.push(`${featuresRemaining.value} feature(s) not selected`)
    }
    // Check for unresolved milestones
    const unresolvedMilestones = (summary.value?.milestones ?? []).filter(
      m => !milestoneChoices.value[m.level]
    )
    if (unresolvedMilestones.length > 0) {
      const names = unresolvedMilestones.map(m => m.name).join(', ')
      w.push(`Milestone choice(s) not made: ${names}`)
    }
    return w
  })

  // --- Build Update Payload ---
  function buildUpdatePayload(): Partial<HumanCharacter> {
    if (!character.value) return {}

    // Combine existing edges + new regular edges + bonus skill edges
    const allEdges = [
      ...character.value.edges,
      ...edgeChoices.value,
      ...bonusSkillEdgeChoices.value.map(c => `Skill Edge: ${c.skill}`)
    ]

    // Combine existing features + new features
    const allFeatures = [
      ...character.value.features,
      ...featureChoices.value
    ]

    // Combine existing classes + new classes
    const allClasses = [
      ...character.value.trainerClasses,
      ...newClassChoices.value
    ]

    // Apply ALL skill edge rank-ups to skills (bonus + regular)
    const updatedSkillsWithAllEdges: Record<string, SkillRank> = {
      ...(character.value.skills ?? {})
    }

    // Apply bonus skill edge rank-ups
    for (const { skill } of bonusSkillEdgeChoices.value) {
      const currentRank = (updatedSkillsWithAllEdges[skill] ?? 'Untrained') as string
      const currentIndex = RANK_PROGRESSION.indexOf(currentRank)
      if (currentIndex < RANK_PROGRESSION.length - 1) {
        updatedSkillsWithAllEdges[skill] = RANK_PROGRESSION[currentIndex + 1] as SkillRank
      }
    }

    // Apply regular skill edge rank-ups (from "Skill Edge: <skill>" entries in edgeChoices)
    for (const skillName of regularSkillEdgeSkills.value) {
      const currentRank = (updatedSkillsWithAllEdges[skillName] ?? 'Untrained') as string
      const currentIndex = RANK_PROGRESSION.indexOf(currentRank)
      if (currentIndex < RANK_PROGRESSION.length - 1) {
        updatedSkillsWithAllEdges[skillName] = RANK_PROGRESSION[currentIndex + 1] as SkillRank
      }
    }

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
      skills: updatedSkillsWithAllEdges as Record<string, SkillRank>,
      edges: allEdges,
      features: allFeatures,
      trainerClasses: allClasses
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
    // P1: Milestone state
    milestoneChoices: readonly(milestoneChoices),
    milestoneRetroactiveStatPoints,
    milestoneBonusEdges,
    milestoneBonusFeatures,
    setMilestoneChoice,
    // P1: Edge state
    edgeChoices: readonly(edgeChoices),
    bonusSkillEdgeChoices: readonly(bonusSkillEdgeChoices),
    regularSkillEdgeSkills,
    regularEdgesTotal,
    bonusSkillEdgeEntries,
    edgesRemaining,
    effectiveSkills,
    getEffectiveSkillRank,
    addEdge,
    removeEdge,
    addBonusSkillEdge,
    removeBonusSkillEdge,
    // P1: Feature state
    featureChoices: readonly(featureChoices),
    featuresTotal,
    featuresRemaining,
    addFeature,
    removeFeature,
    // P1: Class state
    newClassChoices: readonly(newClassChoices),
    classChoiceLevels,
    addClass,
    removeClass,
    // Warnings
    warnings,
    // Lifecycle
    initialize,
    reset,
    buildUpdatePayload
  }
}

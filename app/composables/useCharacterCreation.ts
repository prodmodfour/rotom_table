/**
 * Composable managing character creation form state.
 *
 * Encapsulates reactive form state, background application logic,
 * stat point tracking, validation warnings, and API payload building
 * for the PTU character creation flow.
 *
 * Reference: PTU Core Chapter 2 (pp. 12-18)
 */

import type { Stats, SkillRank, CharacterType } from '~/types/character'
import type { TrainerBackground } from '~/constants/trainerBackgrounds'
import type { PtuSkillName } from '~/constants/trainerSkills'
import { getDefaultSkills } from '~/constants/trainerSkills'
import {
  BASE_HP,
  BASE_OTHER,
  TOTAL_STAT_POINTS,
  MAX_POINTS_PER_STAT,
  getStatPointsForLevel,
  getMaxSkillRankForLevel,
  getExpectedEdgesForLevel,
  getExpectedFeaturesForLevel,
  isSkillRankAboveCap
} from '~/constants/trainerStats'
import { MAX_TRAINER_CLASSES } from '~/constants/trainerClasses'
import { validateStatAllocation, validateSkillBackground, validateEdgesAndFeatures } from '~/utils/characterCreationValidation'
import type { CreationWarning } from '~/utils/characterCreationValidation'

/** Starting edges at level 1 */
const STARTING_EDGES = 4
/** Default starting money for level 1 trainers (PTU Core p. 17) */
export const DEFAULT_STARTING_MONEY = 5000

export type CreateMode = 'quick' | 'full'

export interface StatPoints {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export interface SectionCompletion {
  label: string
  complete: boolean
  /** Count of filled items (e.g. "2/4 edges") or empty string */
  detail: string
}

export function useCharacterCreation() {
  const form = reactive({
    // Basic
    name: '',
    characterType: 'npc' as CharacterType,
    level: 1,
    location: '',
    avatarUrl: null as string | null,
    // Background
    backgroundPreset: null as TrainerBackground | null,
    backgroundName: '',
    isCustomBackground: false,
    // Skills
    skills: getDefaultSkills(),
    /** Skills marked Pathetic during background selection — cannot be raised by any means during creation (PTU pp. 14, 18; decree-027) */
    patheticSkills: [] as PtuSkillName[],
    // Stats
    statPoints: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    } as StatPoints,
    // Classes/Features/Edges (P1)
    trainerClasses: [] as string[],
    features: [] as string[],
    trainingFeature: '',
    edges: [] as string[],
    // Biography (P2)
    age: null as number | null,
    gender: '',
    height: null as number | null,
    weight: null as number | null,
    backgroundStory: '',
    personality: '',
    goals: '',
    money: DEFAULT_STARTING_MONEY,
    // Notes
    notes: ''
  })

  // --- Stat Point Tracking ---
  const statPointsUsed = computed(() =>
    Object.values(form.statPoints).reduce((sum, v) => sum + v, 0)
  )

  const statPointsRemaining = computed(() =>
    getStatPointsForLevel(form.level) - statPointsUsed.value
  )

  const computedStats = computed((): Stats => ({
    hp: BASE_HP + form.statPoints.hp,
    attack: BASE_OTHER + form.statPoints.attack,
    defense: BASE_OTHER + form.statPoints.defense,
    specialAttack: BASE_OTHER + form.statPoints.specialAttack,
    specialDefense: BASE_OTHER + form.statPoints.specialDefense,
    speed: BASE_OTHER + form.statPoints.speed
  }))

  /** PTU Trainer HP formula: Level * 2 + HP Stat * 3 + 10 */
  const maxHp = computed(() =>
    form.level * 2 + computedStats.value.hp * 3 + 10
  )

  /** Combat evasions derived from stats: floor(stat / 5), capped at +6 (PTU Core p. 16) */
  const evasions = computed(() => ({
    physical: Math.min(6, Math.floor(computedStats.value.defense / 5)),
    special: Math.min(6, Math.floor(computedStats.value.specialDefense / 5)),
    speed: Math.min(6, Math.floor(computedStats.value.speed / 5))
  }))

  // --- Stat Modification ---
  function incrementStat(stat: keyof StatPoints): void {
    // Per-stat cap only applies at level 1 (PTU Core p. 15)
    if (form.level === 1 && form.statPoints[stat] >= MAX_POINTS_PER_STAT) return
    if (statPointsRemaining.value <= 0) return
    form.statPoints = {
      ...form.statPoints,
      [stat]: form.statPoints[stat] + 1
    }
  }

  function decrementStat(stat: keyof StatPoints): void {
    if (form.statPoints[stat] <= 0) return
    form.statPoints = {
      ...form.statPoints,
      [stat]: form.statPoints[stat] - 1
    }
  }

  // --- Background Application ---
  function applyBackground(bg: TrainerBackground): void {
    const defaults = getDefaultSkills()
    const skills: Record<PtuSkillName, SkillRank> = {
      ...defaults,
      [bg.adeptSkill]: 'Adept' as SkillRank,
      [bg.noviceSkill]: 'Novice' as SkillRank,
      ...Object.fromEntries(bg.patheticSkills.map(s => [s, 'Pathetic' as SkillRank]))
    }
    form.skills = skills
    form.patheticSkills = [...bg.patheticSkills]
    form.backgroundPreset = bg
    form.backgroundName = bg.name
    form.isCustomBackground = false
  }

  function clearBackground(): void {
    form.skills = getDefaultSkills()
    form.patheticSkills = []
    form.backgroundPreset = null
    form.backgroundName = ''
    form.isCustomBackground = false
  }

  function enableCustomBackground(): void {
    form.skills = getDefaultSkills()
    form.patheticSkills = []
    form.backgroundPreset = null
    form.backgroundName = ''
    form.isCustomBackground = true
  }

  /**
   * Set a single skill rank in custom background mode.
   * Blocks raising a Pathetic-locked skill above Pathetic during creation (PTU pp. 14, 18; decree-027).
   * Returns an error string if blocked, or null on success.
   */
  function setSkillRank(skill: PtuSkillName, rank: SkillRank): string | null {
    if (form.patheticSkills.includes(skill) && rank !== 'Pathetic') {
      return `${skill} is Pathetic and cannot be raised during character creation (PTU pp. 14, 18; decree-027)`
    }
    form.skills = {
      ...form.skills,
      [skill]: rank
    }
    return null
  }

  /**
   * Mark a skill as Pathetic during custom background selection.
   * Adds the skill to the Pathetic tracking set and lowers its rank.
   */
  function addPatheticSkill(skill: PtuSkillName): void {
    if (!form.patheticSkills.includes(skill)) {
      form.patheticSkills = [...form.patheticSkills, skill]
    }
    form.skills = {
      ...form.skills,
      [skill]: 'Pathetic' as SkillRank
    }
  }

  /**
   * Remove a skill from Pathetic tracking during custom background selection.
   * Removes the skill from the tracking set and resets its rank to Untrained.
   *
   * Safety guard: blocks removal if outstanding Skill Edge entries reference
   * this skill (should never happen now that addSkillEdge blocks Pathetic
   * skills per decree-027, but kept as a defensive check).
   *
   * Returns an error string if blocked, or null on success.
   */
  function removePatheticSkill(skill: PtuSkillName): string | null {
    const outstandingEdges = form.edges.filter(e => e === `Skill Edge: ${skill}`)
    if (outstandingEdges.length > 0) {
      return `Cannot remove Pathetic lock from ${skill} while ${outstandingEdges.length} Skill Edge(s) reference it. Remove the Skill Edge(s) first.`
    }
    form.patheticSkills = form.patheticSkills.filter(s => s !== skill)
    form.skills = {
      ...form.skills,
      [skill]: 'Untrained' as SkillRank
    }
    return null
  }

  // --- Trainer Classes ---
  /**
   * Add a trainer class. For branching classes (decree-022), the className
   * should include the specialization suffix (e.g. 'Type Ace: Fire').
   * Blocks exact duplicates but allows different specializations of the same base class.
   */
  function addClass(className: string): void {
    if (form.trainerClasses.length >= MAX_TRAINER_CLASSES) return
    // Block exact duplicates (same class + same specialization)
    if (form.trainerClasses.includes(className)) return
    form.trainerClasses = [...form.trainerClasses, className]
  }

  function removeClass(className: string): void {
    form.trainerClasses = form.trainerClasses.filter(c => c !== className)
  }

  // --- Features ---
  /** All features combined: class features + training feature */
  const allFeatures = computed((): string[] =>
    form.trainingFeature
      ? [...form.features, form.trainingFeature]
      : [...form.features]
  )

  function addFeature(featureName: string): void {
    form.features = [...form.features, featureName]
  }

  function removeFeature(index: number): void {
    form.features = form.features.filter((_, i) => i !== index)
  }

  function setTrainingFeature(featureName: string): void {
    form.trainingFeature = featureName
  }

  // --- Edges ---
  function addEdge(edgeName: string): void {
    form.edges = [...form.edges, edgeName]
  }

  function removeEdge(index: number): void {
    const edge = form.edges[index]

    // If removing a Skill Edge, revert the skill rank it granted
    const skillEdgeMatch = edge?.match(/^Skill Edge: (.+)$/)
    if (skillEdgeMatch) {
      const skill = skillEdgeMatch[1] as PtuSkillName
      const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
      const currentIndex = rankProgression.indexOf(form.skills[skill])
      if (currentIndex > 0) {
        form.skills = {
          ...form.skills,
          [skill]: rankProgression[currentIndex - 1]
        }
      }
    }

    form.edges = form.edges.filter((_, i) => i !== index)
  }

  /**
   * Add a Skill Edge that raises a skill rank by one step.
   * Adds "Skill Edge: [Skill Name]" to edges and bumps the skill rank.
   *
   * PTU p. 41 — Basic Skills: Untrained → Novice.
   * Adept Skills (Lv2): Novice → Adept. Expert Skills (Lv6): Adept → Expert.
   * Master Skills (Lv12): Expert → Master.
   *
   * decree-027: Pathetic skills cannot be raised via Skill Edges during
   * character creation. The Pathetic→Untrained progression from p. 41
   * applies only post-creation during leveling.
   */
  function addSkillEdge(skill: PtuSkillName): string | null {
    // decree-027: Block Skill Edges from raising Pathetic-locked skills (PTU pp. 14, 18)
    if (form.patheticSkills.includes(skill)) {
      return `${skill} is Pathetic and cannot be raised during character creation — not even by Skill Edges (PTU pp. 14, 18; decree-027)`
    }

    const currentRank = form.skills[skill]
    const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
    const currentIndex = rankProgression.indexOf(currentRank)
    const nextRank = rankProgression[currentIndex + 1]

    if (!nextRank) {
      return `${skill} is already at Master rank`
    }

    // Skill rank cap based on level (PTU Core p. 13, 19)
    if (isSkillRankAboveCap(nextRank, form.level)) {
      return `Cannot raise ${skill} above ${getMaxSkillRankForLevel(form.level)} at level ${form.level} (PTU p. 13, 19)`
    }

    form.skills = {
      ...form.skills,
      [skill]: nextRank
    }
    form.edges = [...form.edges, `Skill Edge: ${skill}`]
    return null
  }

  /** Expected non-training features for the current level (total features minus the training slot) */
  const expectedFeatures = computed(() =>
    getExpectedFeaturesForLevel(form.level) - 1
  )

  // --- Validation (soft warnings) ---
  const statWarnings = computed((): CreationWarning[] =>
    validateStatAllocation(form.statPoints, form.level)
  )

  const skillWarnings = computed((): CreationWarning[] =>
    validateSkillBackground(form.skills, form.level, form.edges, form.patheticSkills)
  )

  const classFeatureEdgeWarnings = computed((): CreationWarning[] =>
    validateEdgesAndFeatures(form.edges, allFeatures.value, form.trainerClasses, form.level)
  )

  const allWarnings = computed((): CreationWarning[] => [
    ...statWarnings.value,
    ...skillWarnings.value,
    ...classFeatureEdgeWarnings.value
  ])

  // --- Section Completion (for Full Create mode indicators) ---
  const sectionCompletion = computed((): Record<string, SectionCompletion> => {
    const hasBackground = Boolean(form.backgroundName || form.isCustomBackground)
    const skillsWithRanks = Object.values(form.skills).filter(r => r !== 'Untrained').length

    return {
      basicInfo: {
        label: 'Basic Info',
        complete: Boolean(form.name),
        detail: form.name ? '' : 'Name required'
      },
      background: {
        label: 'Background & Skills',
        complete: hasBackground,
        detail: hasBackground ? `${skillsWithRanks} skills set` : 'No background'
      },
      edges: {
        label: 'Edges',
        complete: form.edges.length === getExpectedEdgesForLevel(form.level).total,
        detail: `${form.edges.length}/${getExpectedEdgesForLevel(form.level).total}`
      },
      classes: {
        label: 'Classes & Features',
        complete: form.trainerClasses.length > 0 && allFeatures.value.length > 0,
        detail: `${form.trainerClasses.length} classes, ${allFeatures.value.length} features`
      },
      stats: {
        label: 'Combat Stats',
        complete: statPointsRemaining.value === 0,
        detail: `${statPointsUsed.value}/${getStatPointsForLevel(form.level)} points`
      },
      biography: {
        label: 'Biography',
        complete: Boolean(form.backgroundStory || form.personality || form.goals),
        detail: [
          form.age != null ? 'age' : '',
          form.gender ? 'gender' : '',
          form.backgroundStory ? 'story' : '',
          form.personality ? 'personality' : '',
          form.goals ? 'goals' : ''
        ].filter(Boolean).join(', ') || 'Optional'
      }
    }
  })

  // --- API Payload ---
  function buildCreatePayload() {
    // Background story takes precedence over preset name for the DB field
    const backgroundValue = form.backgroundStory || form.backgroundName || undefined

    return {
      name: form.name,
      characterType: form.characterType,
      level: form.level,
      location: form.location || undefined,
      avatarUrl: form.avatarUrl || undefined,
      stats: computedStats.value,
      maxHp: maxHp.value,
      currentHp: maxHp.value,
      skills: form.skills,
      trainerClasses: form.trainerClasses.length > 0 ? form.trainerClasses : undefined,
      features: allFeatures.value.length > 0 ? allFeatures.value : undefined,
      edges: form.edges.length > 0 ? form.edges : undefined,
      background: backgroundValue,
      notes: form.notes || undefined,
      // Biography fields
      age: form.age ?? undefined,
      gender: form.gender || undefined,
      height: form.height ?? undefined,
      weight: form.weight ?? undefined,
      personality: form.personality || undefined,
      goals: form.goals || undefined,
      money: form.money
    }
  }

  return {
    form,
    // Stat tracking
    statPointsUsed,
    statPointsRemaining,
    computedStats,
    maxHp,
    evasions,
    // Stat modification
    incrementStat,
    decrementStat,
    // Background
    applyBackground,
    clearBackground,
    enableCustomBackground,
    setSkillRank,
    addPatheticSkill,
    removePatheticSkill,
    // Classes
    addClass,
    removeClass,
    // Features
    allFeatures,
    addFeature,
    removeFeature,
    setTrainingFeature,
    // Edges
    addEdge,
    removeEdge,
    addSkillEdge,
    // Section completion
    sectionCompletion,
    // Validation
    statWarnings,
    skillWarnings,
    classFeatureEdgeWarnings,
    allWarnings,
    // API
    buildCreatePayload,
    // Computed expectations
    expectedFeatures,
    // Constants (exposed for components)
    BASE_HP,
    BASE_OTHER,
    TOTAL_STAT_POINTS,
    MAX_POINTS_PER_STAT,
    STARTING_EDGES,
    MAX_TRAINER_CLASSES,
    DEFAULT_STARTING_MONEY
  }
}

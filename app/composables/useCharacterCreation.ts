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
import { BASE_HP, BASE_OTHER, TOTAL_STAT_POINTS, MAX_POINTS_PER_STAT } from '~/constants/trainerStats'
import { MAX_TRAINER_CLASSES } from '~/constants/trainerClasses'
import { validateStatAllocation, validateSkillBackground, validateEdgesAndFeatures } from '~/utils/characterCreationValidation'
import type { CreationWarning } from '~/utils/characterCreationValidation'

/** Maximum features at level 1: 4 class features + 1 Training Feature */
const MAX_FEATURES = 4
/** Starting edges at level 1 */
const STARTING_EDGES = 4

export interface StatPoints {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

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
    isCustomBackground: false,
    // Skills
    skills: getDefaultSkills(),
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
    // Notes
    notes: ''
  })

  // --- Stat Point Tracking ---
  const statPointsUsed = computed(() =>
    Object.values(form.statPoints).reduce((sum, v) => sum + v, 0)
  )

  const statPointsRemaining = computed(() => TOTAL_STAT_POINTS - statPointsUsed.value)

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
    if (form.statPoints[stat] >= MAX_POINTS_PER_STAT) return
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
    form.backgroundPreset = bg
    form.backgroundName = bg.name
    form.isCustomBackground = false
  }

  function clearBackground(): void {
    form.skills = getDefaultSkills()
    form.backgroundPreset = null
    form.backgroundName = ''
    form.isCustomBackground = false
  }

  function enableCustomBackground(): void {
    form.skills = getDefaultSkills()
    form.backgroundPreset = null
    form.backgroundName = ''
    form.isCustomBackground = true
  }

  /** Set a single skill rank in custom background mode */
  function setSkillRank(skill: PtuSkillName, rank: SkillRank): void {
    form.skills = {
      ...form.skills,
      [skill]: rank
    }
  }

  // --- Trainer Classes ---
  function addClass(className: string): void {
    if (form.trainerClasses.length >= MAX_TRAINER_CLASSES) return
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
    if (form.features.length >= MAX_FEATURES) return
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
    form.edges = form.edges.filter((_, i) => i !== index)
  }

  /**
   * Add a Skill Edge that raises a skill rank.
   * Adds "Skill Edge: [Skill Name]" to edges and bumps the skill rank by one step.
   * Cannot raise Pathetic skills (PTU p. 14) or exceed Novice at level 1 (PTU p. 13).
   */
  function addSkillEdge(skill: PtuSkillName): string | null {
    const currentRank = form.skills[skill]
    if (currentRank === 'Pathetic') {
      return 'Cannot raise Pathetic skills with Skill Edges (PTU p. 14)'
    }

    const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
    const currentIndex = rankProgression.indexOf(currentRank)
    const nextRank = rankProgression[currentIndex + 1]

    if (!nextRank) {
      return `${skill} is already at Master rank`
    }

    // Level 1 cap: cannot exceed Novice via Skill Edges during creation
    if (form.level === 1 && (nextRank === 'Adept' || nextRank === 'Expert' || nextRank === 'Master')) {
      return `Cannot raise ${skill} above Novice at level 1 (PTU p. 13)`
    }

    form.skills = {
      ...form.skills,
      [skill]: nextRank
    }
    form.edges = [...form.edges, `Skill Edge: ${skill}`]
    return null
  }

  // --- Validation (soft warnings) ---
  const statWarnings = computed((): CreationWarning[] =>
    validateStatAllocation(form.statPoints, form.level)
  )

  const skillWarnings = computed((): CreationWarning[] =>
    validateSkillBackground(form.skills, form.level)
  )

  const classFeatureEdgeWarnings = computed((): CreationWarning[] =>
    validateEdgesAndFeatures(form.edges, allFeatures.value, form.trainerClasses, form.level)
  )

  const allWarnings = computed((): CreationWarning[] => [
    ...statWarnings.value,
    ...skillWarnings.value,
    ...classFeatureEdgeWarnings.value
  ])

  // --- API Payload ---
  function buildCreatePayload() {
    return {
      name: form.name,
      characterType: form.characterType,
      level: form.level,
      location: form.location || undefined,
      stats: computedStats.value,
      maxHp: maxHp.value,
      currentHp: maxHp.value,
      skills: form.skills,
      trainerClasses: form.trainerClasses.length > 0 ? form.trainerClasses : undefined,
      features: allFeatures.value.length > 0 ? allFeatures.value : undefined,
      edges: form.edges.length > 0 ? form.edges : undefined,
      background: form.backgroundName || undefined,
      notes: form.notes || undefined
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
    // Validation
    statWarnings,
    skillWarnings,
    classFeatureEdgeWarnings,
    allWarnings,
    // API
    buildCreatePayload,
    // Constants (exposed for components)
    BASE_HP,
    BASE_OTHER,
    TOTAL_STAT_POINTS,
    MAX_POINTS_PER_STAT,
    MAX_FEATURES,
    STARTING_EDGES,
    MAX_TRAINER_CLASSES
  }
}
